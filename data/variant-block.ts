/**
 * Traditional-variant pairs to reject.
 *
 * Unihan's `kTraditionalVariant` answers a Chinese question — "which
 * traditional character did this simplified one come from?" — and Chinese
 * simplification merged characters that Japanese keeps apart. The automatic
 * filters in scripts/extract-variant.ts catch most of the damage; these are
 * the survivors, checked by hand.
 *
 * Each entry is a character whose proposed old form is a different *word* in
 * Japanese, not an older spelling of the same one:
 *
 *   冬 → 鼕  鼕 is the sound of a drum
 *   出 → 齣  齣 is a counter for scenes in a play
 *   千 → 韆  韆 only occurs in 鞦韆 (a swing)
 *   秋 → 鞦  likewise
 *   沈 → 瀋  瀋 is the place name Shenyang
 *   斗 → 鬥  鬥 means to fight
 *   松 → 鬆  鬆 means loose
 *
 * Removing an entry from this list re-enables that substitution.
 */
export const variantBlock: readonly string[] = [
  '冬',
  '出',
  '千',
  '秋',
  '沈',
  '斗',
  '松',
  '借',
  '克',
  '合',
  '才',
  '朴',
  '御',
  '折',
  '回',
  '注',
  '据',
];
