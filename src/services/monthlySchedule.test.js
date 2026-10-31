import { generateMonthlySchedule, fetchGeneratedMonth } from "./monthlySchedule";
import { resolveMonthPlan } from "../utils/schedule/monthPlan";
import { selectWeeklyWorships } from "../utils/schedule/views";
import { SINGER_IDS } from "../constants/singers";
import { getDoc, getDocs, runTransaction } from "firebase/firestore";
import { fetchSingers } from "./singers";

jest.mock("./firebase", () => ({ db: {} }));
jest.mock("./singers", () => ({ fetchSingers: jest.fn() }));
jest.mock("firebase/firestore", () => ({
  collection: (_db, name) => name,
  doc: (_db, name, id) => ({ collection: name, id }),
  getDoc: jest.fn(), getDocs: jest.fn(), runTransaction: jest.fn(), serverTimestamp: jest.fn(),
}));

let records;
let writes;
beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 31, 12));
  records = new Map(); writes = [];
  getDoc.mockResolvedValue({ data: () => ({ month: "2026-11" }) });
  (fetchSingers).mockResolvedValue(Object.entries(SINGER_IDS).map(([name, id]) => ({ id, name, active: !["ERICK", "CAMILA"].includes(name) })));
  getDocs.mockImplementation(async () => ({ docs: [...records].map(([id, data]) => ({ id, data: () => data })) }));
  runTransaction.mockImplementation(async (_db, callback) => callback({
    get: async (ref) => ({ id: ref.id, ref, exists: () => records.has(ref.id), data: () => records.get(ref.id) }),
    set: (ref, data) => { writes.push(ref); if (ref.collection === "worship") records.set(ref.id, data); },
    update: (ref, data) => { writes.push(ref); records.set(ref.id, { ...records.get(ref.id), ...data }); },
  }));
});

test("month includes boundary Sundays, separates morning/night, skips inactive Fridays", () => {
  const plan = resolveMonthPlan("2026-11");
  expect(plan.filter((s) => s.date === "2026-11-01").map((s) => s.key).sort()).toEqual(["familia", "gloria"]);
  expect(plan.some((s) => s.date === "2026-11-06")).toBe(false);
  expect(plan.find((s) => s.date === "2026-11-13").key).toBe("sexta-princesas");
  expect(plan.find((s) => s.date === "2026-11-20").key).toBe("sexta-valentes");
  expect(plan.find((s) => s.date === "2026-11-27").key).toBe("sexta-tribo-leoes");
  expect(plan.some((s) => s.date === "2026-11-29")).toBe(true);
  expect(new Set(plan.map((s) => s.id)).size).toBe(plan.length);
  expect(resolveMonthPlan("2028-02").every((s) => s.date.startsWith("2028-02"))).toBe(true);
  expect(() => resolveMonthPlan("2026-13")).toThrow();
});

test("monthly generation respects active, weekly limits, Ingrid rotation, and preserves existing repertoires on repeat", async () => {
  const result = await generateMonthlySchedule();
  expect(result.created).toBe(resolveMonthPlan("2026-11").length);
  const weeks = new Map();
  for (const service of resolveMonthPlan("2026-11")) {
    const worship = records.get(service.id);
    expect(worship.singers).not.toContain(SINGER_IDS.ERICK);
    expect(worship.singers).not.toContain(SINGER_IDS.CAMILA);
    if (!weeks.has(service.weekKey)) weeks.set(service.weekKey, new Map());
    for (const id of worship.singers) {
      const counts = weeks.get(service.weekKey);
      counts.set(id, (counts.get(id) ?? 0) + 1);
      expect(counts.get(id)).toBeLessThanOrEqual(2);
    }
  }
  const orderedWeeks = [...weeks.values()];
  orderedWeeks.forEach((counts, i) => {
    if (i > 0 && orderedWeeks[i - 1].has(SINGER_IDS.INGRID)) expect(counts.has(SINGER_IDS.INGRID)).toBe(false);
  });
  expect(result.warnings.some((w) => w.includes("Valentes"))).toBe(true);
  const before = JSON.stringify([...records]);
  writes = [];
  expect((await generateMonthlySchedule()).created).toBe(0);
  expect(writes).toEqual([{ collection: "scheduleSettings", id: "current" }]);
  expect(JSON.stringify([...records])).toBe(before);
  // All persistence is scoped to worship. No repertoire writes or deletions.
  expect(getDocs.mock.calls.every(([name]) => name === "worship")).toBe(true);
});

test("adopts the current legacy service ID so existing songs retain their link", async () => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 31, 12));
  try {
    records.set("legacy-sunday", { day: "Domingo", hour: "19:00", enable: true, description: "Culto atual", singers: [SINGER_IDS.THALIA] });
    await generateMonthlySchedule();
    expect(records.get("legacy-sunday").date).toBe("2026-11-01");
    expect(records.get("legacy-sunday").singers).toEqual([SINGER_IDS.THALIA]);
    expect(records.has("2026-11-01-familia")).toBe(false);
  } finally { jest.useRealTimers(); }
});

test("weekly and monthly views use the same service IDs, including a week across two months", () => {
  const worships = [
    { id: "legacy", enable: true, day: "Domingo", hour: "19:00", singers: [] },
    { id: "oct", date: "2026-10-28", enable: true, day: "Quarta-feira", hour: "19:30", singers: [] },
    { id: "nov", date: "2026-11-01", enable: true, day: "Domingo", hour: "19:00", singers: [] },
    { id: "later", date: "2026-11-04", enable: true, day: "Quarta-feira", hour: "19:30", singers: [] },
  ];
  expect(selectWeeklyWorships(worships, new Date(2026, 9, 31)).map((w) => w.id)).toEqual(["oct", "nov"]);
  expect(selectWeeklyWorships([worships[0]], new Date(2026, 9, 31))[0].id).toBe("legacy");
});

afterEach(() => jest.useRealTimers());

test("generation always uses next month, including December to January", async () => {
  jest.setSystemTime(new Date(2026, 11, 31, 12));
  const result = await generateMonthlySchedule();
  expect(result.month).toBe("2027-01");
  expect([...records.values()].every((w) => w.date.startsWith("2027-01"))).toBe(true);
});

test("calendar reads published month independently of current date or future manual events", async () => {
  expect(await fetchGeneratedMonth([{ date: "2027-02-01" }])).toBe("2026-11");
  getDoc.mockResolvedValue({ data: () => undefined });
  expect(await fetchGeneratedMonth([{ date: "2026-10-01" }, { date: "2026-11-01" }])).toBe("2026-11");
});
