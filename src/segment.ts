/**
 * Text splitting.
 *
 * A segment is a grapheme cluster where the runtime can tell us (Intl.Segmenter
 * is in every modern browser, Node 16+, Deno, Bun and Workers) and a code point
 * otherwise. Either way we never split a surrogate pair, which is what v4's
 * `split('')` did.
 */

export interface Segment {
  /** The original text. Every conversion decision reads this, never `output`. */
  readonly source: string;
  /** Byte offset of `source` within the input. */
  readonly start: number;
  /** Converted text; equal to `source` until a layer replaces it. */
  output: string;
  /** Once true, no further stage may touch this segment. */
  sealed: boolean;
}

type SegmenterCtor = new (
  locales?: string,
  options?: { granularity?: 'grapheme' | 'word' | 'sentence' },
) => { segment(input: string): Iterable<{ segment: string; index: number }> };

function getSegmenter(): InstanceType<SegmenterCtor> | null {
  const intl = (globalThis as { Intl?: { Segmenter?: SegmenterCtor } }).Intl;
  if (!intl?.Segmenter) return null;
  try {
    return new intl.Segmenter(undefined, { granularity: 'grapheme' });
  } catch {
    return null;
  }
}

const segmenter = getSegmenter();

export function segment(input: string): Segment[] {
  const out: Segment[] = [];

  if (segmenter) {
    for (const { segment: s, index } of segmenter.segment(input)) {
      out.push({ source: s, start: index, output: s, sealed: false });
    }
    return out;
  }

  let i = 0;
  for (const cp of input) {
    out.push({ source: cp, start: i, output: cp, sealed: false });
    i += cp.length;
  }
  return out;
}

export function render(segments: readonly Segment[]): string {
  let out = '';
  for (const s of segments) out += s.output;
  return out;
}
