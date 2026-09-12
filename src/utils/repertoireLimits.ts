// Regras de quantidade de louvores por culto.
// Culto de domingo à noite tem 6 louvores; todos os demais, 4.
const DEFAULT_SONGS_PER_WORSHIP = 4;
const SUNDAY_NIGHT_SONGS_PER_WORSHIP = 6;

const SUNDAY = "domingo";
const NIGHT_START_HOUR = 17;

const parseHour = (hour?: string): number => {
  if (!hour) return 0;
  const [rawHour] = hour.split(":");
  const parsed = Number(rawHour);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const isSundayNight = (day?: string, hour?: string): boolean =>
  (day || "").trim().toLowerCase() === SUNDAY &&
  parseHour(hour) >= NIGHT_START_HOUR;

/**
 * Total de louvores que o culto comporta.
 */
export const getWorshipSongsLimit = (worship?: {
  day?: string;
  hour?: string;
}): number =>
  isSundayNight(worship?.day, worship?.hour)
    ? SUNDAY_NIGHT_SONGS_PER_WORSHIP
    : DEFAULT_SONGS_PER_WORSHIP;

/**
 * Divide os louvores do culto entre os cantores escalados.
 * Ex.: 4 louvores / 2 cantores = 2 cada; 4 louvores / 1 cantor = 4.
 * Quando a divisão não é exata, arredonda para cima (o total do culto
 * continua limitado por getWorshipSongsLimit).
 */
export const getSongsLimitPerSinger = (
  totalSongs: number,
  singersCount: number,
): number => {
  if (singersCount <= 0) return totalSongs;
  return Math.ceil(totalSongs / singersCount);
};
