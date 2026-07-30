/**
 * Digits -> galmoji.
 *
 * Ported verbatim from galjp v4 (lib/chars/number.json). The values are intentionally
 * unchanged — see docs/DESIGN.md premise 3. Regenerate with:
 *   npm run data:port
 */
export const digit: Readonly<Record<string, string>> = {
  '0': 'Θ',
  '1': '｜',
  '2': 'ｚ',
  '3': 'З',
  '4': '〆',
  '5': 'ｓ',
  '6': 'б',
  '7': 'ﾌ',
  '8': '∞',
  '9': 'q',
};
