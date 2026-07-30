/**
 * One-shot migration: v4 JSON tables -> data/*.ts (+ a frozen test fixture).
 *
 * Per docs/DESIGN.md premise 3, the kana / latin / digit / symbol values must
 * survive the rewrite byte-for-byte. This script copies them mechanically so
 * no transcription error can creep in, and snapshots the originals into
 * test/fixtures so the parity test keeps working after lib/ is deleted.
 *
 * Kanji is deliberately NOT ported (premise 4).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

interface Table {
  src: string;
  out: string;
  name: string;
  doc: string;
}

const TABLES: Table[] = [
  { src: 'lib/chars/hiragana.json', out: 'data/hiragana.ts', name: 'hiragana', doc: 'Hiragana' },
  { src: 'lib/chars/katakana.json', out: 'data/katakana.ts', name: 'katakana', doc: 'Katakana' },
  {
    src: 'lib/chars/alphabet.json',
    out: 'data/latin.ts',
    name: 'latin',
    doc: 'Latin letters (keys are upper case; lookup upper-cases first)',
  },
  { src: 'lib/chars/number.json', out: 'data/digit.ts', name: 'digit', doc: 'Digits' },
  { src: 'lib/chars/other.json', out: 'data/symbol.ts', name: 'symbol', doc: 'Symbols' },
];

/** JSON string literals are valid TS string literals, so this is enough. */
const esc = (s: string): string => JSON.stringify(s);

const snapshot: Record<string, Record<string, string>> = {};

for (const t of TABLES) {
  const json = JSON.parse(readFileSync(t.src, 'utf8')) as Record<string, string>;
  snapshot[t.name] = json;

  const body = Object.entries(json)
    .map(([k, v]) => `  ${esc(k)}: ${esc(v)},`)
    .join('\n');

  const source = `/**
 * ${t.doc} -> galmoji.
 *
 * Ported verbatim from galjp v4 (${t.src}). The values are intentionally
 * unchanged — see docs/DESIGN.md premise 3. Regenerate with:
 *   npm run data:port
 */
export const ${t.name}: Readonly<Record<string, string>> = {
${body}
};
`;
  writeFileSync(t.out, source, 'utf8');
  console.log(`wrote ${t.out}: ${Object.keys(json).length} entries`);
}

mkdirSync('test/fixtures', { recursive: true });
writeFileSync('test/fixtures/v4-tables.json', JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
console.log('wrote test/fixtures/v4-tables.json');
