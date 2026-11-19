// Day classification for the prayer page. Expected values are calendar facts for 5787.
import { describe, expect, it } from 'vitest';
import { dayInfo } from '../src/lib/dayinfo';

describe('dayInfo', () => {
  it('Rosh Chodesh: 30 Cheshvan and 1 Kislev 5787', () => {
    expect(dayInfo('2026-11-10').rc).toBe(true);
    expect(dayInfo('2026-11-11').rc).toBe(true);
    expect(dayInfo('2026-11-12').rc).toBe(false);
  });

  it('1 Tishrei is Rosh Hashana, not Rosh Chodesh', () => {
    const d = dayInfo('2026-09-12');
    expect(d.rc).toBe(false);
    expect(d.holiday).toBe(true);
  });

  it('Chanukah 5787: 25 Kislev (5 Dec 2026) to 2 Tevet (12 Dec)', () => {
    expect(dayInfo('2026-12-04').chanukah).toBe(false);
    expect(dayInfo('2026-12-05').chanukah).toBe(true);
    expect(dayInfo('2026-12-12').chanukah).toBe(true);
    expect(dayInfo('2026-12-13').chanukah).toBe(false);
  });

  it('Fast of Gedalia 5787 falls on Monday 14 Sep 2026', () => {
    expect(dayInfo('2026-09-14').fast).toBe(true);
    expect(dayInfo('2026-09-14').reading).toBe(true);
  });

  it('Tisha B\'Av 5786 fell on Shabbat and was kept on Sunday 23 Jul 2026', () => {
    expect(dayInfo('2026-07-23').tishaBav).toBe(true);
    expect(dayInfo('2026-07-22').tishaBav).toBe(false);
  });

  it('a plain Tuesday has no reading; Monday and Thursday do', () => {
    expect(dayInfo('2026-11-17').reading).toBe(false);
    expect(dayInfo('2026-11-16').reading).toBe(true);
    expect(dayInfo('2026-11-19').reading).toBe(true);
  });

  it('Chol Hamoed Sukkot is a festival day', () => {
    expect(dayInfo('2026-09-29').holiday).toBe(true);
  });

  it('Psalm 49 days: not on Rosh Chodesh, Chanukah, Nisan, or Tishrei after Yom Kippur', () => {
    expect(dayInfo('2026-11-17').noPs49).toBe(false);
    expect(dayInfo('2026-11-11').noPs49).toBe(true); // 1 Kislev
    expect(dayInfo('2026-12-07').noPs49).toBe(true); // Chanukah
    expect(dayInfo('2027-04-12').noPs49).toBe(true); // Nisan
    expect(dayInfo('2026-09-23').noPs49).toBe(true); // 12 Tishrei
  });

  it('days without Tachanun (Ashkenaz list), and the Mincha before them', () => {
    expect(dayInfo('2026-11-17').noTachanun).toBe(false);
    expect(dayInfo('2026-11-11').noTachanun).toBe(true); // 1 Kislev
    expect(dayInfo('2026-11-09').noTachanunMincha).toBe(true); // 29 Cheshvan, eve of Rosh Chodesh
    expect(dayInfo('2026-11-09').noTachanun).toBe(false);
    expect(dayInfo('2027-05-25').noTachanun).toBe(true); // 18 Iyar, Lag BaOmer
    expect(dayInfo('2027-06-15').noTachanun).toBe(true); // 10 Sivan
    expect(dayInfo('2027-01-23').noTachanun).toBe(true); // 15 Shevat
    expect(dayInfo('2027-05-20').noTachanunMincha).toBe(false); // 13 Iyar, eve of Pesach Sheni
    expect(dayInfo('2027-05-21').noTachanun).toBe(true); // 14 Iyar, Pesach Sheni
  });
});
