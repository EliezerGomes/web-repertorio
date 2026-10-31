import { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { fetchSingers } from "./singers";
import { SINGER_IDS } from "../constants/singers";
import { formatWeekKey, getMondayOfWeek } from "../utils/schedule/calendar";
import { resolveMonthPlan, dateLabel, getNextScheduleMonth } from "../utils/schedule/monthPlan";
import { isSingerEligibleForService } from "../utils/schedule/rules";

export type Worship = {
  id: string; day: string; description: string; hour: string; Icon: string;
  enable: boolean; singers: string[]; date?: string;
};
export type MonthlyResult = {
  month: string; created: number;
  assignments: { day: string; description: string; active: boolean; singerNames: string[] }[];
  warnings: string[];
};

export async function fetchWorships(): Promise<Worship[]> {
  const snap = await getDocs(collection(db, "worship"));
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Worship);
}

const weekOf = (date: string) => formatWeekKey(getMondayOfWeek(new Date(`${date}T12:00:00`)));

export async function fetchGeneratedMonth(worships: Worship[]): Promise<string> {
  const snapshot = await getDoc(doc(db, "scheduleSettings", "current"));
  const month = snapshot.data()?.month;
  if (typeof month === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return month;
  // Compatibilidade com escalas geradas antes do registro do mês publicado.
  return worships.flatMap((w) => w.date ? [w.date.slice(0, 7)] : []).sort().at(-1)
    ?? getNextScheduleMonth();
}

export async function generateMonthlySchedule(): Promise<MonthlyResult> {
  const month = getNextScheduleMonth();
  const plan = resolveMonthPlan(month);
  const [singers, existing] = await Promise.all([fetchSingers(), fetchWorships()]);
  const currentWeek = formatWeekKey(getMondayOfWeek(new Date()));
  // Reutiliza os IDs da escala atual: seus repertórios continuam vinculados ao mesmo culto.
  const targets = plan.map((service) => {
    const dated = existing.find((w) => w.date === service.date && w.day === service.day && (Number(w.hour.split(":")[0]) < 12) === (service.period === "manha"));
    const legacy = service.weekKey === currentWeek ? existing.find((w) => !w.date && w.enable && w.day === service.day && (Number(w.hour.split(":")[0]) < 12) === (service.period === "manha")) : undefined;
    return { service, id: dated?.id ?? legacy?.id ?? service.id };
  });

  return runTransaction(db, async (transaction) => {
    const snapshots = await Promise.all(targets.map((t) => transaction.get(doc(db, "worship", t.id))));
    const working = existing.filter((w) => w.date).map((w) => ({ ...w }));
    const result: MonthlyResult = { month, created: 0, assignments: [], warnings: [] };
    // Inclui os cultos preservados antes de preencher vagas, mesmo nas bordas do mês.
    snapshots.forEach((snap, i) => {
      if (!snap.exists()) return;
      const worship = { ...snap.data(), id: snap.id, date: targets[i].service.date } as Worship;
      const index = working.findIndex((w) => w.id === snap.id);
      if (index >= 0) working[index] = worship; else working.push(worship);
    });
    const priority = ["sexta-valentes", "sexta-princesas", "sexta-tribo-leoes", "alinhamento", "familia", "gloria"];
    const ordered = targets.map((t, i) => ({ ...t, snapshot: snapshots[i] })).sort((a, b) => a.service.weekKey.localeCompare(b.service.weekKey) || priority.indexOf(a.service.key) - priority.indexOf(b.service.key));
    for (const { service, id, snapshot } of ordered) {
      if (snapshot.exists()) {
        if (!snapshot.data().date) transaction.update(snapshot.ref, { date: service.date });
        continue;
      }
      const priorMonday = new Date(`${service.weekKey}T12:00:00`);
      priorMonday.setDate(priorMonday.getDate() - 7);
      const previousWeek = formatWeekKey(priorMonday);
      const enabled = working.filter((w) => w.enable && w.date);
      const ingridEligibleThisWeek = !enabled.some((w) => weekOf(w.date!) === previousWeek && w.singers.includes(SINGER_IDS.INGRID));
      const count = (id: string, week?: string) => enabled.filter((w) => w.singers.includes(id) && (week ? weekOf(w.date!) === week : w.date! < service.weekKey)).length;
      const lastDate = (id: string) => enabled.filter((w) => w.date! < service.weekKey && w.singers.includes(id)).map((w) => w.date!).sort().at(-1) ?? "";
      const chosen = singers.filter((s) => s.active && count(s.id, service.weekKey) < 2 && isSingerEligibleForService(s.id, service.key, { ingridEligibleThisWeek }))
        .sort((a, b) => count(a.id) - count(b.id) || lastDate(a.id).localeCompare(lastDate(b.id)) || count(a.id, service.weekKey) - count(b.id, service.weekKey) || a.name.localeCompare(b.name))
        .slice(0, service.seats);
      const worship: Worship = {
        id, date: service.date, day: service.day, description: service.description!,
        hour: service.key === "familia" ? "19:00" : service.key === "gloria" ? "09:00" : "19:30",
        Icon: service.period === "manha" ? "PiSunFill" : "PiMoonFill",
        enable: true, singers: chosen.map((s) => s.id),
      };
      const { id: _id, ...data } = worship;
      transaction.set(doc(db, "worship", id), data);
      working.push(worship);
      result.created++;
      if (chosen.length < service.seats) result.warnings.push(`${dateLabel(service.date)} — ${service.description}: ${chosen.length}/${service.seats} cantores disponíveis. Ajuste a escala nas configurações.`);
    }
    result.assignments = working.filter((w) => w.date?.startsWith(month)).sort((a, b) => a.date!.localeCompare(b.date!) || a.hour.localeCompare(b.hour)).map((w) => ({
      day: `${dateLabel(w.date!)} · ${w.day}`, description: w.description, active: w.enable,
      singerNames: w.singers.map((id) => singers.find((s) => s.id === id)?.name ?? id),
    }));
    transaction.set(doc(db, "scheduleSettings", "current"), { month, generatedAt: serverTimestamp() });
    return result;
  });
}
