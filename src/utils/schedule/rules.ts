import { SINGER_IDS, SINGER_INFO } from "../../constants/singers";
import type { ServiceKey } from "./weekPlan";

export type EligibilityContext = {
  /** false na semana em que a pastora Ingrid está de folga no revezamento quinzenal. */
  ingridEligibleThisWeek: boolean;
};

/**
 * Retorna true se o cantor pode ser escalado para o culto `serviceKey`,
 * considerando as regras fixas da igreja:
 * - Erick não canta no Culto das Princesas.
 * - Só homens cantam no Culto dos Valentes (hoje, só o Erick se encaixa).
 * - A pastora Ingrid não canta na Tribo de Leões.
 * - A pastora Ingrid reveza semana sim, semana não (regra externa, via ingridEligibleThisWeek).
 */
export const isSingerEligibleForService = (
  singerId: string,
  serviceKey: ServiceKey,
  ctx: EligibilityContext,
): boolean => {
  const info = SINGER_INFO[singerId];

  if (singerId === SINGER_IDS.INGRID && !ctx.ingridEligibleThisWeek) {
    return false;
  }

  switch (serviceKey) {
    case "sexta-princesas":
      return singerId !== SINGER_IDS.ERICK;
    case "sexta-valentes":
      return info?.gender === "M";
    case "sexta-tribo-leoes":
      return singerId !== SINGER_IDS.INGRID;
    default:
      return true;
  }
};
