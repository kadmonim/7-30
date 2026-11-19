// What kind of day a date is, for the prayer customs: Rosh Chodesh, Chanukah, a public fast,
// a Torah-reading day, a festival. No DOM access, so it can be tested (tests/dayinfo.test.ts).
// Dates are 'YYYY-MM-DD' civil dates; the result describes the Hebrew day whose daytime falls
// on that date (Shacharit and Mincha). Maariv belongs to the next Hebrew day — see forPrayer.

import { toJewishDate, toGregorianDate, JewishMonth, isLeapYear, formatJewishDateInHebrew } from 'jewish-date';

export interface DayInfo {
  date: string;
  weekday: number; // 0 = Sunday … 6 = Shabbat
  hebrew: string;
  rc: boolean;
  chanukah: boolean;
  fast: boolean;
  tishaBav: boolean;
  ayt: boolean; // Aseret Yemei Teshuva (1–10 Tishrei)
  holiday: boolean; // Yom Tov or Chol Hamoed (Israel and Diaspora days alike)
  monThu: boolean;
  reading: boolean; // a weekday with a Torah reading at Shacharit
  /** No Psalm 49 in the shiva house: Rosh Chodesh, Chanukah, Purim, Nisan, Tishrei after Yom Kippur. */
  noPs49: boolean;
  /** A day Tachanun is not said (the common Ashkenaz list — see noTachanunDay). */
  noTachanun: boolean;
  /** Tachanun is not said at this day's Mincha: such a day, or the eve of one (and Friday is handled by the page). */
  noTachanunMincha: boolean;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (dateStr: string) => new Date(dateStr + 'T12:00:00');

export function addDays(dateStr: string, days: number): string {
  const d = at(dateStr);
  d.setDate(d.getDate() + days);
  return toStr(d);
}

function gregOf(day: number, monthName: string, year: number): string {
  return toStr(toGregorianDate({ day, monthName, year } as any));
}

/** A fast that falls on Shabbat moves: forward to Sunday, or (Esther) back to Thursday. */
function fastDate(day: number, monthName: string, year: number, back = false): string {
  const d = gregOf(day, monthName, year);
  if (at(d).getDay() !== 6) return d;
  return addDays(d, back ? -2 : 1);
}

/**
 * Days Tachanun is not said, by the common Ashkenaz list: Rosh Chodesh, Chanukah, all Nisan,
 * Pesach Sheni, Lag BaOmer, 1–12 Sivan, Tisha B'Av, 15 Av, Erev Rosh Hashana, from Erev Yom
 * Kippur to the end of Tishrei, 15 Shevat, Purim and Shushan Purim (in a leap year also
 * Purim Katan). `eve`: the Mincha before it omits Tachanun too (not before Pesach Sheni,
 * Erev Rosh Hashana or Erev Yom Kippur).
 */
function noTachanunDay(date: string): { no: boolean; eve: boolean } {
  const { day, monthName: m, year } = toJewishDate(at(date));
  const leap = isLeapYear(year);
  const rc = day === 30 || (day === 1 && m !== JewishMonth.Tishri);
  const start = gregOf(25, JewishMonth.Kislev, year);
  const since = Math.round((at(date).getTime() - at(start).getTime()) / 86400000);
  const chanukah = since >= 0 && since <= 7;
  const purim = (day === 14 || day === 15) && (m === JewishMonth.Adar || m === JewishMonth.AdarII || (leap && m === JewishMonth.AdarI));
  const noEve =
    (m === JewishMonth.Iyyar && day === 14) || (m === JewishMonth.Elul && day === 29) || (m === JewishMonth.Tishri && day === 9);
  const no =
    noEve || rc || chanukah || purim ||
    m === JewishMonth.Nisan ||
    (m === JewishMonth.Iyyar && day === 18) ||
    (m === JewishMonth.Sivan && day <= 12) ||
    date === fastDate(9, JewishMonth.Av, year) ||
    (m === JewishMonth.Av && day === 15) ||
    (m === JewishMonth.Tishri && (day <= 2 || day >= 9)) ||
    (m === JewishMonth.Shevat && day === 15);
  return { no, eve: no && !noEve };
}

export function dayInfo(date: string): DayInfo {
  const jd = toJewishDate(at(date));
  const { day, monthName, year } = jd;
  const weekday = at(date).getDay();

  const rc = day === 30 || (day === 1 && monthName !== JewishMonth.Tishri);

  const chanukahStart = gregOf(25, JewishMonth.Kislev, year);
  const sinceStart = Math.round((at(date).getTime() - at(chanukahStart).getTime()) / 86400000);
  const chanukah = sinceStart >= 0 && sinceStart <= 7;

  const adarForEsther = isLeapYear(year) ? JewishMonth.AdarII : JewishMonth.Adar;
  const tishaBavDate = fastDate(9, JewishMonth.Av, year);
  const fasts = [
    fastDate(3, JewishMonth.Tishri, year),
    gregOf(10, JewishMonth.Tevet, year),
    fastDate(13, adarForEsther, year, true),
    fastDate(17, JewishMonth.Tammuz, year),
    tishaBavDate,
  ];

  const holiday =
    (monthName === JewishMonth.Tishri && ([1, 2, 10].includes(day) || (day >= 15 && day <= 23))) ||
    (monthName === JewishMonth.Nisan && day >= 15 && day <= 22) ||
    (monthName === JewishMonth.Sivan && (day === 6 || day === 7));

  const fast = fasts.includes(date);
  const purimAdar = isLeapYear(year) ? JewishMonth.AdarII : JewishMonth.Adar;
  const purim = monthName === purimAdar && (day === 14 || day === 15);
  const monThu = weekday === 1 || weekday === 4;

  return {
    date,
    weekday,
    hebrew: formatJewishDateInHebrew(jd as any),
    rc,
    chanukah,
    fast,
    tishaBav: date === tishaBavDate,
    ayt: monthName === JewishMonth.Tishri && day <= 10,
    holiday,
    monThu,
    reading: weekday !== 6 && !holiday && (monThu || rc || chanukah || fast),
    noPs49: rc || chanukah || purim || monthName === JewishMonth.Nisan || (monthName === JewishMonth.Tishri && day >= 11),
    noTachanun: noTachanunDay(date).no,
    noTachanunMincha: noTachanunDay(date).no || noTachanunDay(addDays(date, 1)).eve,
  };
}
