/**
 * Report how many kanji each configuration can convert.
 *
 * Run against the built bundle so the numbers describe what ships:
 *   npm run build && npm run coverage:report
 */
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

// Loaded from dist/ rather than src/ so the numbers describe the shipped
// bundle. Typed structurally because src/ uses extensionless imports that
// node's ESM resolver cannot follow.
interface CoverageReport {
  total: number;
  converted: number;
  ratio: number;
  byRoute: Record<string, number>;
}
type MeasureCoverage = (
  chars: Iterable<string>,
  options?: Record<string, unknown>,
) => CoverageReport;

// `dist/` is a build artifact that may not exist yet (e.g. during
// `tsc --noEmit`), and its declarations are hand-modelled above anyway, so the
// specifier is kept in a variable — a literal string would make tsc resolve
// module types for it and fail typecheck on a clean checkout.
const distIndex = '../dist/index.js';
const { measureCoverage } = (await import(distIndex)) as unknown as {
  measureCoverage: MeasureCoverage;
};

function readSet(path: string): string[] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .flatMap((l) => [...l]);
}

const sets = {
  常用漢字: readSet('data/joyo.tsv'),
  'JIS X 0208': readSet('data/legible.tsv'),
};

const configs = [
  { name: 'horizontal (v4-like)', options: { splitPolicy: 'horizontal' as const } },
  { name: 'balanced (default)', options: {} },
  { name: 'balanced, no variant', options: { variant: false } },
  { name: 'aggressive', options: { splitPolicy: 'aggressive' as const } },
];

for (const [setName, chars] of Object.entries(sets)) {
  console.log(`\n=== ${setName} (${chars.length} chars) ===`);
  for (const { name, options } of configs) {
    const r = measureCoverage(chars, options);
    const pct = (r.ratio * 100).toFixed(1).padStart(5);
    const routes = Object.entries(r.byRoute)
      .filter(([k, v]) => v > 0 && k !== 'none')
      .map(([k, v]) => `${k}:${v}`)
      .join(' ');
    console.log(
      `  ${name.padEnd(22)} ${pct}%  ${String(r.converted).padStart(5)}/${r.total}  ${routes}`,
    );
  }
}

const esm = readFileSync('dist/index.js');
console.log(
  `\nbundle: ${(esm.length / 1024).toFixed(1)} KB raw, ` +
    `${(gzipSync(esm).length / 1024).toFixed(1)} KB gzip`,
);
