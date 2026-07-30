import { createConverter, galjp } from '../src/index';

describe('kanji routes', () => {
  const convert = createConverter();

  it.each([
    ['川', 'override', '丿丨丨'],
    ['中', 'homoglyph', '㊥'],
    ['口', 'style', 'ﾛ'],
    ['信', 'decompose', 'ｲ言'],
    ['男', 'decompose', '田ｶ'],
  ])('%s takes the %s route', (char, route, result) => {
    const e = convert.explain(char);
    expect(e.route).toBe(route);
    expect(e.result).toBe(result);
  });

  it('composes a variant substitution with a decomposition', () => {
    // 湾 -> 灣 (traditional form) -> ⿰氵䜌 -> ｼ…
    const e = convert.explain('湾');
    expect(e.route).toBe('decompose');
    expect(e.steps[0]).toBe('湾');
    expect(e.steps[1]).toBe('灣');
    expect(e.result.startsWith('ｼ')).toBe(true);
  });

  it('keeps a variant that cannot be split', () => {
    const e = convert.explain('学');
    expect(e.route).toBe('variant');
    expect(e.result).toBe('學');
  });
});

describe('recursion depth', () => {
  const convert = createConverter();

  it('recurses into a component that reads left-to-right', () => {
    // 例 = ⿰亻列, 列 = ⿰歹刂
    expect(convert.explain('例').result).toBe('ｲ歹ﾘ');
  });

  it('stops at a stacked component that is readable on its own', () => {
    // 語 = ⿰言吾, and 吾 is JIS X 0208 so it stays whole.
    expect(convert.explain('語').result).toBe('言吾');
  });

  it('breaks down a stacked component that is not readable', () => {
    // 倍 = ⿰亻咅, and 咅 is not JIS X 0208.
    expect(convert.explain('倍').result).toBe('ｲ立ﾛ');
  });

  it('respects maxDepth', () => {
    expect(galjp('例', { maxDepth: 0 })).toBe('ｲ列');
  });
});

describe('splitPolicy', () => {
  it('horizontal leaves stacked kanji alone', () => {
    expect(galjp('男', { splitPolicy: 'horizontal' })).toBe('男');
    expect(galjp('信', { splitPolicy: 'horizontal' })).toBe('ｲ言');
  });

  it('balanced splits stacked kanji when both halves stay readable', () => {
    expect(galjp('男', { splitPolicy: 'balanced' })).toBe('田ｶ');
  });

  it('balanced refuses a split that would produce an unreadable part', () => {
    // 券 = ⿱龹刀 and 龹 is neither JIS X 0208 nor a styled component.
    expect(galjp('券', { splitPolicy: 'balanced' })).toBe('券');
  });

  it('aggressive unwraps enclosures', () => {
    // 凶 = ⿴凵乂
    expect(galjp('凶', { splitPolicy: 'balanced' })).toBe('凶');
    expect(galjp('凶', { splitPolicy: 'aggressive' })).toBe('凵ﾒ');
  });
});

describe('component styling reaches every user of a component', () => {
  it('applies ⺮ to every bamboo-radical kanji, not just 竹', () => {
    // v4 special-cased the standalone character and missed the rest.
    expect(galjp('竹')).toBe('ｹｹ');
    expect(galjp('笑')).toBe('ｹｹ夭');
    expect(galjp('箱')).toContain('ｹｹ');
  });

  it('fixes the 部 inconsistency v4 shipped', () => {
    // v4 wrote 立ﾛ卩; 卩 is a different component from ⻏.
    expect(galjp('部')).toBe('立ﾛ⻏');
    expect(galjp('郎')).toBe('良⻏');
  });
});

describe('styleStandalone', () => {
  it('can be switched off', () => {
    expect(galjp('口', { styleStandalone: false })).toBe('口');
    expect(galjp('口')).toBe('ﾛ');
  });
});
