import { digit } from '../../data/digit';
import { hiragana } from '../../data/hiragana';
import { katakana } from '../../data/katakana';
import { latin } from '../../data/latin';
import { symbol } from '../../data/symbol';
import type { LayerId } from '../types';

const FULLWIDTH_START = 0xff01;
const FULLWIDTH_END = 0xff5e;
const ASCII_OFFSET = 0xfee0;

/** Ａ -> A, ７ -> 7. Leaves everything else alone. */
export function foldFullwidth(ch: string): string {
  const cp = ch.codePointAt(0);
  if (cp === undefined || cp < FULLWIDTH_START || cp > FULLWIDTH_END) return ch;
  return String.fromCodePoint(cp - ASCII_OFFSET);
}

/**
 * Decide which layer owns a character.
 *
 * Classification always reads the *original* character. That is the single
 * invariant that stops v4's cascade, where `E` became `ヨ` in the latin table
 * and was then re-read by the katakana table into `∋`.
 */
export function classify(ch: string): LayerId | null {
  const folded = foldFullwidth(ch);
  const cp = folded.codePointAt(0);
  if (cp === undefined) return null;

  if ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a)) return 'latin';
  if (cp >= 0x30 && cp <= 0x39) return 'digit';

  const raw = ch.codePointAt(0)!;
  if (raw >= 0x3041 && raw <= 0x309f) return 'hiragana';
  if (raw >= 0x30a0 && raw <= 0x30ff) return 'katakana';
  if (isHan(ch)) return 'kanji';
  if (symbol[ch] !== undefined) return 'symbol';
  return null;
}

const HAN = /\p{Script=Han}/u;

export function isHan(ch: string): boolean {
  return HAN.test(ch);
}

/**
 * Look up a non-kanji character. Returns undefined when the layer has no entry,
 * which leaves the character untouched.
 */
export function lookupChar(layer: LayerId, ch: string): string | undefined {
  switch (layer) {
    case 'latin':
      return latin[foldFullwidth(ch).toUpperCase()];
    case 'digit':
      return digit[foldFullwidth(ch)];
    case 'hiragana':
      return hiragana[ch];
    case 'katakana':
      return katakana[ch];
    case 'symbol':
      return symbol[ch];
    case 'kanji':
      return undefined;
  }
}
