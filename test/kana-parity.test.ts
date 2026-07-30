import { createConverter } from '../src/index';
import v4 from './fixtures/v4-tables.json';

/**
 * Premise 3 of docs/DESIGN.md: kana, latin, digit and symbol output must be
 * byte-for-byte what galjp v4 produced. This is the regression net for
 * everything we deliberately did NOT change.
 */
describe('v4 parity for non-kanji layers', () => {
  const convert = createConverter();

  const tables: Array<[string, Record<string, string>]> = [
    ['hiragana', v4.hiragana],
    ['katakana', v4.katakana],
    ['digit', v4.digit],
    ['symbol', v4.symbol],
  ];

  for (const [name, table] of tables) {
    it(`${name}: every v4 key still maps to the v4 value`, () => {
      const mismatches: string[] = [];
      for (const [key, expected] of Object.entries(table)) {
        const actual = convert.convert(key);
        if (actual !== expected) mismatches.push(`${key}: expected ${expected}, got ${actual}`);
      }
      expect(mismatches).toEqual([]);
    });
  }

  it('latin: v4 keys map to the v4 value (upper and lower case)', () => {
    const mismatches: string[] = [];
    for (const [key, expected] of Object.entries(v4.latin)) {
      for (const variant of [key, key.toLowerCase()]) {
        const actual = convert.convert(variant);
        if (actual !== expected) {
          mismatches.push(`${variant}: expected ${expected}, got ${actual}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('converts the README examples', () => {
    expect(convert.convert('信頼してる')).toBe('ｲ言束頁Ｕτゑ');
    expect(convert.convert('こんにちは！')).toBe('⊇ωﾚﾆㄘﾚ￡.ᐟ');
  });
});
