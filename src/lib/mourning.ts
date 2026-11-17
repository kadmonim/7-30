// Date logic for the calculator: shiva, shloshim, kaddish and yahrzeit.
// No DOM access here, so it can be tested without a browser (see tests/).

import { getJewishDate } from 'jewish-dates-core';
import { formatJewishDateInHebrew, formatJewishDate, JewishMonth, toGregorianDate, toJewishDate, getJewishMonthsInOrder } from 'jewish-date';

// =====================
// Types
// =====================
export interface HolidayPeriod {
  id: string;
  nameHe: string;
  nameEn: string;
  erev: string;        // day before first yom tov (holiday starts at sunset)
  firstDay: string;
  lastDay: string;     // last day of entire period including chol hamoed
  yomTovDays: string[];
  cholHamoedDays: string[];
  // How many "equivalent days" this holiday counts toward shloshim when it cancels shiva
  shloshimEquivalent: number;
}

export type Lang = 'he' | 'en';

/** What the page knows that the calculation needs: display language and location. */
export interface CalcOptions {
  lang: Lang;
  israel: boolean;
}

export interface MourningResult {
  day1: string;
  shivaEnd: string;
  shloshimEnd: string;
  shivaCancelled: boolean;
  shivaCancelledBy: string | null;
  shloshimCancelled: boolean;
  shloshimCancelledBy: string | null;
  shivaDelayed: boolean;
  shivaDelayedUntilAfter: string | null;
  notes: string[];
}


// Holiday names
export const holidayNames: Record<string, {he: string; en: string}> = {
  pesach:           { he: 'פסח',            en: 'Pesach' },
  shavuot:          { he: 'שבועות',          en: 'Shavuot' },
  sukkot:           { he: 'סוכות',           en: 'Sukkot' },
  'shmini-atzeret': { he: 'שמיני עצרת',      en: 'Shmini Atzeret' },
  'rosh-hashana':   { he: 'ראש השנה',        en: 'Rosh Hashana' },
  'yom-kippur':     { he: 'יום כיפור',       en: 'Yom Kippur' },
};


// =====================
// Date helpers
// =====================
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T12:00:00');
  const db = new Date(b + 'T12:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export function isPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return d < today;
}

