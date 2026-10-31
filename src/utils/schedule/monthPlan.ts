import { formatWeekKey, getMondayOfWeek } from "./calendar";
import { resolveNextWeekPlan, type ServicePlan } from "./weekPlan";

export type DatedService = ServicePlan & { date: string; weekKey: string; id: string };

export function resolveMonthPlan(month: string): DatedService[] {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Mês inválido");
  const [year, number] = month.split("-").map(Number);
  const result: DatedService[] = [];
  for (let date = new Date(year, number - 1, 1); date.getMonth() === number - 1; date.setDate(date.getDate() + 1)) {
    const previous = new Date(date);
    previous.setDate(previous.getDate() - 7);
    const plan = resolveNextWeekPlan(previous);
    for (const service of plan.services) {
      const serviceDate = service.day === "Quarta-feira" ? plan.wednesday : service.day === "Sexta-feira" ? plan.friday : plan.sunday;
      if (!service.active || formatWeekKey(serviceDate) !== formatWeekKey(date)) continue;
      const key = formatWeekKey(date);
      result.push({ ...service, date: key, weekKey: formatWeekKey(getMondayOfWeek(date)), id: `${key}-${service.key}` });
    }
  }
  return result;
}

export const dateLabel = (date: string) => date.split("-").reverse().join("/");

export const getNextScheduleMonth = (today = new Date()): string =>
  formatWeekKey(new Date(today.getFullYear(), today.getMonth() + 1, 1)).slice(0, 7);
