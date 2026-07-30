/**
 * Hand-written exceptions, checked before every other route.
 *
 * Only things the algorithm cannot reach belong here. KanjiVG (like IDS)
 * describes a character down to its *components* and stops; it never goes to
 * the stroke level, so 川→丿丨丨 can only ever be written by hand.
 *
 * Deliberately NOT listed, because the engine now derives them:
 *   多 = ⿱夕夕 → ﾀﾀ      外 = ⿰夕卜 → ﾀﾄ      双 = ⿰又又 → ﾇﾇ
 *   竹 → ｹｹ   (single-component styling, docs/DESIGN.md route 5)
 *
 * v4's 火 → "'人'" is not carried over: the ASCII apostrophes look like a typo
 * and premise 4 removes any obligation to keep it (docs/DESIGN.md D4).
 */
export const override: Readonly<Record<string, readonly string[]>> = {
  // Stroke-level splits — unreachable from component data.
  川: ['丿丨丨'],
  小: ['ﾉ丨ヽ'],
  北: ['ﾆ丨ﾋ'],
  水: ['ﾌＫ'],
  氷: ['ﾗＫ'],
  以: ['ﾚ丶人'],
  比: ['ﾋﾋ'],
  死: ['ﾀﾋ'],
  玉: ['王､'],

  // 友 is ⿴𠂇又 (an enclosure), which the default split policy declines.
  友: ['ﾅﾇ'],
};
