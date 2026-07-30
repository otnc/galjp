import type { Segment } from './segment';

/**
 * Ranges that must survive untouched.
 *
 * v4 happily mangled URLs (`https://example.com/A` came out as
 * `丩ＴＴ尸丂://∋乂∀…`), which made it unusable on anything containing a link.
 */
export const DEFAULT_PRESERVE: readonly RegExp[] = [
  // URLs and bare domains with a scheme.
  /[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^\s]+/gu,
  // Emoji, including ZWJ sequences and skin-tone modifiers.
  /\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*/gu,
];

export type PreserveOption = readonly RegExp[] | ((text: string) => boolean) | false;

interface Range {
  start: number;
  end: number;
}

function matchRanges(input: string, patterns: readonly RegExp[]): Range[] {
  const ranges: Range[] = [];
  for (const pattern of patterns) {
    // Clone so a caller-supplied regex never has its lastIndex mutated.
    const re = new RegExp(
      pattern.source,
      pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g',
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(input))) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
  }
  return ranges;
}

/** Seal every segment that falls inside a preserved range. */
export function applyPreserve(input: string, segments: Segment[], preserve: PreserveOption): void {
  if (preserve === false) return;

  if (typeof preserve === 'function') {
    for (const s of segments) {
      if (preserve(s.source)) s.sealed = true;
    }
    return;
  }

  const ranges = matchRanges(input, preserve);
  if (ranges.length === 0) return;

  for (const s of segments) {
    const end = s.start + s.source.length;
    for (const r of ranges) {
      if (s.start < r.end && end > r.start) {
        s.sealed = true;
        break;
      }
    }
  }
}
