/**
 * Latin letters (keys are upper case; lookup upper-cases first) -> galmoji.
 *
 * Ported verbatim from galjp v4 (lib/chars/alphabet.json). The values are intentionally
 * unchanged — see docs/DESIGN.md premise 3. Regenerate with:
 *   npm run data:port
 */
export const latin: Readonly<Record<string, string>> = {
  A: '∀',
  B: '♭',
  C: '⊂',
  D: '囙',
  E: 'ヨ',
  F: '下',
  G: '⊂┐',
  H: '丩',
  I: '工',
  J: 'し',
  K: '|く',
  L: '└',
  M: '从',
  N: '冂',
  O: '口',
  P: '尸',
  Q: '电',
  R: '尺',
  S: '丂',
  T: '丁',
  U: '凵',
  V: 'レ',
  W: '山',
  X: '乂',
  Y: 'ソ',
  Z: '乙',
};
