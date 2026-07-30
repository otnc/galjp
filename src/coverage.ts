import { createConverter } from './converter';
import type { GaljpOptions, KanjiRoute } from './types';

export interface CoverageReport {
  total: number;
  converted: number;
  ratio: number;
  byRoute: Record<KanjiRoute, number>;
}

/**
 * How much of a character set this configuration can actually convert.
 *
 * Used by the CI gate in docs/DESIGN.md §7.3 and by scripts/coverage.ts.
 */
export function measureCoverage(chars: Iterable<string>, options?: GaljpOptions): CoverageReport {
  const converter = createConverter(options);
  const byRoute: Record<KanjiRoute, number> = {
    override: 0,
    homoglyph: 0,
    variant: 0,
    decompose: 0,
    style: 0,
    none: 0,
  };

  let total = 0;
  let converted = 0;
  for (const ch of chars) {
    total++;
    const { route, result } = converter.explain(ch);
    byRoute[route]++;
    if (result !== ch) converted++;
  }

  return { total, converted, ratio: total === 0 ? 0 : converted / total, byRoute };
}
