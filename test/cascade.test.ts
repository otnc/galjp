import { createConverter, galjp } from '../src/index';
import v4 from './fixtures/v4-tables.json';

/**
 * The bug that motivated the single-pass design.
 *
 * v4 applied every table in sequence to the *same* variable, so `E` became `ヨ`
 * in the latin table and the katakana table then read that `ヨ` and turned it
 * into `∋`. Its own README documented the un-cascaded output.
 */
describe('no cascade between layers', () => {
  it('E converts once, to ヨ (v4 produced ∋)', () => {
    expect(galjp('E')).toBe('ヨ');
    expect(galjp('E')).not.toBe('∋');
  });

  it('ヨ still converts as katakana', () => {
    expect(galjp('ヨ')).toBe('∋');
  });

  it('matches the v4 README example that v4 itself got wrong', () => {
    expect(galjp('Hello World!')).toBe('丩ヨ└└口 山口尺└囙.ᐟ');
  });

  it('no latin output is re-read by another layer', () => {
    const convert = createConverter();
    for (const [key, expected] of Object.entries(v4.latin)) {
      expect(convert.convert(key)).toBe(expected);
    }
  });

  it('dictionary output is never converted again', () => {
    // ょ is a hiragana key; without sealing it would be converted a second time.
    expect(galjp('仲良し', { dictionary: { 仲良し: 'ｲ㊥ょＵ' } })).toBe('ｲ㊥ょＵ');
  });
});
