import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { SINGER_IDS } from "../constants/singers";
import {
  formatDatePtBr,
  formatWeekKey,
  getWeekDates,
} from "../utils/schedule/calendar";
import {
  resolveNextWeekPlan,
  type ServiceKey,
  type ServicePlan,
} from "../utils/schedule/weekPlan";
import { isSingerEligibleForService } from "../utils/schedule/rules";

// Máximo de cultos que um mesmo cantor pode assumir na semana.
const MAX_SERVICES_PER_WEEK = 2;

// Quantas semanas de histórico olhar para calcular quem cantou menos.
const HISTORY_LOOKBACK_WEEKS = 16;

// Ordem em que os cultos são preenchidos: do mais restrito para o mais livre,
// pra evitar que um culto "fácil" leve o único cantor elegível de um culto
// mais restrito (ex.: Valentes só aceita o Erick).
const ASSIGNMENT_PRIORITY: ServiceKey[] = [
  "sexta-valentes",
  "sexta-princesas",
  "sexta-tribo-leoes",
  "alinhamento",
  "familia",
  "gloria",
];

type WorshipDoc = {
  id: string;
  day: string;
  description: string;
  hour: string;
  Icon: string;
  enable: boolean;
  singers: string[];
};

type ScaleHistoryEntry = {
  day: string;
  description: string;
  singers: string[];
};

type ScaleHistoryDoc = {
  weekKey: string;
  entries: ScaleHistoryEntry[];
};

type SingerRoster = { id: string; name: string };

type WorkingCandidate = {
  id: string;
  name: string;
  timesScheduled: number;
  /** índice (0 = semana mais recente) da última vez que cantou; Infinity = nunca. */
  lastSungIndex: number;
  weeklyCount: number;
};

