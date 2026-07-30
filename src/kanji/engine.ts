import { componentAlias } from '../../data/component-normalize';
import { componentStyle } from '../../data/component-style';
import { homoglyph } from '../../data/homoglyph';
import { override } from '../../data/override';
import { renderableExtra } from '../../data/renderable';
import { getLegible } from '../generated/legible';
import { getStructure } from '../generated/structure';
import { getVariant } from '../generated/variant';
import type { KanjiRoute, SplitPolicy } from '../types';
import { parseIds, type Ids, type Position } from './ids';

export interface EngineOptions {
  variant: boolean;
  splitPolicy: SplitPolicy;
  styleStandalone: boolean;
  maxDepth: number;
  /** Chooses among candidate renderings. */
  pick: (candidates: readonly string[]) => string;
}

export interface EngineResult {
  route: KanjiRoute;
  result: string;
  steps: string[];
}

const POLICY_RANK: Readonly<Record<SplitPolicy, number>> = {
  horizontal: 0,
  balanced: 1,
  aggressive: 2,
};

/** Fold radical-block spellings onto a single canonical component. */
export function normalizeComponent(component: string): string {
  return componentAlias[component] ?? component;
}

function styleOf(component: string, position: Position, opts: EngineOptions): string | undefined {
  const c = normalizeComponent(component);
  const candidates = componentStyle[`${c}@${position}`] ?? componentStyle[c];
  return candidates ? opts.pick(candidates) : undefined;
}

const RENDERABLE_EXTRA = new Set(renderableExtra);

/**
 * Will this component survive being dropped into the output on its own?
 *
 * Broader than "is a JIS X 0208 kanji": 疒 and 灬 are not kanji but every
 * Japanese font draws them, so a split that produces them is still readable.
 */
function isRenderable(component: string): boolean {
  const c = normalizeComponent(component);
  return getLegible().has(c) || RENDERABLE_EXTRA.has(c) || componentStyle[c] !== undefined;
}

/**
 * Should we break a component down further?
 *
 * Two reasons to keep going:
 *
 *  1. The component is not readable on its own. 咅 is not in JIS X 0208, so
 *     倍 becomes ｲ立ﾛ rather than the unreadable ｲ咅 — whereas 吾 *is*, so 語
 *     stops at 言吾.
 *  2. The component itself reads left-to-right. Splitting it again costs the
 *     reader nothing, so 例 becomes ｲ歹ﾘ instead of ｲ列.
 *
 * Checked against galjp v4's hand-written table: this pair of conditions
 * reproduces 3150 of the 3286 characters both sources decompose (95.9%),
 * against 3037 for legibility alone.
 */
function shouldRecurse(component: string): boolean {
  if (!isRenderable(component)) return true;

  const c = normalizeComponent(component);
  const raw = getStructure().get(c) ?? getStructure().get(component);
  if (!raw) return false;
  return parseIds(raw)?.splitClass === 'always';
}

function isLinearizable(ids: Ids, depth: number, opts: EngineOptions): boolean {
  const rank = POLICY_RANK[opts.splitPolicy];

  switch (ids.splitClass) {
    case 'always':
      return true;

    case 'conditional':
      // Nested parts are already inside a split the reader has accepted.
      if (depth >= 1) return true;
      if (rank >= POLICY_RANK.aggressive) return true;
      if (rank < POLICY_RANK.balanced) return false;
      return ids.operands.every(isRenderable);

    case 'enclose':
      return rank >= POLICY_RANK.aggressive;
  }
}

function decompose(char: string, depth: number, opts: EngineOptions): string | null {
  if (depth > opts.maxDepth) return null;

  const raw = getStructure().get(char);
  if (!raw) return null;

  const ids = parseIds(raw);
  if (!ids) return null;
  if (!isLinearizable(ids, depth, opts)) return null;

  const parts: string[] = [];
  for (let i = 0; i < ids.operands.length; i++) {
    const operand = ids.operands[i]!;
    const position = ids.positions[i] ?? 'other';
    const sub = shouldRecurse(operand) ? decompose(operand, depth + 1, opts) : null;
    parts.push(sub ?? styleOf(operand, position, opts) ?? operand);
  }
  return parts.join('');
}

/**
 * Convert a single kanji, trying each route in order.
 *
 * 1. override   — hand-written exceptions (stroke splits)
 * 2. homoglyph  — whole-character look-alikes
 * 3. variant    — swap in the traditional form, then keep going
 * 4. decompose  — split into components
 * 5. style      — decorate a single-component kanji
 */
export function convertKanji(char: string, opts: EngineOptions): EngineResult {
  const steps: string[] = [char];

  const ov = override[char];
  if (ov) {
    const result = opts.pick(ov);
    return { route: 'override', result, steps: [...steps, result] };
  }

  const hg = homoglyph[char];
  if (hg) {
    const result = opts.pick(hg);
    return { route: 'homoglyph', result, steps: [...steps, result] };
  }

  let base = char;
  let usedVariant = false;
  if (opts.variant) {
    const v = getVariant().get(char);
    if (v && v !== char) {
      base = v;
      usedVariant = true;
      steps.push(base);
    }
  }

  const decomposed = decompose(base, 0, opts);
  if (decomposed && decomposed !== base) {
    return { route: 'decompose', result: decomposed, steps: [...steps, decomposed] };
  }

  if (opts.styleStandalone) {
    const styled = styleOf(base, 'other', opts);
    if (styled && styled !== base) {
      return { route: 'style', result: styled, steps: [...steps, styled] };
    }
  }

  return usedVariant
    ? { route: 'variant', result: base, steps }
    : { route: 'none', result: char, steps };
}

/** Every rendering this configuration could produce for one kanji. */
export function kanjiCandidates(char: string, opts: EngineOptions): string[] {
  const seen = new Set<string>();
  const collect = (pick: EngineOptions['pick']): void => {
    const r = convertKanji(char, { ...opts, pick });
    if (r.result !== char) seen.add(r.result);
  };
  collect((c) => c[0]!);
  collect((c) => c[c.length - 1]!);
  return [...seen];
}
