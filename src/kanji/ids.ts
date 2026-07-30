/**
 * Ideographic Description Sequences.
 *
 * The structure table stores each entry as an operator followed by its
 * operands (`信` -> `⿰亻言`). Because every operator has a fixed arity the
 * encoding is self-delimiting, which is what lets the generated table be one
 * flat string with no separators.
 */

export type IdsOperator = '⿰' | '⿲' | '⿱' | '⿳' | '⿸' | '⿺' | '⿴';

/** Where an operand sits, used for position-sensitive style lookup. */
export type Position = 'left' | 'right' | 'top' | 'bottom' | 'other';

/**
 * How a structure interacts with {@link SplitPolicy}.
 *
 * - `always`      — reads left-to-right already; never needs permission.
 *                   ⿺ is here because a 繞 radical (辶, 廴) linearises the same
 *                   way a left-hand radical does.
 * - `conditional` — stacked; allowed from `balanced` up, and only when every
 *                   piece stays readable on its own.
 * - `enclose`     — one part wraps the other; only `aggressive` unwraps it.
 */
export type SplitClass = 'always' | 'conditional' | 'enclose';

interface OperatorInfo {
  arity: number;
  positions: readonly Position[];
  splitClass: SplitClass;
}

const OPERATORS: Readonly<Record<IdsOperator, OperatorInfo>> = {
  '⿰': { arity: 2, positions: ['left', 'right'], splitClass: 'always' },
  '⿲': { arity: 3, positions: ['left', 'other', 'right'], splitClass: 'always' },
  '⿺': { arity: 2, positions: ['left', 'other'], splitClass: 'always' },
  '⿱': { arity: 2, positions: ['top', 'bottom'], splitClass: 'conditional' },
  '⿳': { arity: 3, positions: ['top', 'other', 'bottom'], splitClass: 'conditional' },
  '⿸': { arity: 2, positions: ['top', 'other'], splitClass: 'conditional' },
  '⿴': { arity: 2, positions: ['other', 'other'], splitClass: 'enclose' },
};

export interface Ids {
  operator: IdsOperator;
  operands: readonly string[];
  positions: readonly Position[];
  splitClass: SplitClass;
}

export function isIdsOperator(ch: string): ch is IdsOperator {
  return Object.prototype.hasOwnProperty.call(OPERATORS, ch);
}

export function arityOf(op: IdsOperator): number {
  return OPERATORS[op].arity;
}

/** Parse one `⿰亻言`-style entry. Returns null if malformed. */
export function parseIds(raw: string): Ids | null {
  const cps = [...raw];
  const op = cps[0];
  if (!op || !isIdsOperator(op)) return null;

  const info = OPERATORS[op];
  const operands = cps.slice(1);
  if (operands.length !== info.arity) return null;

  return {
    operator: op,
    operands,
    positions: info.positions,
    splitClass: info.splitClass,
  };
}
