/**
 * Minimal ZIP reader — just enough to pull one member out of Unihan.zip.
 *
 * Node ships inflate but no archive reader, and Unicode only publishes Unihan
 * as a zip. Rather than add a dependency for a build-only step we walk the
 * central directory by hand.
 */
import { inflateRawSync } from 'node:zlib';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;

interface CentralEntry {
  name: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function findEndOfCentralDirectory(buf: Buffer): number {
  // The EOCD sits at the end, after an optional comment of up to 64 KiB.
  const start = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= start; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIGNATURE) return i;
  }
  throw new Error('not a zip file: no end-of-central-directory record');
}

function readCentralDirectory(buf: Buffer): CentralEntry[] {
  const eocd = findEndOfCentralDirectory(buf);
  const count = buf.readUInt16LE(eocd + 10);
  let offset = buf.readUInt32LE(eocd + 16);

  const entries: CentralEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(offset) !== CENTRAL_SIGNATURE) {
      throw new Error(`corrupt central directory at entry ${i}`);
    }
    const nameLength = buf.readUInt16LE(offset + 28);
    const extraLength = buf.readUInt16LE(offset + 30);
    const commentLength = buf.readUInt16LE(offset + 32);
    entries.push({
      name: buf.toString('utf8', offset + 46, offset + 46 + nameLength),
      method: buf.readUInt16LE(offset + 10),
      compressedSize: buf.readUInt32LE(offset + 20),
      localHeaderOffset: buf.readUInt32LE(offset + 42),
    });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

/** Extract one member by name. Throws if it is missing or uses an odd codec. */
export function unzipEntry(buf: Buffer, name: string): Buffer {
  const entry = readCentralDirectory(buf).find((e) => e.name === name);
  if (!entry) throw new Error(`zip member not found: ${name}`);

  // Local header repeats the name/extra lengths, and they can differ from the
  // central directory, so read the real data offset from there.
  const lh = entry.localHeaderOffset;
  const nameLength = buf.readUInt16LE(lh + 26);
  const extraLength = buf.readUInt16LE(lh + 28);
  const start = lh + 30 + nameLength + extraLength;
  const data = buf.subarray(start, start + entry.compressedSize);

  if (entry.method === 0) return Buffer.from(data);
  if (entry.method === 8) return inflateRawSync(data);
  throw new Error(`unsupported compression method ${entry.method} for ${name}`);
}
