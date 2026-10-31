import { collection, doc, getDocs, runTransaction, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SINGER_IDS } from "../constants/singers";

export type Singer = { id: string; name: string; active: boolean };

// Inicializa apenas campos ausentes, preservando as escolhas já salvas.
export async function fetchSingers(): Promise<Singer[]> {
  const snapshot = await getDocs(collection(db, "singers"));
  const refs = snapshot.docs.map((singer) => singer.ref);
  if (!snapshot.docs.some((singer) => singer.id === SINGER_IDS.THALIA)) {
    refs.push(doc(db, "singers", SINGER_IDS.THALIA));
  }

  const singers = await runTransaction(db, async (transaction) => {
    const documents = await Promise.all(refs.map((ref) => transaction.get(ref)));
    return documents.flatMap((snapshot): Singer[] => {
      if (!snapshot.exists()) {
        if (snapshot.id !== SINGER_IDS.THALIA) return [];
        const singer = { name: "Thalia", active: true };
        transaction.set(snapshot.ref, singer);
        return [{ id: snapshot.id, ...singer }];
      }
      const data = snapshot.data();
      const active = typeof data.active === "boolean"
        ? data.active
        : snapshot.id !== SINGER_IDS.ERICK && snapshot.id !== SINGER_IDS.CAMILA;
      if (typeof data.active !== "boolean") {
        transaction.update(snapshot.ref, { active });
      }
      return [{ id: snapshot.id, name: data.name, active }];
    });
  });
  return singers.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function setSingerActive(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(db, "singers", id), { active });
}
