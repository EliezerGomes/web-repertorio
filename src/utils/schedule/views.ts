import type { Worship } from "../../services/monthlySchedule";
import { formatWeekKey, getWeekDates } from "./calendar";

export function selectWeeklyWorships(worships: Worship[], today: Date): Worship[] {
  const week = getWeekDates(today);
  const start = formatWeekKey(week.monday);
  const end = formatWeekKey(week.sunday);
  const dated = worships.filter((w) => w.date && w.date >= start && w.date <= end);
  const order: Record<string, number> = { "Quarta-feira": 1, "Sexta-feira": 2, Domingo: 3 };
  const hasMonthlySchedule = worships.some((w) => w.date?.slice(0, 7) === start.slice(0, 7) || w.date?.slice(0, 7) === end.slice(0, 7));
  return (dated.length || hasMonthlySchedule ? dated : worships.filter((w) => !w.date))
    .filter((w) => w.enable)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || (order[a.day] ?? 99) - (order[b.day] ?? 99) || a.hour.localeCompare(b.hour));
}
