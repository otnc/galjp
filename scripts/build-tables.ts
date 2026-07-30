/**
 * data/*.tsv -> src/generated/*.ts
 *
 * The structure table is emitted as one flat string with no separators: every
 * IDS operator has a fixed arity, so `信⿰亻言例⿰亻列…` is unambiguous. That
 * keeps the payload to exactly one character per meaningful symbol.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { componentAlias } from '../data/component-normalize.ts';

const OUT_DIR = 'src/generated';
mkdirSync(OUT_DIR, { recursive: true });

const banner = (what: string, attribution: string): string =>
  `/**
 * ${what}
 *
 * GENERATED FILE — do not edit. Rebuild with: npm run data:build
 *
${attribution}
 */
`;

const KANJIVG_ATTRIBUTION = ` * Derived from KanjiVG (c) Ulrich Apel, licensed CC BY-SA 3.0.
 * https://kanjivg.tagaini.net/`;

const UNICODE_ATTRIBUTION = ` * Derived from the Unicode Character Database (c) Unicode, Inc.
 * https://www.unicode.org/copyright.html`;

function readTsv(path: string): string[][] {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('\t'));
}

// ---------------------------------------------------------------- structure
const ARITY: Readonly<Record<string, number>> = {
  '⿰': 2,
  '⿲': 3,
  '⿱': 2,
  '⿳': 3,
  '⿸': 2,
  '⿺': 2,
  '⿴': 2,
};

const structureRows = readTsv('data/structure.tsv');
const structurePacked = structureRows.map(([ch, ids]) => `${ch}${ids}`).join('');

/**
 * The packed table has no separators — it relies entirely on operator arity.
 * Verify it round-trips here so a malformed row fails the build rather than
 * throwing on someone's first `galjp()` call.
 */
{
  const cps = [...structurePacked];
  let i = 0;
  let parsed = 0;
  while (i < cps.length) {
    const key = cps[i++]!;
    const op = cps[i++]!;
    const n = ARITY[op];
    if (n === undefined) {
      throw new Error(
        `structure table does not round-trip at offset ${i} (key "${key}", operator "${op}")`,
      );
    }
    i += n;
    parsed++;
  }
  if (parsed !== structureRows.length) {
    throw new Error(`round-trip parsed ${parsed} entries, expected ${structureRows.length}`);
  }
}

writeFileSync(
  `${OUT_DIR}/structure.ts`,
  banner('Kanji structure table (char -> IDS).', KANJIVG_ATTRIBUTION) +
    `import { arityOf, isIdsOperator } from '../kanji/ids';

const PACKED =
  ${JSON.stringify(structurePacked)};

export const STRUCTURE_SIZE = ${structureRows.length};

let table: Map<string, string> | null = null;

/** Built on first use so text with no kanji never pays for it. */
export function getStructure(): Map<string, string> {
  if (table) return table;
  const m = new Map<string, string>();
  const cps = [...PACKED];
  let i = 0;
  while (i < cps.length) {
    const key = cps[i++]!;
    const op = cps[i++]!;
    if (!isIdsOperator(op)) throw new Error(\`corrupt structure table at \${i}\`);
    const n = arityOf(op);
    m.set(key, op + cps.slice(i, i + n).join(''));
    i += n;
  }
  table = m;
  return table;
}
`,
  'utf8',
);

// ------------------------------------------------------------------ legible
//
// The runtime only ever asks "is this *component* readable on its own", so it
// needs the JIS X 0208 characters that can actually appear as an operand — not
// all 6355. Restricting the set is lossless and cuts it from 19 KB to 3.5 KB.
const legibleAll = new Set(
  readFileSync('data/legible.tsv', 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .join(''),
);

const reachable = new Set<string>();
for (const [, ids] of structureRows) {
  for (const operand of [...ids!].slice(1)) {
    reachable.add(operand);
    const alias = componentAlias[operand];
    if (alias) reachable.add(alias);
  }
}

const legibleChars = [...reachable]
  .filter((c) => legibleAll.has(c))
  .sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)
  .join('');

writeFileSync(
  `${OUT_DIR}/legible.ts`,
  banner(
    'Readable components (JIS X 0208 characters reachable as an operand).',
    UNICODE_ATTRIBUTION,
  ) +
    `const PACKED =
  ${JSON.stringify(legibleChars)};

export const LEGIBLE_SIZE = ${[...legibleChars].length};

let set: Set<string> | null = null;

export function getLegible(): Set<string> {
  if (!set) set = new Set([...PACKED]);
  return set;
}
`,
  'utf8',
);

// ------------------------------------------------------------------ variant
const variantRows = readTsv('data/variant.tsv');
const variantPacked = variantRows.map(([from, to]) => `${from}${to}`).join('');

writeFileSync(
  `${OUT_DIR}/variant.ts`,
  banner('Kanji -> traditional/variant form (学 -> 學).', UNICODE_ATTRIBUTION) +
    `const PACKED =
  ${JSON.stringify(variantPacked)};

export const VARIANT_SIZE = ${variantRows.length};

let table: Map<string, string> | null = null;

export function getVariant(): Map<string, string> {
  if (table) return table;
  const m = new Map<string, string>();
  const cps = [...PACKED];
  for (let i = 0; i + 1 < cps.length; i += 2) m.set(cps[i]!, cps[i + 1]!);
  table = m;
  return table;
}
`,
  'utf8',
);

// --------------------------------------------------------------------- meta
const hash = createHash('sha256')
  .update(structurePacked)
  .update(legibleChars)
  .update(variantPacked)
  .digest('hex')
  .slice(0, 16);

writeFileSync(
  `${OUT_DIR}/meta.ts`,
  banner('Build metadata.', ' * See structure.ts / legible.ts for data attribution.') +
    `export const DATA_META = {
  structureEntries: ${structureRows.length},
  legibleEntries: ${[...legibleChars].length},
  variantEntries: ${variantRows.length},
  hash: ${JSON.stringify(hash)},
} as const;
`,
  'utf8',
);

console.log(`structure: ${structureRows.length} entries (${structurePacked.length} chars)`);
console.log(`legible:   ${[...legibleChars].length} chars`);
console.log(`variant:   ${variantRows.length} entries`);
console.log(`hash:      ${hash}`);
