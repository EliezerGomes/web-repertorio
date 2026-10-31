import { fetchSingers } from "./singers";
import { SINGER_IDS } from "../constants/singers";
import { getDocs, runTransaction } from "firebase/firestore";

jest.mock("./firebase", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(), doc: (_db, _collection, id) => ({ id }),
  getDocs: jest.fn(), runTransaction: jest.fn(), updateDoc: jest.fn(),
}));

test("initializes defaults and Thalia once, preserving saved changes", async () => {
  const records = new Map([
    [SINGER_IDS.ERICK, { name: "Erick" }],
    [SINGER_IDS.CAMILA, { name: "Camila" }],
    [SINGER_IDS.INGRID, { name: "Ingrid" }],
    [SINGER_IDS.ADRIANE, { name: "Adriane", active: false }],
  ]);
  const set = jest.fn((ref, data) => records.set(ref.id, data));
  const update = jest.fn((ref, data) => records.set(ref.id, { ...records.get(ref.id), ...data }));
  (getDocs).mockImplementation(async () => ({
    docs: [...records.keys()].map((id) => ({ id, ref: { id } })),
  }));
  (runTransaction).mockImplementation(async (_db, callback) => callback({
    get: async (ref) => ({
      id: ref.id, ref, exists: () => records.has(ref.id), data: () => records.get(ref.id),
    }), set, update,
  }));
  const singers = await fetchSingers();
  expect(singers.find((s) => s.id === SINGER_IDS.THALIA)).toEqual({ id: SINGER_IDS.THALIA, name: "Thalia", active: true });
  expect(records.get(SINGER_IDS.ERICK)?.active).toBe(false);
  expect(records.get(SINGER_IDS.CAMILA)?.active).toBe(false);
  expect(records.get(SINGER_IDS.INGRID)?.active).toBe(true);
  expect(records.get(SINGER_IDS.ADRIANE)?.active).toBe(false);
  records.set(SINGER_IDS.ERICK, { name: "Erick", active: true });
  set.mockClear(); update.mockClear();
  await fetchSingers();
  expect(records.get(SINGER_IDS.ERICK)?.active).toBe(true);
  expect(set).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});
