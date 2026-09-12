// Funções de data usadas para descobrir, a partir de uma data de referência,
// quais são a quarta, a sexta e o domingo da mesma semana (semana de
// segunda a domingo), e em qual posição do mês (1ª, 2ª, 3ª...) cada uma cai.

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number): Date =>
  new Date(startOfDay(date).getTime() + days * DAY_MS);

/**
 * Segunda-feira da semana que contém a data informada.
 */
export const getMondayOfWeek = (date: Date): Date => {
  const d = startOfDay(date);
  const weekday = d.getDay(); // 0 = domingo, 1 = segunda, ... 6 = sábado
  // Distância até a segunda-feira anterior (ou o próprio dia, se já for segunda).
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  return addDays(d, diffToMonday);
};

export type WeekDates = {
  monday: Date;
  wednesday: Date;
  friday: Date;
  sunday: Date;
};

/**
 * Dado um dia qualquer, retorna quarta/sexta/domingo da mesma semana
 * (segunda a domingo).
 */
export const getWeekDates = (reference: Date): WeekDates => {
  const monday = getMondayOfWeek(reference);
  return {
    monday,
    wednesday: addDays(monday, 2),
    friday: addDays(monday, 4),
    sunday: addDays(monday, 6),
  };
};

/**
 * Retorna as datas da semana seguinte à semana que contém `reference`.
 */
export const getNextWeekDates = (reference: Date): WeekDates => {
  const { monday } = getWeekDates(reference);
  return getWeekDates(addDays(monday, 7));
};

/**
 * Em qual ocorrência do mês essa data cai para o seu dia da semana
 * (1 = primeira vez que esse dia da semana aparece no mês, 2 = segunda, etc).
 */
export const getOccurrenceInMonth = (date: Date): number =>
  Math.floor((date.getDate() - 1) / 7) + 1;

export const isFirstOccurrenceInMonth = (date: Date): boolean =>
  getOccurrenceInMonth(date) === 1;

/**
 * Chave estável (yyyy-MM-dd) usada como id de documento para identificar
 * a semana — usamos a quarta-feira da semana como âncora.
 */
export const formatWeekKey = (date: Date): string => {
  const d = startOfDay(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDatePtBr = (date: Date): string =>
  date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
