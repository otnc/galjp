/**
 * Minimal KanjiVG XML reader.
 *
 * KanjiVG encodes each kanji as a tree of <g> elements carrying `kvg:element`
 * (the component) and `kvg:position` (where it sits). That is richer than raw
 * IDS for our purpose: the left/right forms of 阝 already arrive as distinct
 * characters (⻖ / ⻏).
 *
 * Source: https://kanjivg.tagaini.net/  (c) Ulrich Apel, CC BY-SA 3.0
 */

export interface VgNode {
  id?: string;
  element?: string;
  position?: string;
  original?: string;
  children: VgNode[];
}

/** IDS operators we can emit. */
export type IdsOperator = '⿰' | '⿲' | '⿱' | '⿳' | '⿸' | '⿺' | '⿴';

export interface Structure {
  operator: IdsOperator;
  operands: string[];
}

const ATTR = /([a-zA-Z:]+)="([^"]*)"/g;

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  ATTR.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR.exec(raw))) out[m[1]!] = m[2]!;
  return out;
}

/** Parse the whole KanjiVG XML into a forest of <g> nodes. */
export function parseVg(xml: string): VgNode[] {
  const roots: VgNode[] = [];
  const stack: VgNode[] = [];
  const re = /<g\b([^>]*?)(\/?)>|<\/g>/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(xml))) {
    if (m[0] === '</g>') {
      stack.pop();
      continue;
    }
    const a = parseAttrs(m[1]!);
    const node: VgNode = {
      id: a['id'],
      element: a['kvg:element'],
      position: a['kvg:position'],
      original: a['kvg:original'],
      children: [],
    };
    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(node);
    else roots.push(node);
    if (m[2] !== '/') stack.push(node);
  }
  return roots;
}

/**
 * Position signatures we understand, in canonical operand order.
 * Document order is NOT reliable (both `nyo,nyoc` and `nyoc,nyo` occur), so we
 * always reorder by position name.
 */
const SIGNATURES: ReadonlyArray<{ positions: string[]; operator: IdsOperator }> = [
  { positions: ['left', 'right'], operator: '⿰' },
  { positions: ['left', 'center', 'right'], operator: '⿲' },
  { positions: ['top', 'bottom'], operator: '⿱' },
  { positions: ['top', 'middle', 'bottom'], operator: '⿳' },
  { positions: ['tare', 'tarec'], operator: '⿸' },
  { positions: ['nyo', 'nyoc'], operator: '⿺' },
  { positions: ['kamae', 'kamaec'], operator: '⿴' },
];

const IDS_OPERATORS = /[⿰-⿿]/u;

/**
 * A component must be a single printable character we can put in the output.
 *
 * KanjiVG names unencoded components two other ways, and neither is usable:
 * placeholder ids (`CDP-8BC4`) and inline IDS (`暹` carries `⿱日隹`).
 */
function isUsableComponent(element: string | undefined): element is string {
  if (!element) return false;
  if ([...element].length !== 1) return false;
  if (IDS_OPERATORS.test(element)) return false;
  return true;
}

/** Derive a structure from a node's direct children, or null if not describable. */
export function structureOf(node: VgNode): Structure | null {
  const kids = node.children;
  if (kids.length < 2) return null;

  // Every part must be nameable; otherwise we cannot write it out as text.
  if (kids.some((k) => !isUsableComponent(k.element) || !k.position)) return null;

  const byPosition = new Map<string, string>();
  for (const k of kids) {
    // Duplicate positions (e.g. `kamae,-,kamae`) mean a split radical: give up.
    if (byPosition.has(k.position!)) return null;
    byPosition.set(k.position!, k.element!);
  }

  for (const sig of SIGNATURES) {
    if (byPosition.size !== sig.positions.length) continue;
    if (!sig.positions.every((p) => byPosition.has(p))) continue;
    return {
      operator: sig.operator,
      operands: sig.positions.map((p) => byPosition.get(p)!),
    };
  }
  return null;
}

const TOP_LEVEL_ID = /^kvg:[0-9a-f]{5,6}$/;

/**
 * Build char -> Structure.
 *
 * Top-level entries (encoded kanji) win. We then harvest nested subtrees so
 * that unencoded-but-referenced components such as 咅 also get a structure —
 * those are exactly the parts the recursion in §6.3 needs to break down.
 */
export function buildStructureMap(xml: string): Map<string, Structure> {
  const roots = parseVg(xml);
  const map = new Map<string, Structure>();
  const nested: Array<[string, Structure]> = [];

  const walk = (node: VgNode, isTop: boolean): void => {
    const s = structureOf(node);
    if (node.element && s) {
      if (isTop) map.set(node.element, s);
      else nested.push([node.element, s]);
    }
    for (const k of node.children) walk(k, false);
  };

  for (const r of roots) {
    walk(r, Boolean(r.id && TOP_LEVEL_ID.test(r.id) && r.element));
  }
  for (const [ch, s] of nested) if (!map.has(ch)) map.set(ch, s);

  return map;
}

export function formatIds(s: Structure): string {
  return s.operator + s.operands.join('');
}