export type GenerateScheduleResult = {
  weekKey: string;
  weekLabel: string;
  assignments: Array<{
    day: string;
    description: string;
    active: boolean;
    singerNames: string[];
  }>;
  warnings: string[];
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const parseHour = (hour?: string): number => {
  if (!hour) return 0;
  const n = Number(hour.split(":")[0]);
  return Number.isNaN(n) ? 0 : n;
};

const DEFAULT_ICON_BY_PERIOD: Record<"manha" | "noite", string> = {
  manha: "PiSunFill",
  noite: "PiMoonFill",
};

const DEFAULT_HOUR_BY_KEY: Record<ServiceKey, string> = {
  alinhamento: "19:30",
  "sexta-sem-culto": "19:30",
  "sexta-princesas": "19:30",
  "sexta-valentes": "19:30",
  "sexta-tribo-leoes": "19:30",
  familia: "19:00",
  gloria: "09:00",
};

/**
 * Encontra o culto (documento do Firestore) correspondente a esse item do
 * plano semanal. Domingo tem dois cultos (manhã/noite), diferenciados pelo
 * horário. Se ainda não existir (ex.: primeira geração da Manhã de Glória),
 * cria o documento desabilitado, pra o admin poder ajustar depois.
 */
async function findOrCreateWorshipDoc(
  allWorships: WorshipDoc[],
  service: ServicePlan,
): Promise<WorshipDoc> {
  const dayNormalized = normalize(service.day);
  const candidates = allWorships.filter(
    (w) => normalize(w.day) === dayNormalized,
  );

  let match: WorshipDoc | undefined;
  if (service.day === "Domingo") {
    match = candidates.find((w) =>
      service.period === "manha"
        ? parseHour(w.hour) < 12
        : parseHour(w.hour) >= 12,
    );
  } else {
    match = candidates[0];
  }

  if (match) return match;

  const newDocData = {
    day: service.day,
    description: service.description ?? "",
    hour: DEFAULT_HOUR_BY_KEY[service.key],
    Icon: DEFAULT_ICON_BY_PERIOD[service.period],
    enable: false,
    singers: [] as string[],
  };
  const ref = await addDoc(collection(db, "worship"), newDocData);
  return { id: ref.id, ...newDocData };
}

async function fetchSingers(): Promise<SingerRoster[]> {
  const snap = await getDocs(collection(db, "singers"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

async function fetchRecentHistory(
  excludingWeekKey: string,
): Promise<ScaleHistoryDoc[]> {
  const q = query(
    collection(db, "scaleHistory"),
    orderBy("weekKey", "desc"),
    limit(HISTORY_LOOKBACK_WEEKS),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as ScaleHistoryDoc)
    .filter((entry) => entry.weekKey !== excludingWeekKey);
}

function buildCandidates(
  singers: SingerRoster[],
  historyMostRecentFirst: ScaleHistoryEntry[][],
): WorkingCandidate[] {
  return singers.map((s) => {
    let timesScheduled = 0;
    let lastSungIndex = Infinity;
    historyMostRecentFirst.forEach((weekEntries, idx) => {
      const sangThisWeek = weekEntries.some((e) => e.singers.includes(s.id));
      if (sangThisWeek) {
        timesScheduled += 1;
        if (lastSungIndex === Infinity) lastSungIndex = idx;
      }
    });
    return {
      id: s.id,
      name: s.name,
      timesScheduled,
      lastSungIndex,
      weeklyCount: 0,
    };
  });
}

function pickSingersForService(
  pool: WorkingCandidate[],
  service: ServicePlan,
  ingridEligibleThisWeek: boolean,
): { chosenIds: string[]; warning?: string } {
  const eligible = pool.filter(
    (c) =>
      c.weeklyCount < MAX_SERVICES_PER_WEEK &&
      isSingerEligibleForService(c.id, service.key, { ingridEligibleThisWeek }),
  );

  eligible.sort((a, b) => {
    if (a.timesScheduled !== b.timesScheduled) {
      return a.timesScheduled - b.timesScheduled;
    }
    if (a.lastSungIndex !== b.lastSungIndex) {
      // maior índice = cantou há mais tempo (ou nunca) = prioridade
      return b.lastSungIndex - a.lastSungIndex;
    }
    return 0;
  });

  const chosen = eligible.slice(0, service.seats);
  chosen.forEach((c) => {
    c.weeklyCount += 1;
    c.timesScheduled += 1; // conta como oportunidade já usada nesta rodada
  });

  const chosenIds = chosen.map((c) => c.id);
  const warning =
    chosenIds.length < service.seats
      ? `"${service.description}" ficou com ${chosenIds.length}/${service.seats} cantor(es) — não havia gente elegível/disponível suficiente. Ajuste manualmente.`
      : undefined;

  return { chosenIds, warning };
}

/**
 * Gera a escala da PRÓXIMA semana (cultos + cantores), respeitando:
 * - Calendário mensal (quarta = Alinhamento, sexta rotativa, domingo =
 *   Família + Manhã de Glória no 1º domingo do mês).
 * - Rodízio quinzenal da pastora Ingrid.
 * - Restrições de Erick/Princesas, gênero/Valentes e Ingrid/Tribo de Leões.
 * - Máximo de 2 cultos por cantor na semana.
 * - Prioridade para quem cantou menos / há mais tempo não canta.
 *
 * Também limpa os louvores (repertoire) dos cultos afetados e grava um
 * histórico da escala (coleção scaleHistory) usado para calcular a
 * prioridade e o rodízio da Ingrid nas próximas gerações.
 */
export async function generateWeeklySchedule(
  reference: Date = new Date(),
): Promise<GenerateScheduleResult> {
  const worshipSnap = await getDocs(collection(db, "worship"));
  const allWorships: WorshipDoc[] = worshipSnap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as any) }) as WorshipDoc,
  );

  // 1. Congela o estado atual (a semana que está no ar agora) no histórico,
  // pra sabermos quem cantou essa semana antes de sobrescrever tudo.
  const currentWeekKey = formatWeekKey(getWeekDates(reference).wednesday);
  const currentLiveEntries: ScaleHistoryEntry[] = allWorships
    .filter((w) => w.enable)
    .map((w) => ({
      day: w.day,
      description: w.description,
      singers: w.singers || [],
    }));

  await setDoc(doc(db, "scaleHistory", currentWeekKey), {
    weekKey: currentWeekKey,
    entries: currentLiveEntries,
    capturedAt: serverTimestamp(),
  });

  const ingridSangThisWeek = currentLiveEntries.some((e) =>
    e.singers.includes(SINGER_IDS.INGRID),
  );
  const ingridEligibleNextWeek = !ingridSangThisWeek;

  // 2. Monta o plano da semana seguinte e o histórico usado pra prioridade.
  const plan = resolveNextWeekPlan(reference);
  const olderHistory = await fetchRecentHistory(currentWeekKey);
  const historyMostRecentFirst: ScaleHistoryEntry[][] = [
    currentLiveEntries,
    ...olderHistory.map((h) => h.entries),
  ];

  const singers = await fetchSingers();
  const candidates = buildCandidates(singers, historyMostRecentFirst);

  // 3. Escala os cultos ativos, na ordem dos mais restritos pros mais livres.
  const activeServices = plan.services.filter((s) => s.active);
  const orderedServices = [...activeServices].sort(
    (a, b) =>
      ASSIGNMENT_PRIORITY.indexOf(a.key) - ASSIGNMENT_PRIORITY.indexOf(b.key),
  );

  const warnings: string[] = [];
  const assignmentsByKey = new Map<ServiceKey, string[]>();

  orderedServices.forEach((service) => {
    const { chosenIds, warning } = pickSingersForService(
      candidates,
      service,
      ingridEligibleNextWeek,
    );
    assignmentsByKey.set(service.key, chosenIds);
    if (warning) warnings.push(warning);
  });

  if (!ingridEligibleNextWeek) {
    warnings.push(
      "Pastora Ingrid está de folga nesta semana (rodízio quinzenal).",
    );
  }

  // 4. Grava tudo no Firestore: atualiza/cria os cultos, limpa os louvores
  // antigos e salva o histórico da nova semana.
  const affectedWorshipIds: string[] = [];
  const nextWeekEntries: ScaleHistoryEntry[] = [];
  const singerNameById = new Map(singers.map((s) => [s.id, s.name]));

  const assignments: GenerateScheduleResult["assignments"] = [];

  for (const service of plan.services) {
    const worshipDoc = await findOrCreateWorshipDoc(allWorships, service);
    affectedWorshipIds.push(worshipDoc.id);

    const chosenIds = assignmentsByKey.get(service.key) ?? [];

    if (service.active) {
      await updateDoc(doc(db, "worship", worshipDoc.id), {
        description: service.description,
        enable: true,
        singers: chosenIds,
      });
      nextWeekEntries.push({
        day: service.day,
        description: service.description ?? "",
        singers: chosenIds,
      });
    } else {
      await updateDoc(doc(db, "worship", worshipDoc.id), {
        enable: false,
        singers: [],
      });
    }

    assignments.push({
      day: service.day,
      description: service.description ?? "Sem culto",
      active: service.active,
      singerNames: chosenIds.map((id) => singerNameById.get(id) ?? id),
    });
  }

  // Limpa os louvores de todos os cultos afetados (ativos ou não) pra
  // ninguém ver o repertório da semana anterior.
  if (affectedWorshipIds.length > 0) {
    const repertoireQuery = query(
      collection(db, "repertoire"),
      where("id_worship", "in", affectedWorshipIds),
    );
    const repertoireSnap = await getDocs(repertoireQuery);
    await Promise.all(
      repertoireSnap.docs.map((d) => deleteDoc(doc(db, "repertoire", d.id))),
    );
  }

  await setDoc(doc(db, "scaleHistory", plan.weekKey), {
    weekKey: plan.weekKey,
    entries: nextWeekEntries,
    generatedAt: serverTimestamp(),
  });

  return {
    weekKey: plan.weekKey,
    weekLabel: `${formatDatePtBr(plan.wednesday)} a ${formatDatePtBr(plan.sunday)}`,
    assignments,
    warnings,
  };
}
