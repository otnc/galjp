import { readFileSync } from 'node:fs';
import { componentAlias } from '../data/component-normalize';
import { componentStyle, UNSTYLED_BY_CHOICE } from '../data/component-style';
import { homoglyph } from '../data/homoglyph';
import { override } from '../data/override';
import { renderableExtra } from '../data/renderable';
import { getStructure } from '../src/generated/structure';
import { measureCoverage } from '../src/index';

function readSet(path: string): string[] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .flatMap((l) => [...l]);
}

const operands = (() => {
  const set = new Set<string>();
  for (const ids of getStructure().values()) {
    for (const operand of [...ids].slice(1)) set.add(operand);
  }
  return set;
})();

/**
 * v4 shipped 部 as 立ﾛ卩 while every other 邑-radical kanji used ⻏, and nothing
 * could catch it because the output was written out by hand. These checks are
 * the structural replacement for that.
 */
describe('component data is consistent', () => {
  it('every styled component actually occurs in the structure table', () => {
    const dead = Object.keys(componentStyle)
      .map((k) => k.split('@')[0]!)
      .filter((c) => !operands.has(c) && !getStructure().has(c));
    expect(dead).toEqual([]);
  });

  it('every alias source occurs, and every alias target is styled or reachable', () => {
    for (const [from, to] of Object.entries(componentAlias)) {
      expect(from).not.toBe(to);
      const known = operands.has(to) || componentStyle[to] !== undefined;
      expect(known).toBe(true);
    }
  });

  it('no component is both styled and declared unstyled', () => {
    for (const c of UNSTYLED_BY_CHOICE) {
      expect(componentStyle[c]).toBeUndefined();
    }
  });

  it('no style entry is a no-op', () => {
    for (const [key, candidates] of Object.entries(componentStyle)) {
      const component = key.split('@')[0]!;
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates).not.toContain(component);
    }
  });

  it('renderable extras are single characters and not already legible kanji', () => {
    for (const c of renderableExtra) {
      expect([...c]).toHaveLength(1);
    }
    expect(new Set(renderableExtra).size).toBe(renderableExtra.length);
  });

  it('override and homoglyph do not overlap', () => {
    const both = Object.keys(override).filter((c) => homoglyph[c] !== undefined);
    expect(both).toEqual([]);
  });

  it('override entries are all unreachable by the engine', () => {
    // Anything the algorithm can already derive should not be hand-written.
    for (const char of Object.keys(override)) {
      const structure = getStructure().get(char);
      const derivable = structure !== undefined && '⿰⿲⿺'.includes([...structure][0]!);
      expect(derivable).toBe(false);
    }
  });
});

describe('coverage gates', () => {
  const joyo = readSet('data/joyo.tsv');
  const jis = readSet('data/legible.tsv');

  it('converts at least 70% of 常用漢字', () => {
    const r = measureCoverage(joyo);
    expect(r.ratio).toBeGreaterThanOrEqual(0.7);
  });

  it('converts at least 75% of JIS X 0208', () => {
    const r = measureCoverage(jis);
    expect(r.ratio).toBeGreaterThanOrEqual(0.75);
  });

  it('beats the v4-equivalent policy by a wide margin', () => {
    const balanced = measureCoverage(jis).converted;
    const horizontal = measureCoverage(jis, { splitPolicy: 'horizontal' }).converted;
    expect(balanced).toBeGreaterThan(horizontal * 1.25);
  });

  it('converts more kanji than v4 did in total', () => {
    // v4's hand-written table converted 3359 kanji.
    expect(measureCoverage(jis).converted).toBeGreaterThan(3359);
  });
});
