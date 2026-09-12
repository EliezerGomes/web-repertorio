import {
  formatWeekKey,
  getNextWeekDates,
  getOccurrenceInMonth,
  isFirstOccurrenceInMonth,
} from "./calendar";

// Chaves internas que identificam cada culto da semana, já diferenciando
// qual variação de sexta-feira é (a descrição muda a cada mês, mas as
// regras de elegibilidade dependem de qual delas é).
export type ServiceKey =
  | "alinhamento" // Quarta-feira
  | "sexta-sem-culto" // 1ª/5ª sexta do mês: não há culto
  | "sexta-princesas" // 2ª sexta do mês
  | "sexta-valentes" // 3ª sexta do mês
  | "sexta-tribo-leoes" // 4ª sexta do mês
  | "familia" // Domingo à noite
  | "gloria"; // Domingo de manhã (só no 1º domingo do mês)

export type ServicePlan = {
  key: ServiceKey;
  day: "Quarta-feira" | "Sexta-feira" | "Domingo";
  /** Período do dia, usado para diferenciar os dois cultos de domingo. */
  period: "manha" | "noite";
  /** Descrição a ser salva no culto. Null quando não há culto nessa semana. */
  description: string | null;
  active: boolean;
  /** Quantas vagas de cantor esse culto tem. */
  seats: number;
};

export type WeekPlan = {
  weekKey: string;
  wednesday: Date;
  friday: Date;
  sunday: Date;
  services: ServicePlan[];
};

// 1ª sexta do mês: sem culto. 2ª: Princesas. 3ª: Valentes (só 1 vaga,
// exclusivo do Erick). 4ª: Tribo de Leões. 5ª (meses raros com 5 sextas):
// sem culto, mesma regra da 1ª.
const FRIDAY_SERVICE_BY_OCCURRENCE: Record<
  number,
  { key: ServiceKey; description: string | null; seats: number }
> = {
  1: { key: "sexta-sem-culto", description: null, seats: 2 },
  2: { key: "sexta-princesas", description: "Culto das Princesas", seats: 2 },
  3: { key: "sexta-valentes", description: "Culto dos Valentes", seats: 1 },
  4: {
    key: "sexta-tribo-leoes",
    description: "Culto da Tribo de Leões",
    seats: 2,
  },
  5: { key: "sexta-sem-culto", description: null, seats: 2 },
};

/**
 * Monta o plano da SEMANA SEGUINTE à data de referência (normalmente "hoje",
 * no momento em que o admin clica em "Gerar Escala").
 */
export const resolveNextWeekPlan = (reference: Date = new Date()): WeekPlan => {
  const { wednesday, friday, sunday } = getNextWeekDates(reference);

  const fridayOccurrence = getOccurrenceInMonth(friday);
  const fridayService =
    FRIDAY_SERVICE_BY_OCCURRENCE[fridayOccurrence] ??
    FRIDAY_SERVICE_BY_OCCURRENCE[1];

  const isGloriaWeek = isFirstOccurrenceInMonth(sunday);

  const services: ServicePlan[] = [
    {
      key: "alinhamento",
      day: "Quarta-feira",
      period: "noite",
      description: "Culto do Alinhamento e Avivamento",
      active: true,
      seats: 2,
    },
    {
      key: fridayService.key,
      day: "Sexta-feira",
      period: "noite",
      description: fridayService.description,
      active: fridayService.description !== null,
      seats: fridayService.seats,
    },
    {
      key: "familia",
      day: "Domingo",
      period: "noite",
      description: "Culto da Família",
      active: true,
      seats: 3,
    },
    {
      key: "gloria",
      day: "Domingo",
      period: "manha",
      description: "Manhã de Glória",
      active: isGloriaWeek,
      seats: 2,
    },
  ];

  return {
    weekKey: formatWeekKey(wednesday),
    wednesday,
    friday,
    sunday,
    services,
  };
};
