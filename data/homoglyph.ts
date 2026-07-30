/**
 * Whole-character look-alike substitution.
 *
 * These are not decompositions — the character is swapped for a different
 * character that reads as the same shape. Checked before decomposition so that
 * e.g. 中 becomes ㊥ rather than being split.
 */
export const homoglyph: Readonly<Record<string, readonly string[]>> = {
  上: ['㊤'],
  下: ['㊦'],
  中: ['㊥'],
  左: ['㊧'],
  右: ['㊨'],
  亜: ['亞'],
  // '悪': ['惡'],
  本: ['夲'],
  事: ['亊'],
  丁: ['Ｔ'],
  乙: ['Ｚ'],
  犬: ['尤'],
  子: ['孑'],
};
