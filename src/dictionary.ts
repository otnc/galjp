import type { Picker } from './random';
import type { Segment } from './segment';

/**
 * User-supplied literal replacements.
 *
 * Keys are matched as plain text, longest first — never compiled to a regex.
 * v4 passed dictionary keys straight to `new RegExp(...)`, so any key
 * containing a metacharacter changed meaning or threw.
 *
 * This replaces v4's built-in `word.json`, which is gone: one of its five
 * entries was reproducible from the character tables and the rest disagreed
 * with them (it rendered し as ι where the kana table says Ｕ).
 */
export interface DictionaryRule {
  key: string;
  candidates: readonly string[];
}

export function compileDictionary(
  dictionary: Readonly<Record<string, string | readonly string[]>> | undefined,
): DictionaryRule[] {
  if (!dictionary) return [];
  return Object.entries(dictionary)
    .filter(([key]) => key.length > 0)
    .map(([key, value]) => ({
      key,
      candidates: typeof value === 'string' ? [value] : value,
    }))
    .sort((a, b) => b.key.length - a.key.length);
}

/**
 * Apply dictionary rules over the segment list, sealing whatever they write so
 * no later layer can convert the replacement a second time.
 */
export function applyDictionary(
  segments: Segment[],
  rules: readonly DictionaryRule[],
  pick: Picker,
): void {
  if (rules.length === 0) return;

  for (let i = 0; i < segments.length; i++) {
    if (segments[i]!.sealed) continue;

    for (const rule of rules) {
      let matchedSegments = 0;
      let matchedText = '';
      while (matchedText.length < rule.key.length && i + matchedSegments < segments.length) {
        const seg = segments[i + matchedSegments]!;
        if (seg.sealed) break;
        matchedText += seg.source;
        matchedSegments++;
      }
      if (matchedText !== rule.key) continue;

      segments[i]!.output = pick(rule.candidates);
      segments[i]!.sealed = true;
      for (let k = 1; k < matchedSegments; k++) {
        segments[i + k]!.output = '';
        segments[i + k]!.sealed = true;
      }
      i += matchedSegments - 1;
      break;
    }
  }
}
