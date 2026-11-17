// Festival scenarios for shiva and shloshim.
//
// Each expected date was worked out by hand from the paragraph of Shulchan Aruch
// Yoreh De'ah 399 named in the row, as read on 17 Nov 2026, and matched what the
// calculator already produced. They pin the current behaviour so a code change can't
// move a date unnoticed. They are not a ruling: if a rav corrects one, change the
// expectation here together with the code and the changelog entry.
//
// Festival dates come from tests/fixtures (a saved HebCal response), so no network.
import { describe, expect, it } from 'vitest';
import { addDays, calculateMourning, groupHolidays } from '../src/lib/mourning';
import israelItems from './fixtures/hebcal-israel.json';
import diasporaItems from './fixtures/hebcal-diaspora.json';

function run(burial: string, israel: boolean, afterNightfall = false) {
  const death = addDays(burial, -1);
  // The same window the page asks HebCal for.
  const from = addDays(death, -30);
  const to = addDays(burial, 400);
  const items = (israel ? israelItems : diasporaItems).filter((i) => i.date >= from && i.date <= to);
  const holidays = groupHolidays(items, israel);
  return calculateMourning(death, burial, afterNightfall, false, holidays, { lang: 'he', israel });
}

type Row = {
  name: string;
  source: string;
  burial: string;
  shiva: [string, string];
  shloshimEnd: string;
  shivaCancelledBy?: string;
  shloshimCancelledBy?: string;
  /** Diaspora values, where they differ from Israel. */
  diaspora?: { shiva?: [string, string] };
};

// 5787: Rosh Hashana 12-13 Sep 2026, Yom Kippur 21 Sep, Sukkot 26 Sep - 2 Oct,
// Shmini Atzeret 3 Oct (Diaspora 3-4 Oct), Pesach 22-28 Apr 2027 (Diaspora -29 Apr),
// Shavuot 11 Jun 2027 (Diaspora 11-12 Jun).
const rows: Row[] = [
  { name: 'no festival within thirty days', source: 'plain count',
    burial: '2026-06-10', shiva: ['2026-06-10', '2026-06-16'], shloshimEnd: '2026-07-09' },

  { name: 'shiva cut short by Pesach', source: 'Y.D. 399:7',
    burial: '2027-04-20', shiva: ['2027-04-20', '2027-04-21'], shloshimEnd: '2027-05-14', shivaCancelledBy: 'pesach' },
  { name: 'sixth day of shiva is Erev Pesach', source: 'Y.D. 399:7',
    burial: '2027-04-16', shiva: ['2027-04-16', '2027-04-21'], shloshimEnd: '2027-05-14', shivaCancelledBy: 'pesach' },
  { name: 'seven days finished before Erev Pesach', source: 'Y.D. 399:3',
    burial: '2027-04-14', shiva: ['2027-04-14', '2027-04-20'], shloshimEnd: '2027-04-21', shloshimCancelledBy: 'pesach' },
  { name: 'seventh day of shiva is Erev Pesach', source: 'Y.D. 399:3',
    burial: '2027-04-15', shiva: ['2027-04-15', '2027-04-21'], shloshimEnd: '2027-04-21', shloshimCancelledBy: 'pesach' },
  { name: 'burial on chol hamoed Pesach', source: 'Y.D. 399:2',
    burial: '2027-04-25', shiva: ['2027-04-29', '2027-05-05'], shloshimEnd: '2027-05-24',
    diaspora: { shiva: ['2027-04-30', '2027-05-05'] } },

  { name: 'shiva cut short by Shavuot', source: 'Y.D. 399:8',
    burial: '2027-06-09', shiva: ['2027-06-09', '2027-06-10'], shloshimEnd: '2027-06-27', shivaCancelledBy: 'shavuot' },

  { name: 'seventh day of shiva is Erev Rosh Hashana', source: 'Y.D. 399:3, 399:6',
    burial: '2026-09-05', shiva: ['2026-09-05', '2026-09-11'], shloshimEnd: '2026-09-11', shloshimCancelledBy: 'rosh-hashana' },
  { name: 'shiva cut by Rosh Hashana, shloshim by Yom Kippur', source: 'Y.D. 399:9',
    burial: '2026-09-08', shiva: ['2026-09-08', '2026-09-11'], shloshimEnd: '2026-09-20',
    shivaCancelledBy: 'rosh-hashana', shloshimCancelledBy: 'yom-kippur' },
  { name: 'burial on 3 Tishrei', source: 'Y.D. 399:9',
    burial: '2026-09-14', shiva: ['2026-09-14', '2026-09-20'], shloshimEnd: '2026-09-20', shloshimCancelledBy: 'yom-kippur' },
  { name: 'shiva cut by Yom Kippur, shloshim by Sukkot', source: 'Y.D. 399:10',
    burial: '2026-09-15', shiva: ['2026-09-15', '2026-09-20'], shloshimEnd: '2026-09-25',
    shivaCancelledBy: 'yom-kippur', shloshimCancelledBy: 'sukkot' },
  { name: 'shiva cut by Sukkot: shloshim ends 1 Cheshvan', source: 'Y.D. 399:11',
    burial: '2026-09-22', shiva: ['2026-09-22', '2026-09-25'], shloshimEnd: '2026-10-12', shivaCancelledBy: 'sukkot' },
  { name: 'burial on chol hamoed Sukkot (5787)', source: 'Y.D. 399:2',
    burial: '2026-09-29', shiva: ['2026-10-04', '2026-10-10'], shloshimEnd: '2026-10-28',
    diaspora: { shiva: ['2026-10-05', '2026-10-10'] } },
  { name: 'burial on chol hamoed Sukkot (5786)', source: 'Y.D. 399:2',
    burial: '2025-10-09', shiva: ['2025-10-15', '2025-10-21'], shloshimEnd: '2025-11-07',
    diaspora: { shiva: ['2025-10-16', '2025-10-21'] } },
];

for (const israel of [true, false]) {
  describe(israel ? 'Israel' : 'Diaspora', () => {
    for (const row of rows) {
      it(`${row.name} (${row.source})`, () => {
        const r = run(row.burial, israel);
        const shiva = (!israel && row.diaspora?.shiva) || row.shiva;
        expect([r.day1, r.shivaEnd]).toEqual(shiva);
        expect(r.shloshimEnd).toBe(row.shloshimEnd);
        expect(r.shivaCancelledBy).toBe(row.shivaCancelledBy ?? null);
        expect(r.shloshimCancelledBy).toBe(row.shloshimCancelledBy ?? null);
      });
    }
  });
}

describe('parent note', () => {
  const parentNote = (burial: string) => run(burial, true).notes.filter((n) => n.includes('על אב ואם'));

  it('appears when a festival shortens or cancels shloshim', () => {
    expect(parentNote('2027-04-14')).toHaveLength(1);
    expect(parentNote('2027-04-20')).toHaveLength(1);
  });

  it('does not appear when no festival is involved', () => {
    expect(parentNote('2026-06-10')).toHaveLength(0);
  });
});

describe('burial after nightfall', () => {
  it('counts from the next day', () => {
    const r = run('2026-06-10', true, true);
    expect([r.day1, r.shivaEnd]).toEqual(['2026-06-11', '2026-06-17']);
  });
});
