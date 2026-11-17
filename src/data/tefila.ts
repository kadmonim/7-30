// Prayer customs for whoever leads the prayers, as rules the /tefila page filters by
// custom, situation, prayer and the kind of day. Only what is added, skipped or changed.
// Chabad follows HaMadrich (part/chapter/section as printed). Every rule needs a source;
// log every change in /changelog.

import type { Nusach } from './kaddish';

export type Kind = 'add' | 'skip' | 'note';
export type Situation = 'shiva' | 'year' | 'yahrzeit';
/** G = general, for the whole day; S = Shacharit; M = Mincha; A = Arvit/Maariv. */
export type Prayer = 'G' | 'S' | 'M' | 'A';
/**
 * When a rule applies, judged on the Hebrew day the prayer belongs to (Maariv belongs to
 * the next Hebrew day):
 * always · reading (a Torah-reading weekday: Mon/Thu, Rosh Chodesh, Chanukah, fast day) ·
 * monThu · rc (Rosh Chodesh) · chanukah · tachanun (a day with neither Rosh Chodesh nor
 * Chanukah) · fast (public fast) · ayt (Aseret Yemei Teshuva) · fastOrAyt · tishaBav ·
 * friday (Friday's Mincha) · shabbatNight (the Maariv of Friday night) ·
 * motzash (the Maariv of Saturday night).
 */
export type Cond =
  | 'always' | 'reading' | 'monThu' | 'rc' | 'chanukah' | 'tachanun' | 'fast' | 'ayt'
  | 'fastOrAyt' | 'tishaBav' | 'friday' | 'shabbatNight' | 'motzash';

export interface Rule {
  n: Nusach;
  sit: Situation[];
  p: Prayer[];
  when: Cond;
  kind: Kind;
  text: string;
  src: string;
}

const M = (s: string) => `המדריך ${s}`;
const YY = (s: string) => `קיצור ילקוט יוסף סי׳ ${s}`;
const ALL: Situation[] = ['shiva', 'year', 'yahrzeit'];

