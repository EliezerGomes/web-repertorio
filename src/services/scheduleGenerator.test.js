import { generateWeeklySchedule } from "./scheduleGenerator";
import { fetchSingers } from "./singers";
import { SINGER_IDS } from "../constants/singers";

jest.mock("./firebase", () => ({ db: {} }));
jest.mock("./singers", () => ({ fetchSingers: jest.fn() }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(), doc: jest.fn(), query: jest.fn(), orderBy: jest.fn(),
  limit: jest.fn(), where: jest.fn(), serverTimestamp: jest.fn(),
  getDocs: jest.fn(async () => ({ docs: [] })),
  addDoc: jest.fn(async () => ({ id: "worship" })),
  updateDoc: jest.fn(), setDoc: jest.fn(), deleteDoc: jest.fn(),
}));

test("excludes inactive singers even when a restricted service has no eligible singer", async () => {
  (fetchSingers).mockResolvedValue([
    { id: SINGER_IDS.ERICK, name: "Erick", active: false },
    { id: SINGER_IDS.CAMILA, name: "Camila", active: false },
    { id: SINGER_IDS.THALIA, name: "Thalia", active: true },
  ]);
  const result = await generateWeeklySchedule(new Date(2026, 10, 9));
  const names = result.assignments.flatMap((a) => a.singerNames);
  expect(names).toContain("Thalia");
  expect(names).not.toContain("Erick");
  expect(names).not.toContain("Camila");
  expect(result.assignments.find((a) => a.description === "Culto dos Valentes")?.singerNames).toEqual([]);
  expect(result.warnings.length).toBeGreaterThan(0);
});
