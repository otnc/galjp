import { applyDictionary, compileDictionary, type DictionaryRule } from './dictionary';
import { convertKanji, kanjiCandidates, type EngineOptions } from './kanji/engine';
import { classify, lookupChar } from './layers/char';
import { applyPreserve, DEFAULT_PRESERVE, type PreserveOption } from './protect';
import { createPicker, firstPicker, type Picker } from './random';
import { render, segment } from './segment';
import {
  LAYER_IDS,
  type Converter,
  type Explanation,
  type GaljpOptions,
  type LayerId,
  type ResolvedOptions,
  type SplitPolicy,
} from './types';

const SPLIT_POLICIES: readonly SplitPolicy[] = ['horizontal', 'balanced', 'aggressive'];

function fail(message: string): never {
  throw new TypeError(`galjp: ${message}`);
}

function resolvePreserve(value: GaljpOptions['preserve']): PreserveOption {
  if (value === undefined) return DEFAULT_PRESERVE;
  if (value === false) return false;
  if (typeof value === 'function') return value;
  if (value instanceof RegExp) return [value];
  if (Array.isArray(value)) {
    for (const r of value) {
      if (!(r instanceof RegExp)) fail('options.preserve must contain RegExp values');
    }
    return value as readonly RegExp[];
  }
  return fail('options.preserve must be a RegExp, RegExp[], function, or false');
}

export function resolveOptions(options: GaljpOptions = {}): ResolvedOptions {
  if (options === null || typeof options !== 'object') fail('options must be an object');

  const layers = {} as Record<LayerId, boolean>;
  for (const id of LAYER_IDS) layers[id] = true;

  if (options.layers !== undefined) {
    if (options.layers === null || typeof options.layers !== 'object') {
      fail('options.layers must be an object');
    }
    for (const [key, value] of Object.entries(options.layers)) {
      if (!LAYER_IDS.includes(key as LayerId)) {
        fail(`unknown layer "${key}" (expected one of ${LAYER_IDS.join(', ')})`);
      }
      if (typeof value !== 'boolean') fail(`options.layers.${key} must be a boolean`);
      layers[key as LayerId] = value;
    }
  }

  if (options.variant !== undefined && typeof options.variant !== 'boolean') {
    fail('options.variant must be a boolean');
  }
  if (options.styleStandalone !== undefined && typeof options.styleStandalone !== 'boolean') {
    fail('options.styleStandalone must be a boolean');
  }
  if (options.splitPolicy !== undefined && !SPLIT_POLICIES.includes(options.splitPolicy)) {
    fail(`options.splitPolicy must be one of ${SPLIT_POLICIES.join(', ')}`);
  }
  if (
    options.maxDepth !== undefined &&
    (typeof options.maxDepth !== 'number' ||
      !Number.isInteger(options.maxDepth) ||
      options.maxDepth < 0)
  ) {
    fail('options.maxDepth must be a non-negative integer');
  }
  if (
    options.seed !== undefined &&
    typeof options.seed !== 'number' &&
    typeof options.seed !== 'string'
  ) {
    fail('options.seed must be a number or string');
  }
  if (
    options.dictionary !== undefined &&
    (options.dictionary === null || typeof options.dictionary !== 'object')
  ) {
    fail('options.dictionary must be an object');
  }

  return {
    layers,
    variant: options.variant ?? true,
    splitPolicy: options.splitPolicy ?? 'balanced',
    styleStandalone: options.styleStandalone ?? true,
    maxDepth: options.maxDepth ?? 2,
    seed: options.seed as number | string,
    preserve: resolvePreserve(options.preserve),
    dictionary: options.dictionary ?? {},
  };
}

class GaljpConverter implements Converter {
  readonly options: ResolvedOptions;

  readonly #pick: Picker;
  readonly #rules: DictionaryRule[];
  readonly #engine: EngineOptions;
  readonly #cache = new Map<string, string>();

  constructor(options: ResolvedOptions) {
    this.options = options;
    this.#pick = createPicker(options.seed);
    this.#rules = compileDictionary(options.dictionary);
    this.#engine = {
      variant: options.variant,
      splitPolicy: options.splitPolicy,
      styleStandalone: options.styleStandalone,
      maxDepth: options.maxDepth,
      pick: this.#pick,
    };
  }

  convert(input: string): string {
    if (typeof input !== 'string') fail('input must be a string');
    if (input.length === 0) return '';

    const segments = segment(input);
    applyPreserve(input, segments, this.options.preserve);
    applyDictionary(segments, this.#rules, this.#pick);

    for (const seg of segments) {
      if (seg.sealed) continue;

      const layer = classify(seg.source);
      if (layer === null || !this.options.layers[layer]) {
        seg.sealed = true;
        continue;
      }

      seg.output =
        layer === 'kanji' ? this.#kanji(seg.source) : (lookupChar(layer, seg.source) ?? seg.source);
      seg.sealed = true;
    }

    return render(segments);
  }

  candidates(char: string): readonly string[] {
    if (typeof char !== 'string') fail('char must be a string');
    const layer = classify(char);
    if (layer === null || !this.options.layers[layer]) return [];
    if (layer === 'kanji') return kanjiCandidates(char, this.#engine);
    const value = lookupChar(layer, char);
    return value === undefined ? [] : [value];
  }

  explain(char: string): Explanation {
    if (typeof char !== 'string') fail('char must be a string');
    const layer = classify(char);
    if (layer === null || !this.options.layers[layer]) {
      return { route: 'none', result: char, steps: [char] };
    }
    if (layer === 'kanji') {
      const r = convertKanji(char, this.#engine);
      return { route: r.route, result: r.result, steps: r.steps };
    }
    const value = lookupChar(layer, char);
    return value === undefined
      ? { route: 'none', result: char, steps: [char] }
      : { route: 'style', result: value, steps: [char, value] };
  }

  /** Kanji conversion is the expensive path, so memoise per converter. */
  #kanji(char: string): string {
    const hit = this.#cache.get(char);
    if (hit !== undefined) return hit;
    const value = convertKanji(char, this.#engine).result;
    this.#cache.set(char, value);
    return value;
  }
}

export function createConverter(options?: GaljpOptions): Converter {
  return new GaljpConverter(resolveOptions(options));
}

const defaultConverter = createConverter();

export function galjp(input: string, options?: GaljpOptions): string {
  if (options === undefined) return defaultConverter.convert(input);
  return createConverter(options).convert(input);
}

export { firstPicker };
