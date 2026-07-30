/**
 * Components that display fine but are not JIS X 0208 kanji.
 *
 * The legible set (JIS X 0208) answers "would a reader recognise this as a
 * character?", which is the right question for deciding how deep to recurse.
 * It is the wrong question for deciding whether a top/bottom split is safe:
 * 疒 and 灬 are not JIS X 0208 kanji, yet every Japanese font draws them and
 * every reader knows the shape. Without this list, 病 and 熱 stay unconverted.
 *
 * Only add characters that render in ordinary Japanese fonts. Obscure or
 * non-BMP parts (𠂊, 𡗗, 龶) are deliberately absent — splitting into something
 * that shows up as tofu helps nobody.
 */
export const renderableExtra: readonly string[] = [
  // Radicals encoded as unified ideographs.
  '疒', // やまいだれ  病 症 痛 疲 …
  '灬', // れっか      熱 点 無 焦 …
  '罒', // あみがしら  置 罰 署 …
  '覀', // にし
  '耂', // おいかんむり 考 者 老 …
  '龰', // あしへん

  // CJK Radicals Supplement / Kangxi radicals.
  '⺌',
  '⺍',
  '⺤',
  '⺕',
  '⺗',
  '⺇',
  '⺜',
  '⺈',

  // Katakana shapes KanjiVG uses as components (予 = ⿱マ丁).
  'マ',
  'ヨ',
  'ユ',
];