export const rules: Rule[] = [
  // ======================= Chabad (HaMadrich) =======================
  // -- shiva
  { n: 'chabad', sit: ['shiva'], p: ['G'], when: 'always', kind: 'note', text: 'מתפללים בבית האבל במנין. אבל שאין לו מנין בביתו אינו יוצא לבית הכנסת כל השבעה.', src: M('ח״ד פ״ט ס״א:א') },
  { n: 'chabad', sit: ['shiva'], p: ['G'], when: 'always', kind: 'note', text: 'האבל מתפלל לפני התיבה על אביו ועל אמו. מדליקים חמשה נרות בשעת התפילה.', src: M('ח״ד פ״ט ס״א:ד–ה') },
  { n: 'chabad', sit: ['shiva'], p: ['S'], when: 'always', kind: 'add', text: 'האבל מניח גם תפילין דרבנו תם.', src: M('ח״ד פ״ט ס״ד:כה') },
  { n: 'chabad', sit: ['shiva'], p: ['S'], when: 'always', kind: 'note', text: '״שעשה לי כל צרכי״, ״איזהו מקומן״ ו״פיטום הקטורת״ — כרגיל.', src: M('ח״ד פ״ט ס״ד:א, ה, כא') },
  { n: 'chabad', sit: ['shiva'], p: ['S', 'M'], when: 'always', kind: 'skip', text: 'תחנון — אין אומרים בבית האבל, ואפילו אין שם אבל.', src: M('ח״ד פ״ט ס״ד:ב') },
  { n: 'chabad', sit: ['shiva'], p: ['S'], when: 'always', kind: 'skip', text: 'ברכת כהנים — אין אומרים בבית האבל.', src: M('ח״ד פ״ט ס״ד:ז') },
  { n: 'chabad', sit: ['shiva'], p: ['S'], when: 'reading', kind: 'note', text: 'קריאת התורה: האבל אינו עולה, ואינו קורא אלא אם אין בעל קריאה אחר. הגבהה וגלילה — מותר. חצי קדיש שאחרי הקריאה — האבל משתדל לאמרו.', src: M('ח״ד פ״ט ס״ד:יב–יח') },
  { n: 'chabad', sit: ['shiva'], p: ['S'], when: 'always', kind: 'note', text: '״ואני זאת בריתי״, ״תתקבל״ והתהלים שבסוף התפילה — האבל אומרם.', src: M('ח״ד פ״ט ס״ד:יט–כב') },
  { n: 'chabad', sit: ['shiva'], p: ['S', 'M', 'A'], when: 'always', kind: 'add', text: 'בסוף התפילה: משניות פרק כ״ד דכלים ופרק ז׳ דמקוואות (בימי השבעה בגלוי רק משנה אחת), ״רבי חנניא בן עקשיא״, וקדיש דרבנן.', src: M('ח״ד פ״ט ס״ד:כג; ס״ה:לג') },
  { n: 'chabad', sit: ['shiva'], p: ['S', 'M'], when: 'always', kind: 'add', text: 'אחרי המשניות וקדיש דרבנן: תהלים פרק מ״ט, ואחריו קדיש יתום.', src: M('ח״ד פ״ט ס״ד:כד, כו') },
  { n: 'chabad', sit: ['shiva'], p: ['A'], when: 'always', kind: 'skip', text: 'אחרי ערבית אין אומרים פרק מ״ט.', src: M('ח״ד פ״ט ס״ד:כז') },
  { n: 'chabad', sit: ['shiva'], p: ['S', 'M', 'A'], when: 'rc', kind: 'skip', text: 'ראש חודש: האבל אינו יורד לפני התיבה, אפילו לא במנחה ובערבית.', src: M('ח״ד פ״ט ס״ד:ג') },
  { n: 'chabad', sit: ['shiva'], p: ['S'], when: 'rc', kind: 'note', text: 'הלל — לשאול רב. הנהוג: האבל יוצא לחדר אחר, הציבור אומר הלל, והאבל חוזר.', src: M('ח״ד פ״ט ס״ד:ח והערה 168') },
  { n: 'chabad', sit: ['shiva'], p: ['S'], when: 'chanukah', kind: 'note', text: 'חנוכה: האבל יורד לפני התיבה, אבל לא להלל.', src: M('ח״ד פ״ט ס״ד:ד') },
  { n: 'chabad', sit: ['shiva'], p: ['S'], when: 'fastOrAyt', kind: 'note', text: 'סליחות — מתפללים בבית האבל, ומדלגים תחנון ונפילת אפים. ״אבינו מלכנו״ — אומרים.', src: M('ח״ד פ״ט ס״ד:ט–י') },
  { n: 'chabad', sit: ['shiva'], p: ['A', 'S'], when: 'tishaBav', kind: 'note', text: 'תשעה באב (ערבית ושחרית, לא במנחה): במקום משניות כלים ומקוואות — פרקי תענית או ״ואלו מגלחין״ (מועד קטן פ״ג).', src: M('ח״ד פ״ט ס״ד:כג') },
  { n: 'chabad', sit: ['shiva'], p: ['M'], when: 'friday', kind: 'note', text: 'ערב שבת: אחרי מנחה קטנה (שעתיים וחצי לפני הלילה) מתחילים בהכנות לשבת ומסירים את עניני האבלות.', src: M('ח״ד פי״א ס״ב') },
  // -- the year
  { n: 'chabad', sit: ['year'], p: ['G'], when: 'always', kind: 'note', text: 'האבל על אביו ואמו מתפלל לפני העמוד שלוש התפילות כל י״א חודש — מועיל יותר מקדיש יתום. חמשה נרות בשעת התפילה.', src: M('ח״ו פ״ד ס״א:א; ס״ג:ב') },
  { n: 'chabad', sit: ['year'], p: ['S', 'M', 'A'], when: 'always', kind: 'add', text: 'משניות כ״ד דכלים וז׳ דמקוואות: לומד לפני התפילה עד המשנה האחרונה, ומסיים אחרי התפילה; ואחר כך קדיש דרבנן.', src: M('ח״ו פ״ד ס״ג:ד; ח״ד פ״ט ס״ה:לג') },
  { n: 'chabad', sit: ['year'], p: ['S', 'M', 'A'], when: 'rc', kind: 'skip', text: 'ראש חודש: אינו יורד לפני התיבה, אפילו לא במנחה ובערבית.', src: M('ח״ו פ״ד ס״ב:א') },
  { n: 'chabad', sit: ['year'], p: ['S'], when: 'chanukah', kind: 'note', text: 'חנוכה: יורד לפני התיבה, ולהלל ניגש אחר.', src: M('ח״ו פ״ד ס״ב:ג') },
  { n: 'chabad', sit: ['year'], p: ['S'], when: 'reading', kind: 'add', text: 'קריאת התורה: משתדל להיות בעל הקורא (בשני וחמישי), לעלות לתורה, ולומר חצי קדיש שאחרי הקריאה.', src: M('ח״ו פ״ד ס״ג:ז–ט') },
  // -- yahrzeit
  { n: 'chabad', sit: ['yahrzeit'], p: ['G'], when: 'always', kind: 'note', text: 'מתפללים לפני העמוד שלוש התפילות ואומרים קדיש. חמשה נרות על העמוד. אין נוהגים להתענות.', src: M('ח״ז פ״ז:ב, ד; פ״ג:א') },
  { n: 'chabad', sit: ['yahrzeit'], p: ['G'], when: 'always', kind: 'note', text: 'בשבת שלפני היארצייט עולים למפטיר (חל בשבת — מפטיר ביום היארצייט עצמו).', src: M('ח״ז פ״ד:ב–ג') },
  { n: 'chabad', sit: ['yahrzeit'], p: ['S', 'M'], when: 'tachanun', kind: 'note', text: 'אומרים תחנון ביום היארצייט.', src: M('ח״ז פ״ז:ה') },
  { n: 'chabad', sit: ['yahrzeit'], p: ['S'], when: 'reading', kind: 'add', text: 'עולה לתורה, ומשתדל לומר חצי קדיש שאחרי הקריאה.', src: M('ח״ז פ״ז:ז–ח') },
  { n: 'chabad', sit: ['yahrzeit'], p: ['S', 'M', 'A'], when: 'always', kind: 'add', text: 'משניות כ״ד דכלים וז׳ דמקוואות בסוף התפילה, וקדיש דרבנן.', src: M('ח״ז פ״ז:ט; ח״ד פ״ט ס״ה:לג') },
  // -- all situations
  { n: 'chabad', sit: ALL, p: ['G'], when: 'always', kind: 'skip', text: 'אין מנהגנו לומר ״א-ל מלא רחמים״.', src: M('ח״ב פ״ו ס״ב:ז והערה 169') },

  // ======================= Sefardi (Kitzur Yalkut Yosef) =======================
  // -- shiva
  { n: 'sefardi', sit: ['shiva'], p: ['G'], when: 'always', kind: 'note', text: 'מצוה להתפלל בבית שנפטר בו המנוח. כשאין מנין בבית — האבלים הולכים לבית הכנסת לומר קדיש ולהתפלל בציבור.', src: YY('כט:א, ג') },
  { n: 'sefardi', sit: ['shiva'], p: ['G'], when: 'always', kind: 'note', text: 'האבל על אב ואם — טוב שיהיה שליח ציבור גם בתוך השבעה. על שאר קרובים — לא, אלא אם אין אחר.', src: YY('כט:ד; לא:ו') },
  { n: 'sefardi', sit: ['shiva'], p: ['S'], when: 'always', kind: 'skip', text: 'תפילין — ביום הראשון לאבלות אינו מניח. מהיום השני — אחר הנץ החמה.', src: YY('כה:א') },
  { n: 'sefardi', sit: ['shiva'], p: ['S'], when: 'always', kind: 'note', text: '״שעשה לי כל צרכי״ — מברך. קרבנות, פטום הקטורת, ״איזהו מקומן״ ושירת הים — אומרים, וגם האבל.', src: YY('כט:ו–ז') },
  { n: 'sefardi', sit: ['shiva'], p: ['S'], when: 'always', kind: 'note', text: 'ברכת כהנים — אומרים. כהן אבל יוצא לחדר אחר; ואם כבר קראו ״כהנים״ — עולה.', src: YY('כט:ח') },
  { n: 'sefardi', sit: ['shiva'], p: ['S', 'M'], when: 'always', kind: 'skip', text: 'וידוי ונפילת אפים — אין אומרים בבית האבל, ואף כשהאבל אינו שם. (האבל שבא לבית הכנסת לומר קדיש — הציבור אומר.)', src: YY('כט:ט–י') },
  { n: 'sefardi', sit: ['shiva'], p: ['S', 'M', 'A'], when: 'always', kind: 'note', text: 'קדיש ״תתקבל״ — אומרים, ואף כשהאבל הוא שליח הציבור.', src: YY('כט:יא') },
  { n: 'sefardi', sit: ['shiva'], p: ['S'], when: 'reading', kind: 'note', text: 'קריאת התורה: מותר להביא ספר תורה לבית האבל. אם אין — הציבור הולך לבית הכנסת לקריאה, והאבלים אינם הולכים.', src: YY('כט:יב–יג') },
  { n: 'sefardi', sit: ['shiva'], p: ['S'], when: 'always', kind: 'skip', text: '״ובא לציון״ — אומרים, אבל האבלים עצמם מדלגים ״ואני זאת בריתי״.', src: YY('כט:יז') },
  { n: 'sefardi', sit: ['shiva'], p: ['A'], when: 'always', kind: 'add', text: 'צידוק הדין — מותר לומר בלילה אחרי ערבית.', src: YY('כט:יח') },
  { n: 'sefardi', sit: ['shiva'], p: ['S'], when: 'rc', kind: 'note', text: 'ראש חודש: אומרים הלל בבית האבל, והאבל עצמו אינו אומר. בירושלים, כשנפטר בבית — הציבור יוצא לחדר אחר לומר הלל.', src: YY('כט:יד') },
  { n: 'sefardi', sit: ['shiva'], p: ['S'], when: 'chanukah', kind: 'note', text: 'חנוכה: גם האבל גומר את ההלל בברכה, אבל לא יהיה שליח ציבור בשחרית.', src: YY('כט:יד') },
  { n: 'sefardi', sit: ['shiva'], p: ['A'], when: 'shabbatNight', kind: 'note', text: 'ליל שבת: אומרים ״במה מדליקין״ בבית האבל. ברכה מעין שבע — אין אומרים בבית האבל (חוץ מירושלים העתיקה).', src: YY('כט:טו–טז') },
  { n: 'sefardi', sit: ['shiva'], p: ['M'], when: 'friday', kind: 'note', text: 'ערב שבת: יושבים באבלות עד סמוך לשקיעה, ומחליפים בגדים סמוך לקבלת שבת.', src: YY('לד:א–ב') },
  // -- the year
  { n: 'sefardi', sit: ['year'], p: ['G'], when: 'always', kind: 'note', text: 'טוב שהאבל יהיה שליח ציבור, אם הוא ראוי ומבטא את האותיות כהלכה.', src: YY('לא:א–ב') },
  { n: 'sefardi', sit: ['year', 'yahrzeit'], p: ['G'], when: 'always', kind: 'note', text: 'קדיש: כל המחויבים אומרים ביחד, מילה במילה. קדיש יתום — לפני ״עלינו לשבח״, ולא אחריו.', src: YY('ל:יג, יז') },
  { n: 'sefardi', sit: ['year'], p: ['A'], when: 'motzash', kind: 'add', text: 'מוצאי שבת: מי שאינו שליח ציבור כל השנה — ישתדל להיות בערבית של מוצאי שבת.', src: YY('לא:ג') },
  // -- yahrzeit
  { n: 'sefardi', sit: ['yahrzeit'], p: ['G'], when: 'always', kind: 'note', text: 'בעל יארצייט על אב ואם קודם להיות שליח ציבור לאבל בתוך י״ב חודש — ביום הפטירה עצמו.', src: YY('לא:ד') },
  { n: 'sefardi', sit: ['yahrzeit'], p: ['G'], when: 'always', kind: 'note', text: 'אומרים קדיש מערבית של ליל שבת שלפני היארצייט ועד יום הפטירה ועד בכלל. העיקר — הקדיש ביום עצמו.', src: YY('ל:ט') },
  { n: 'sefardi', sit: ['yahrzeit'], p: ['G'], when: 'always', kind: 'add', text: 'השכבה: מזכירים את שם הנפטר ושם אביו (לאשה — שם אמה); יש נוהגים בשם האם, וכל מקום כמנהגו. אין לומר ״תחת כנפי השכינה״.', src: YY('לב:א–ג') },

  // ======================= Ashkenaz (partly checked) =======================
  { n: 'ashkenaz', sit: ['shiva'], p: ['G'], when: 'always', kind: 'note', text: 'מצוה להתפלל שחרית וערבית במקום שמת שם, אפילו אין שם אבל. האבל מצטרף למנין.', src: 'רמ״א יו״ד שפ״ד:ג; קיצור שו״ע ר״ז:ה' },
  { n: 'ashkenaz', sit: ['shiva'], p: ['S', 'M'], when: 'always', kind: 'skip', text: 'תחנון — אין אומרים בבית האבל. כשהאבל מתפלל בבית הכנסת — הציבור אומר, והאבל עצמו אינו אומר.', src: 'שו״ע או״ח קל״א:ד; משנ״ב קל״א:כ' },
  { n: 'ashkenaz', sit: ['shiva'], p: ['S'], when: 'always', kind: 'skip', text: 'ברכת כהנים — אין אומרים בבית האבל ״אלוקינו ואלוקי אבותינו ברכנו בברכה״.', src: 'קיצור שו״ע ר״ז:ה' },
  { n: 'ashkenaz', sit: ['shiva'], p: ['S', 'M'], when: 'always', kind: 'add', text: 'אחרי התפילה אומרים בבית הנפטר תהלים פרק מ״ט. וטוב ללמוד שם משניות.', src: 'קיצור שו״ע ר״ז:ה' },
  { n: 'ashkenaz', sit: ['shiva'], p: ['S'], when: 'rc', kind: 'skip', text: 'ראש חודש: אין אומרים הלל בבית האבל. האבל יוצא לחדר אחר והציבור אומר; אם אין חדר אחר — אין צריך לומר אחר כך.', src: 'קיצור שו״ע ר״ז:ו; משנ״ב קל״א:כ' },
  { n: 'ashkenaz', sit: ['shiva'], p: ['S'], when: 'chanukah', kind: 'note', text: 'חנוכה: מי שהתפלל בבית האבל צריך לומר הלל אחר כך בביתו.', src: 'קיצור שו״ע ר״ז:ו; משנ״ב קל״א:כ' },
  { n: 'ashkenaz', sit: ['year'], p: ['G'], when: 'always', kind: 'note', text: 'מי שיכול — מתפלל לפני התיבה, ומועיל יותר מקדיש יתום. מי שאינו יכול את כל התפילה — מ״אשרי ובא לציון״ והלאה. קדיש — י״א חודש.', src: 'קיצור שו״ע כ״ו:יד, יז' },
  { n: 'ashkenaz', sit: ['year', 'yahrzeit'], p: ['A'], when: 'motzash', kind: 'add', text: 'מוצאי שבת: ובפרט מתפלל לפני התיבה בערבית של מוצאי שבת.', src: 'רמ״א יו״ד שע״ו:ד; קיצור שו״ע כ״ו:א' },
  { n: 'ashkenaz', sit: ['yahrzeit'], p: ['G'], when: 'always', kind: 'note', text: 'מתפלל לפני התיבה ואומר קדיש (סדר הקדימות — קיצור שו״ע כ״ו). מצוה להתענות ביום שמת בו אביו או אמו.', src: 'רמ״א יו״ד שע״ו:ד, ת״ב:יב; קיצור שו״ע כ״ו:ה–ו' },
];

export const nusachLabels: Record<Nusach, string> = {
  chabad: 'חב״ד',
  sefardi: 'ספרדים',
  ashkenaz: 'אשכנז',
};

export const nusachSources: Record<Nusach, string> = {
  chabad: 'לפי ״המדריך״ (הרב ל״י גרליק).',
  sefardi: 'לפי קיצור שולחן ערוך ילקוט יוסף, הלכות אבלות.',
  ashkenaz: 'לפי השולחן ערוך והרמ״א, משנה ברורה וקיצור שולחן ערוך. נבדק חלקית.',
};

export const situationLabels: Record<Situation, string> = {
  shiva: 'בתוך השבעה',
  year: 'בתוך השנה',
  yahrzeit: 'יום היארצייט',
};
