// 日付の共通処理。サイトの日付はすべて JST（Asia/Tokyo）の暦日で扱う。

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const JST_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 日時を JST の 'YYYY-MM-DD' にする（en-CA の書式は YYYY-MM-DD） */
export const toJstDate = (date: Date): string => JST_DATE.format(date);

const dayNumber = (jstDate: string): number => Date.parse(`${jstDate}T00:00:00Z`) / MS_PER_DAY;

/** from から to までの暦日の差（JST で数える） */
export const daysBetween = (from: Date, to: Date): number =>
  dayNumber(toJstDate(to)) - dayNumber(toJstDate(from));

/** JST の日付に日数を足した 'YYYY-MM-DD' */
export const addDays = (date: Date, days: number): string =>
  new Date((dayNumber(toJstDate(date)) + days) * MS_PER_DAY).toISOString().slice(0, 10);
