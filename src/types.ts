/** The character classes galjp converts. */
export type LayerId = 'latin' | 'digit' | 'hiragana' | 'katakana' | 'kanji' | 'symbol';

export const LAYER_IDS: readonly LayerId[] = [
  'latin',
  'digit',
  'hiragana',
  'katakana',
  'kanji',
  'symbol',
];

/**
 * How aggressively a kanji may be taken apart.
 *
 * - `horizontal` — left/right splits only. Closest to galjp v4.
 * - `balanced`   — also splits top/bottom when every piece stays readable.
 * - `aggressive` — also unwraps enclosures (国 → 囗玉).
 */
export type SplitPolicy = 'horizontal' | 'balanced' | 'aggressive';

/** Which route produced a conversion. Surfaced by {@link Converter.explain}. */
export type KanjiRoute = 'override' | 'homoglyph' | 'variant' | 'decompose' | 'style' | 'none';

export interface GaljpOptions {
  /** Enable/disable individual layers. Every layer is on by default. */
  layers?: Partial<Record<LayerId, boolean>>;
  /** Replace a kanji with its traditional/variant form (学 → 學). Default true. */
  variant?: boolean;
  /** How far a kanji may be split apart. Default `'balanced'`. */
  splitPolicy?: SplitPolicy;
  /** Style single-component kanji that cannot be split (口 → ﾛ). Default true. */
  styleStandalone?: boolean;
  /** Maximum recursion depth when decomposing. Default 2. */
  maxDepth?: number;
  /** Seed for candidate selection. Without one, the first candidate always wins. */
  seed?: number | string;
  /**
   * Text to leave untouched. Defaults to URLs and emoji.
   * Pass `false` to convert everything.
   */
  preserve?: RegExp | readonly RegExp[] | ((text: string) => boolean) | false;
  /** Literal (never regex) replacements applied before any layer. */
  dictionary?: Readonly<Record<string, string | readonly string[]>>;
}

export type ResolvedOptions = Required<Omit<GaljpOptions, 'layers' | 'preserve'>> & {
  layers: Record<LayerId, boolean>;
  preserve: readonly RegExp[] | ((text: string) => boolean) | false;
};

export interface Explanation {
  route: KanjiRoute;
  result: string;
  /** Intermediate forms, e.g. `['沢', '澤', 'ｼ睪']`. */
  steps: readonly string[];
}

export interface Converter {
  convert(input: string): string;
  /** Every rendering this converter could produce for a single character. */
  candidates(char: string): readonly string[];
  /** How a single character is converted, and by which route. */
  explain(char: string): Explanation;
  readonly options: Readonly<ResolvedOptions>;
}
