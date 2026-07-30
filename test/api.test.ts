import { createConverter, galjp, LAYER_IDS } from '../src/index';

describe('input handling', () => {
  it('returns empty string for empty input (v4 threw)', () => {
    expect(galjp('')).toBe('');
  });

  it.each([[null], [undefined], [42], [{}], [['a']]])('rejects %p', (value) => {
    expect(() => galjp(value as unknown as string)).toThrow(TypeError);
  });

  it('never splits a surrogate pair', () => {
    const input = 'a𠮟b😀c';
    const out = galjp(input, { preserve: false });
    expect(out).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
    expect(out).not.toMatch(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/);
  });

  it('leaves text it cannot convert untouched', () => {
    expect(galjp('◆★☂')).toBe('◆★☂');
  });
});

describe('options validation', () => {
  it.each([
    [{ layers: { nope: true } }],
    [{ layers: { kanji: 'yes' } }],
    [{ variant: 'yes' }],
    [{ splitPolicy: 'sideways' }],
    [{ maxDepth: -1 }],
    [{ maxDepth: 1.5 }],
    [{ seed: {} }],
    [{ preserve: 'https' }],
    [{ dictionary: 'x' }],
  ])('rejects %p', (options) => {
    expect(() => galjp('あ', options as never)).toThrow(TypeError);
  });

  it('names the offending key', () => {
    expect(() => galjp('あ', { maxDepth: -1 })).toThrow(/maxDepth/);
  });

  it('exposes resolved defaults', () => {
    const { options } = createConverter();
    expect(options.splitPolicy).toBe('balanced');
    expect(options.variant).toBe(true);
    expect(options.styleStandalone).toBe(true);
    expect(options.maxDepth).toBe(2);
    for (const id of LAYER_IDS) expect(options.layers[id]).toBe(true);
  });
});

describe('layers', () => {
  it('can be disabled individually', () => {
    expect(galjp('信頼してる', { layers: { kanji: false } })).toBe('信頼Ｕτゑ');
    expect(galjp('こんにちは', { layers: { hiragana: false } })).toBe('こんにちは');
    expect(galjp('Hello', { layers: { latin: false } })).toBe('Hello');
  });
});

describe('preserve', () => {
  it('leaves URLs alone by default', () => {
    expect(galjp('見て https://example.com/A だよ')).toContain('https://example.com/A');
  });

  it('leaves emoji alone by default', () => {
    expect(galjp('あ😀い')).toContain('😀');
  });

  it('can be switched off', () => {
    expect(galjp('https://example.com', { preserve: false })).not.toContain('https');
  });

  it('accepts a custom pattern', () => {
    expect(galjp('keep あ', { preserve: /keep/g })).toBe('keep क॑');
  });

  it('accepts a predicate', () => {
    expect(galjp('あい', { preserve: (t) => t === 'あ' })).toBe('あﾚヽ');
  });
});

describe('dictionary', () => {
  it('applies literal replacements before any layer', () => {
    expect(galjp('まじ卍', { dictionary: { まじ: 'маＵ”' } })).toBe('маＵ”卍');
  });

  it('prefers the longest match', () => {
    const out = galjp('あいう', { dictionary: { あ: 'X', あいう: 'Y' } });
    expect(out).toBe('Y');
  });

  it('treats keys as literal text, not regex', () => {
    // v4 passed keys to `new RegExp`, so `a.c` matched `abc`.
    expect(galjp('abc', { dictionary: { 'a.c': 'HIT' } })).not.toContain('HIT');
    expect(galjp('a.c', { dictionary: { 'a.c': 'HIT' } })).toBe('HIT');
  });

  it('does not throw on regex metacharacters', () => {
    expect(() => galjp('x', { dictionary: { '(': 'y', '[': 'z', '*': 'w' } })).not.toThrow();
  });
});

describe('determinism', () => {
  it('is deterministic without a seed', () => {
    const input = '信頼してる男女';
    expect(galjp(input)).toBe(galjp(input));
  });

  it('gives the same output for the same seed', () => {
    const a = createConverter({ seed: 'abc' });
    const b = createConverter({ seed: 'abc' });
    expect(a.convert('信頼してる')).toBe(b.convert('信頼してる'));
  });
});

describe('candidates and explain', () => {
  const convert = createConverter();

  it('lists candidates for a kana character', () => {
    expect(convert.candidates('あ')).toEqual(['क॑']);
  });

  it('returns an empty list for something it cannot convert', () => {
    expect(convert.candidates('★')).toEqual([]);
  });

  it('reports route none for unconvertible input', () => {
    expect(convert.explain('★').route).toBe('none');
  });
});
