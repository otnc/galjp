/**
 * galjp — ≠”兯儿文字変ｵ奐ラィ┐”ラױ
 *
 * ```ts
 * import { galjp } from 'galjp';
 *
 * galjp('信頼してる');  // 'ｲ言束頁Ｕτゑ'
 * galjp('男女');        // '田ｶ女'
 * ```
 */
export { galjp, createConverter, resolveOptions } from './converter';

export type {
  Converter,
  Explanation,
  GaljpOptions,
  KanjiRoute,
  LayerId,
  ResolvedOptions,
  SplitPolicy,
} from './types';

export { LAYER_IDS } from './types';
export { DATA_META } from './generated/meta';
export { measureCoverage } from './coverage';
export type { CoverageReport } from './coverage';
