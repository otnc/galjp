/**
 * Deterministic candidate selection.
 *
 * Without a seed we always take the first candidate, so output is stable and
 * reproducible. With one, mulberry32 gives the same sequence everywhere —
 * no reliance on the host's Math.random.
 */

function hashSeed(seed: number | string): number {
  if (typeof seed === 'number') return seed >>> 0;
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type Picker = (candidates: readonly string[]) => string;

/** Always returns the first candidate. */
export const firstPicker: Picker = (candidates) => candidates[0] ?? '';

export function createPicker(seed: number | string | undefined): Picker {
  if (seed === undefined) return firstPicker;

  let state = hashSeed(seed);
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return (candidates) => {
    if (candidates.length === 0) return '';
    if (candidates.length === 1) return candidates[0]!;
    return candidates[Math.floor(next() * candidates.length)] ?? candidates[0]!;
  };
}
