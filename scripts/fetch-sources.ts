/**
 * Download the raw upstream data into .cache/ (gitignored).
 *
 * KanjiVG — (c) Ulrich Apel, CC BY-SA 3.0 — https://kanjivg.tagaini.net/
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const KANJIVG_XML_GZ =
  'https://github.com/KanjiVG/kanjivg/releases/download/r20250816/kanjivg-20250816.xml.gz';
const UNIHAN_ZIP = 'https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip';

mkdirSync('.cache', { recursive: true });

if (existsSync('.cache/kanjivg.xml')) {
  console.log('.cache/kanjivg.xml already present — skipping download');
} else {
  console.log(`downloading ${KANJIVG_XML_GZ}`);
  const res = await fetch(KANJIVG_XML_GZ);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText}`);
  const gz = Buffer.from(await res.arrayBuffer());
  writeFileSync('.cache/kanjivg.xml.gz', gz);
  writeFileSync('.cache/kanjivg.xml', gunzipSync(gz));
  console.log('wrote .cache/kanjivg.xml');
}

if (existsSync('.cache/Unihan.zip')) {
  console.log('.cache/Unihan.zip already present — skipping download');
} else {
  console.log(`downloading ${UNIHAN_ZIP}`);
  const res = await fetch(UNIHAN_ZIP);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText}`);
  writeFileSync('.cache/Unihan.zip', Buffer.from(await res.arrayBuffer()));
  console.log('wrote .cache/Unihan.zip');
}
