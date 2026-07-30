/**
 * Component -> galmoji.
 *
 * This is the heart of the library. Everything else is mechanical: the
 * structure table says *where* a kanji splits, and this table says *how* each
 * piece is written. Changing one line here changes every kanji that uses that
 * component — `亻` alone reaches ~190 characters.
 *
 * Keys are either a bare component or `component@position`. The position forms
 * only exist for components whose shape depends on where they sit; lookup
 * falls back to the bare key. Values are candidate lists — with no `seed` the
 * first is always chosen, so single-element lists are fully deterministic.
 *
 * The core rules below were recovered empirically by aligning galjp v4's
 * hand-written output against KanjiVG's decomposition: every one of them held
 * for 100% of the characters where both sources agreed on the split.
 */
export const componentStyle: Readonly<Record<string, readonly string[]>> = {
  // ---- 偏 (left-hand radicals) — the highest-impact entries ----
  氵: ['ｼ'], // さんずい   ~288 kanji
  扌: ['ｵ'], // てへん     ~201
  亻: ['ｲ'], // にんべん   ~188
  礻: ['ﾈ'], // しめすへん
  冫: ['ﾝ'], // にすい

  // ---- 旁 (right-hand radicals) ----
  刂: ['ﾘ'], // りっとう
  力: ['ｶ'],
  又: ['ﾇ'],
  卜: ['ﾄ'],

  // ---- 冠・脚 (top/bottom) — newly reachable now that vertical splits are
  //      allowed (docs/DESIGN.md §6.3.1). v4 could never use these.
  艹: ['ﾅﾅ'], // くさかんむり ~233 kanji
  竹: ['ｹｹ'], // たけかんむり ~103. v4 had 竹→ｹｹ for the *standalone* character
  //               only, so 笑 箱 節 算 never benefited.
  宀: ['ウ'], // うかんむり   ~50
  冖: ['ワ'], // わかんむり

  // ---- 繞 (wrap-around) ----
  辶: ['ぇ'], // しんにょう

  // ---- Position-independent small parts ----
  口: ['ﾛ'], // ~195 kanji
  夕: ['ﾀ'],
  匕: ['ﾋ'],
  厶: ['ﾑ'],
  乂: ['ﾒ'],
  才: ['ｵ'],
};

/**
 * Components deliberately left alone, recorded so the decision is visible.
 * See docs/DESIGN.md D5 — styling any of these is a one-line change here.
 *
 *   木 (~323)  糸 (~152)  忄 (~124)  月 (~121)  衤 (~55)  頁 (~41)  彳 (~28)
 */
export const UNSTYLED_BY_CHOICE: readonly string[] = ['木', '糸', '忄', '月', '衤', '頁', '彳'];