export function formatDate(dateStr: string, lang: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// =====================
// =====================
// Kaddish & Yahrzeit helpers
// =====================

/** Format a Date to YYYY-MM-DD without UTC conversion */
export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Calculate when Kaddish ends.
 * Ashkenazi: 11 Hebrew months from date of passing.
 * Sefardi: 12 Hebrew months (with ~1 week break at start of month 12).
 */
export function calcKaddishEnd(deathDateStr: string, months: number = 11): { gregDate: string; jewishDate: any } {
  const d = new Date(deathDateStr + 'T12:00:00');
  const jd = toJewishDate(d);

  let targetYear = jd.year;
  let targetMonthName = jd.monthName;
  let monthsToAdd = months;

  // Walk forward N months in the Hebrew calendar
  const currentMonthsOrder = getJewishMonthsInOrder(targetYear);
  let idx = currentMonthsOrder.indexOf(jd.monthName);

  while (monthsToAdd > 0) {
    idx++;
    const yearMonths = getJewishMonthsInOrder(targetYear);
    if (idx >= yearMonths.length) {
      targetYear++;
      idx = 1; // Skip JewishMonth.None at index 0
    }
    const newMonths = getJewishMonthsInOrder(targetYear);
    targetMonthName = newMonths[idx];
    monthsToAdd--;
  }

  // Use the same day, clamped to month length
  let targetDay = jd.day;
  // Try to create the date; if day is too high, the library will handle it
  const targetJd = { day: targetDay, monthName: targetMonthName, year: targetYear };
  const greg = toGregorianDate(targetJd);

  return {
    gregDate: toLocalDateStr(greg),
    jewishDate: targetJd,
  };
}

/**
 * Calculate yahrzeit: the Hebrew date of death in future years.
 * Returns Gregorian date for the given Hebrew year.
 */
export function calcYahrzeit(deathDateStr: string, yearOffset: number): {
  gregDate: string; jewishDate: any;
  adarAlternate?: { gregDate: string; jewishDate: any; opinion: string };
} {
  const d = new Date(deathDateStr + 'T12:00:00');
  const jd = toJewishDate(d);

  const targetYear = jd.year + yearOffset;
  let targetMonthName = jd.monthName;
  let adarAlternate: { gregDate: string; jewishDate: any; opinion: string } | undefined;

  // Handle Adar in leap/non-leap year transitions
  const targetMonths = getJewishMonthsInOrder(targetYear);
  const hasAdarI = targetMonths.includes(JewishMonth.AdarI);
  const hasAdarII = targetMonths.includes(JewishMonth.AdarII);
  const sourceMonths = getJewishMonthsInOrder(jd.year);
  const sourceHasAdarI = sourceMonths.includes(JewishMonth.AdarI);

  if (jd.monthName === JewishMonth.AdarI && !hasAdarI) {
    // Death in Adar I of leap year, target is non-leap: use Adar
    targetMonthName = JewishMonth.Adar;
  } else if (jd.monthName === JewishMonth.AdarII && !hasAdarII) {
    // Death in Adar II of leap year, target is non-leap: use Adar
    targetMonthName = JewishMonth.Adar;
  } else if (jd.monthName === JewishMonth.Adar && hasAdarII) {
    // Death in Adar of non-leap year, target is leap year:
    // Primary: Adar II (Rama). Alternate: Adar I (Mechaber/Shulchan Aruch).
    targetMonthName = JewishMonth.AdarII;
    const altDay = jd.day;
    const altJd = { day: altDay, monthName: JewishMonth.AdarI, year: targetYear };
    const altGreg = toGregorianDate(altJd);
    adarAlternate = {
      gregDate: toLocalDateStr(altGreg),
      jewishDate: altJd,
      opinion: 'mechaber', // Mechaber/Shulchan Aruch holds Adar I
    };
  }

  // Handle 30 Cheshvan / 30 Kislev
  // Per Chabad custom (HaMadrich 7:2; KSA 221:4): first yahrzeit year determines pattern forever
  // Case 1: First year's month has 29 days → always 29th
  // Case 2: First year's month has 30 days → always Rosh Chodesh
  //   (30th when month is long = 1st day of 2-day RC; 1st of next month when short = 1-day RC)
  let targetDay = jd.day;
  if (targetDay === 30 && (targetMonthName === JewishMonth.Cheshvan || targetMonthName === JewishMonth.Kislev)) {
    // Check the FIRST yahrzeit year to determine the pattern
    const firstYahrzeitYear = jd.year + 1;
    const firstYearTest = toGregorianDate({ day: 30, monthName: targetMonthName, year: firstYahrzeitYear });
    const firstYearBack = toJewishDate(firstYearTest);
    const firstYearHas30 = firstYearBack.monthName === targetMonthName && firstYearBack.day === 30;

    if (!firstYearHas30) {
      // Case 1: first year is short → always 29th
      targetDay = 29;
    } else {
      // Case 2: first year is long → always Rosh Chodesh
      // Check if THIS target year's month has 30 days
      const thisYearTest = toGregorianDate({ day: 30, monthName: targetMonthName, year: targetYear });
      const thisYearBack = toJewishDate(thisYearTest);
      const thisYearHas30 = thisYearBack.monthName === targetMonthName && thisYearBack.day === 30;

      if (thisYearHas30) {
        // Long month: 30th = 1st day of 2-day Rosh Chodesh
        targetDay = 30;
      } else {
        // Short month: Rosh Chodesh is 1st of next month
        // Use the next month's 1st day
        const nextMonthIdx = getJewishMonthsInOrder(targetYear).indexOf(targetMonthName) + 1;
        const yearMonths = getJewishMonthsInOrder(targetYear);
        let nextMonth: string;
        let nextYear = targetYear;
        if (nextMonthIdx >= yearMonths.length) {
          nextYear++;
          nextMonth = getJewishMonthsInOrder(nextYear)[1]; // first real month
        } else {
          nextMonth = yearMonths[nextMonthIdx];
        }
        const rcJd = { day: 1, monthName: nextMonth, year: nextYear };
        const rcGreg = toGregorianDate(rcJd);
        return {
          gregDate: toLocalDateStr(rcGreg),
          jewishDate: rcJd,
          adarAlternate,
        };
      }
    }
  }

  const targetJd = { day: targetDay, monthName: targetMonthName, year: targetYear };
  const greg = toGregorianDate(targetJd);

  return {
    gregDate: toLocalDateStr(greg),
    jewishDate: targetJd,
    adarAlternate,
  };
}

// HebCal API helpers
// =====================
/**
 * Festival dates for a range, from the HebCal API. Throws if they can't be loaded:
 * with no festival list the calculation would silently treat every date as an ordinary
 * weekday, so the caller must stop and say so rather than show dates.
 */
export async function fetchHolidays(startDate: string, endDate: string, israel: boolean): Promise<any[]> {
  const i = israel ? 'on' : 'off';
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=off&mod=off&nx=off&ss=off&mf=off&c=off&i=${i}&start=${startDate}&end=${endDate}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HebCal responded ${resp.status}`);
  const data = await resp.json();
  if (!Array.isArray(data.items)) throw new Error('HebCal response had no holiday list');
  return data.items;
}

// =====================
// Holiday grouping
// =====================
export function groupHolidays(items: any[], israel: boolean): HolidayPeriod[] {
  const groups: Record<string, { yomTov: string[]; cholHamoed: string[]; all: string[] }> = {};

  for (const item of items) {
    const title: string = item.title || '';
    const date: string = item.date;
    const isYomTov = item.yomtov === true;

    let holidayType: string | null = null;

    if (title.includes('Pesach')) {
      holidayType = 'pesach';
    } else if (title.includes('Shavuot')) {
      holidayType = 'shavuot';
    } else if (title.includes('Sukkot')) {
      holidayType = 'sukkot';
    } else if (title.includes('Shmini Atzeret') || title.includes('Simchat Torah')) {
      holidayType = 'shmini-atzeret';
    } else if (title.includes('Rosh Hashana')) {
      holidayType = 'rosh-hashana';
    } else if (title.includes('Yom Kippur')) {
      holidayType = 'yom-kippur';
    }

    if (!holidayType) continue;
    // Skip erev entries for grouping purposes
    if (title.startsWith('Erev ')) continue;

    // Include year in group key so holidays from different years stay separate
    const year = date.substring(0, 4);
    const groupId = `${holidayType}:${year}`;

    if (!groups[groupId]) {
      groups[groupId] = { yomTov: [], cholHamoed: [], all: [] };
    }
    groups[groupId].all.push(date);
    if (isYomTov) {
      groups[groupId].yomTov.push(date);
    } else {
      groups[groupId].cholHamoed.push(date);
    }
  }

  const periods: HolidayPeriod[] = [];

  for (const [groupId, g] of Object.entries(groups)) {
    if (g.all.length === 0) continue;
    g.all.sort();
    g.yomTov.sort();
    g.cholHamoed.sort();

    const id = groupId.split(':')[0]; // Strip year suffix
    const firstDay = g.all[0];
    const lastDay = g.all[g.all.length - 1];
    const erev = addDays(firstDay, -1);

    // Shloshim equivalents when this holiday cancels shiva
    let equiv = 0;
    if (id === 'pesach') {
      equiv = israel ? 7 : 8;
    } else if (id === 'shavuot') {
      // First day of Shavuot = 7 equivalent days; second day (diaspora) = 1 more
      equiv = israel ? 7 : 8;
    } else if (id === 'sukkot') {
      equiv = 7; // Just Sukkot proper (7 days); Shmini Atzeret is separate
    } else if (id === 'shmini-atzeret') {
      // Shmini Atzeret = 7 equivalent days; Simchat Torah (diaspora) = 1 more
      equiv = israel ? 7 : 8;
    } else if (id === 'rosh-hashana') {
      equiv = 2;
    } else if (id === 'yom-kippur') {
      equiv = 1;
    }

    const names = holidayNames[id] || { he: id, en: id };
    periods.push({
      id,
      nameHe: names.he,
      nameEn: names.en,
      erev,
      firstDay,
      lastDay,
      yomTovDays: g.yomTov,
      cholHamoedDays: g.cholHamoed,
      shloshimEquivalent: equiv,
    });
  }

  // Sort by first day
  periods.sort((a, b) => a.firstDay.localeCompare(b.firstDay));
  return periods;
}

// Check if a date falls within a holiday period (yom tov or chol hamoed)
export function findHolidayAtDate(date: string, holidays: HolidayPeriod[]): HolidayPeriod | null {
  for (const h of holidays) {
    if (date >= h.firstDay && date <= h.lastDay) return h;
  }
  return null;
}

// =====================
// Main mourning calculation
// =====================
export function calculateMourning(
  deathDate: string,
  burialDate: string,
  afterNightfall: boolean,
  deathAfterNightfall: boolean,
  holidays: HolidayPeriod[],
  opts: CalcOptions,
): MourningResult {
  const currentLang = opts.lang;
  const isIsrael = opts.israel;
  const notes: string[] = [];

  // Effective dates (halachic day)
  const effectiveDeath = deathAfterNightfall ? addDays(deathDate, 1) : deathDate;
  let effectiveBurial = afterNightfall ? addDays(burialDate, 1) : burialDate;

  // Check if burial occurred during a holiday/chol hamoed
  const holidayAtBurial = findHolidayAtDate(effectiveBurial, holidays);
  let day1: string;
  let shivaDelayed = false;
  let shivaDelayedUntilAfter: string | null = null;
  let shivaDelayedDiasporaDayOff = false;

  if (holidayAtBurial) {
    // Shiva customs begin the day after the holiday ends (for both Israel and Diaspora)
    // For calculation: Israel gets 7 full days, Diaspora gets 6 (last day of holiday counted toward 7)
    day1 = addDays(holidayAtBurial.lastDay, 1); // Display: actual first day of sitting
    shivaDelayed = true;
    shivaDelayedUntilAfter = holidayAtBurial.id;
    // Diaspora: last day of YT counts toward the 7, so only 6 more days of actual sitting
    shivaDelayedDiasporaDayOff = !isIsrael;

    const name = currentLang === 'he' ? holidayAtBurial.nameHe : holidayAtBurial.nameEn;
    if (currentLang === 'he') {
      const diasporaNote = !isIsrael ? ` היום האחרון של החג נספר למנין שבעה, ולכן יושבים עוד 6 ימים בלבד.` : '';
      notes.push(`הקבורה חלה בתוך ${name}. השבעה מתחילה למחרת החג.${diasporaNote} ימי החג נספרים למנין ל׳ יום של השלושים, אף שדיני השלושים מתחילים רק לאחר החג.`);
    } else {
      const diasporaNote = !isIsrael ? ` The last day of the holiday counts toward the 7 days, so only 6 additional days of shiva are observed.` : '';
      notes.push(`Burial occurred during ${name}. Shiva begins the day after the holiday.${diasporaNote} The holiday days count toward the 30-day shloshim total, even though shloshim customs only begin after the holiday.`);
    }
  } else {
    day1 = effectiveBurial;
  }

  // Also check if death occurred during a holiday but burial after
  // (If death was during holiday and mourner didn't know, shiva starts after holiday)
  if (!holidayAtBurial && deathDate !== burialDate) {
    const holidayAtDeath = findHolidayAtDate(deathDate, holidays);
    if (holidayAtDeath && effectiveBurial > holidayAtDeath.lastDay) {
      // Death was during holiday, burial after — shiva starts from burial as normal
      // No special handling needed, but note it
    }
  }

  // Naive end dates
  // Diaspora Chol Hamoed burial: last day of holiday counted toward 7, so 6 days from day1
  let shivaEnd = addDays(day1, shivaDelayedDiasporaDayOff ? 5 : 6);
  let shloshimEnd: string;

  // For shloshim, counting starts from burial date (or effective burial) even if shiva was delayed
  if (shivaDelayed && holidayAtBurial) {
    // Holiday days count toward shloshim even though shiva hasn't started
    shloshimEnd = addDays(effectiveBurial, 29);
  } else {
    shloshimEnd = addDays(day1, 29);
  }

  let shivaCancelled = false;
  let shivaCancelledBy: string | null = null;
  let shloshimCancelled = false;
  let shloshimCancelledBy: string | null = null;

  // Process holidays chronologically for cancellation
  for (const holiday of holidays) {
    // Skip the holiday that delayed shiva (already handled)
    if (shivaDelayed && holiday.id === holidayAtBurial?.id) continue;

    // Chol Hamoed Sukkot burial: Shmini Atzeret is part of the same holiday complex
    // Shiva doesn't begin until after the entire period (including SA/Simchas Torah)
    // Dispute: SA counts as 1 actual day (some Poskim) or 7 equivalent (Kitzur Yalkut Yosef 42:21)
    // Only the Shmini Atzeret that directly follows this Sukkot — the holiday list spans
    // several years, and matching a later year's put shiva a year late.
    if (shivaDelayed && shivaDelayedUntilAfter === 'sukkot' && holiday.id === 'shmini-atzeret'
        && holiday.firstDay === addDays(holidayAtBurial!.lastDay, 1)) {
      // Same rule as any burial during a festival: sitting starts the day after the last
      // day; in the Diaspora that last day counts as day one, leaving six (Y.D. 399:2).
      day1 = addDays(holiday.lastDay, 1);
      shivaEnd = addDays(day1, shivaDelayedDiasporaDayOff ? 5 : 6);
      const name = currentLang === 'he' ? holiday.nameHe : holiday.nameEn;
      if (currentLang === 'he') {
        notes.push(`השבעה מתחילה לאחר ${name}. שתי דעות: ${name} נספר כיום אחד בלבד (יש פוסקים), או כ-7 ימים שווי ערך (קיצור ילקוט יוסף סי׳ מב:כא — הלכה כדברי המיקל באבל).`);
      } else {
        notes.push(`Shiva begins after ${name}. Two opinions: ${name} counts as only ${daysBetween(holiday.firstDay, holiday.lastDay) + 1} actual day(s) (some Poskim), or as 7 equivalent days (Kitzur Yalkut Yosef 42:21 — rule leniently in mourning).`);
      }
      continue;
    }

    const holidayStart = holiday.erev; // Holiday begins at sunset of erev

    // Did mourning begin before this holiday?
    if (day1 <= holidayStart) {
      if (!shivaCancelled && holidayStart < shivaEnd) {
        // Holiday cancels remaining shiva
        shivaCancelled = true;
        shivaCancelledBy = holiday.id;
        shivaEnd = holidayStart; // Shiva ends at onset of holiday

        const name = currentLang === 'he' ? holiday.nameHe : holiday.nameEn;
        if (holiday.id === 'pesach') {
          // Erev Pesach: when mourning stops that day differs by custom, so the note gives each. See /changelog.
          if (currentLang === 'he') {
            notes.push(`${name} מבטל את יתרת השבעה. בערב פסח — למנהג חב״ד האבלות נפסקת בחצות היום (המדריך ח״ד פי״ד ס״ה); למנהג הספרדים — סמוך לכניסת החג (קיצור ילקוט יוסף סי׳ מב:ב).`);
          } else {
            notes.push(`${name} cancels the remainder of shiva. On Erev Pesach: by Chabad custom mourning stops at midday (HaMadrich part 4, 14:5); by Sefardi custom, close to the start of the festival (Kitzur Yalkut Yosef 42:2).`);
          }
        } else {
          if (currentLang === 'he') {
            notes.push(`${name} מבטל את יתרת השבעה.`);
          } else {
            notes.push(`${name} cancels the remainder of shiva.`);
          }
        }

        // Calculate shloshim with holiday equivalents
        // Cancelled shiva counts as full 7 days toward shloshim (YD 399)
        const totalEquiv = 7 + holiday.shloshimEquivalent;

        if (totalEquiv >= 30) {
          shloshimEnd = holiday.lastDay;
          shloshimCancelled = true;
          shloshimCancelledBy = holiday.id;
          if (currentLang === 'he') {
            notes.push(`${name} מבטל גם את יתרת השלושים.`);
          } else {
            notes.push(`${name} also cancels the remainder of shloshim.`);
          }
        } else {
          const remaining = 30 - totalEquiv;
          shloshimEnd = addDays(holiday.lastDay, remaining);
        }
      } else if (shivaCancelled && !shloshimCancelled && holidayStart <= shloshimEnd) {
        const name = currentLang === 'he' ? holiday.nameHe : holiday.nameEn;

        // Shmini Atzeres after Sukkos cancelled shiva does NOT nullify shloshim
        // because no recognizable mourning was practiced during Chol Hamoed (Taz 399:6)
        // Instead, it counts equivalent days toward the remaining shloshim
        if (shivaCancelledBy === 'sukkot' && holiday.id === 'shmini-atzeret') {
          const actualDays = daysBetween(holiday.firstDay, holiday.lastDay) + 1;
          const bonus = holiday.shloshimEquivalent - actualDays;
          shloshimEnd = addDays(shloshimEnd, -bonus);
          if (currentLang === 'he') {
            notes.push(`${name} נחשב כ-${holiday.shloshimEquivalent} ימים לענין השלושים, אך אינו מבטל את השלושים (ט״ז שצ״ט:ו).`);
          } else {
            notes.push(`${name} counts as ${holiday.shloshimEquivalent} days toward shloshim but does not cancel it (Taz 399:6).`);
          }
        } else {
          // Standard: holiday cancels remaining shloshim
          shloshimCancelled = true;
          shloshimCancelledBy = holiday.id;
          shloshimEnd = holidayStart;
          if (holiday.id === 'pesach') {
            if (currentLang === 'he') {
              notes.push(`${name} מבטל את יתרת השלושים. בערב פסח — למנהג אשכנז וחב״ד מותר בכל אחר חצות היום, ומסתפרים קודם חצות (רמ״א יו״ד שצ״ט:ג; המדריך ח״ה פ״ט ס״ד); למנהג הספרדים מותר בערב החג (שו״ע שם; קיצור ילקוט יוסף סי׳ מב:כו).`);
            } else {
              notes.push(`${name} cancels the remainder of shloshim. On Erev Pesach: by Ashkenazi and Chabad custom everything is permitted after midday, and a haircut is taken before midday (Rama Y.D. 399:3; HaMadrich part 5, 9:4); by Sefardi custom it is permitted on the eve of the festival (Shulchan Aruch there; Kitzur Yalkut Yosef 42:26).`);
            }
          } else {
            if (currentLang === 'he') {
              notes.push(`${name} מבטל את יתרת השלושים.`);
            } else {
              notes.push(`${name} cancels the remainder of shloshim.`);
            }
          }
        }
      } else if (!shivaCancelled && !shloshimCancelled && holidayStart >= shivaEnd && holidayStart <= shloshimEnd) {
        // Shiva completed normally before the holiday; holiday cancels shloshim
        shloshimCancelled = true;
        shloshimCancelledBy = holiday.id;
        shloshimEnd = holidayStart;

        const name = currentLang === 'he' ? holiday.nameHe : holiday.nameEn;
        if (holiday.id === 'pesach') {
          if (currentLang === 'he') {
            notes.push(`השבעה מסתיימת לפני ${name}. ${name} מבטל את יתרת השלושים. בערב פסח — למנהג אשכנז וחב״ד מותר בכל אחר חצות היום, ומסתפרים קודם חצות (רמ״א יו״ד שצ״ט:ג; המדריך ח״ה פ״ט ס״ד); למנהג הספרדים מותר בערב החג (שו״ע שם; קיצור ילקוט יוסף סי׳ מב:כו).`);
          } else {
            notes.push(`Shiva completed before ${name}. ${name} cancels the remainder of shloshim. On Erev Pesach: by Ashkenazi and Chabad custom everything is permitted after midday, and a haircut is taken before midday (Rama Y.D. 399:3; HaMadrich part 5, 9:4); by Sefardi custom it is permitted on the eve of the festival (Shulchan Aruch there; Kitzur Yalkut Yosef 42:26).`);
          }
        } else {
          if (currentLang === 'he') {
            notes.push(`השבעה מסתיימת לפני ${name}. ${name} מבטל את יתרת השלושים.`);
          } else {
            notes.push(`Shiva completed before ${name}. ${name} cancels the remainder of shloshim.`);
          }
        }
      }
    }
  }

  // For a parent, the haircut restriction is not lifted when a festival cancels or
  // shortens shloshim (Y.D. 399:4, O.C. 548:9). Customs differ on when it does lift, so
  // the note gives both. The calculator has no "who passed away" input, so this shows
  // whenever a festival shortened the count. See /changelog.
  const fullThirtyEnd = addDays(effectiveBurial, 29);
  if (shloshimEnd < fullThirtyEnd) {
    const formatHeb = (dateStr: string) => {
      const jd = getJewishDate(new Date(dateStr + 'T12:00:00'));
      return currentLang === 'he' ? formatJewishDateInHebrew(jd) : formatJewishDate(jd);
    };
    const day30 = `${formatHeb(fullThirtyEnd)} (${formatDate(fullThirtyEnd, currentLang)})`;
    if (currentLang === 'he') {
      notes.push(`<strong>על אב ואם:</strong> גם כשהרגל מבטל או מקצר את השלושים, איסור התספורת אינו בטל (שו״ע יו״ד שצ״ט:ד; או״ח תקמ״ח:ט). למנהג הספרדים וארץ ישראל — אין להסתפר לפני יום השלושים בפועל, ${day30}, ואז לאחר שיגערו בו חבריו (קיצור ילקוט יוסף סי׳ מב:כ, כב, כו). למנהג אשכנז וחב״ד — עד שיגערו בו חבריו, ונהגו לשער שלושה חודשים (רמ״א יו״ד ש״צ:ד).`);
    } else {
      notes.push(`<strong>For a parent:</strong> even when the festival cancels or shortens shloshim, the haircut restriction is not lifted (Shulchan Aruch Y.D. 399:4; O.C. 548:9). Sefardi and Eretz Yisrael custom: no haircut before the actual thirtieth day, ${day30}, and then once one's friends remark on it (Kitzur Yalkut Yosef 42:20, 22, 26). Ashkenazi and Chabad custom: until one's friends remark on it, customarily reckoned as three months (Rama Y.D. 390:4).`);
    }
  }

  return {
    day1,
    shivaEnd,
    shloshimEnd,
    shivaCancelled,
    shivaCancelledBy,
    shloshimCancelled,
    shloshimCancelledBy,
    shivaDelayed,
    shivaDelayedUntilAfter,
    notes,
  };
}

