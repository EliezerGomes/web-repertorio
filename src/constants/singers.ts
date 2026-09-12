// IDs reais dos documentos da coleção "singers" no Firestore.
// Mantido centralizado aqui para ser usado pelo gerador de escala.
export const SINGER_IDS = {
  INGRID: "KE81ihXDYPCwOZMDaC2y",
  CAMILA: "Vxb4PlodkFcG3OkCXMZX",
  ERICK: "WBJ7JU8oIhbYOKrwVzL9",
  NADILA: "ubMq7aEEqoXbsMTzTwEw",
  ADRIANE: "wvccqsbxHRTN2SkIGCLG",
} as const;

export type Gender = "M" | "F";

export type SingerInfo = {
  name: string;
  gender: Gender;
  isPastor?: boolean;
};

// Informações extras sobre cada cantor, usadas nas regras de escala.
// Um cantor que não estiver aqui (ex.: alguém novo cadastrado no Firestore)
// entra automaticamente sem nenhuma restrição especial.
export const SINGER_INFO: Record<string, SingerInfo> = {
  [SINGER_IDS.INGRID]: { name: "Ingrid", gender: "F", isPastor: true },
  [SINGER_IDS.CAMILA]: { name: "Camila", gender: "F" },
  [SINGER_IDS.ERICK]: { name: "Erick", gender: "M" },
  [SINGER_IDS.NADILA]: { name: "Nadila", gender: "F" },
  [SINGER_IDS.ADRIANE]: { name: "Adriane", gender: "F" },
};
