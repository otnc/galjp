import { Command, InvalidArgumentError, Option } from 'commander';
import { LAYER_IDS, type GaljpOptions, type LayerId, type SplitPolicy } from '../types';
import { DATA_META } from '../generated/meta';

export const VERSION = '5.0.0';

const SPLIT_POLICIES: readonly SplitPolicy[] = ['horizontal', 'balanced', 'aggressive'];

function parseMaxDepth(value: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new InvalidArgumentError('must be a non-negative integer.');
  }
  return n;
}

function parseLayerList(value: string): LayerId[] {
  const ids: LayerId[] = [];
  for (const name of value.split(',')) {
    const id = name.trim();
    if (!LAYER_IDS.includes(id as LayerId)) {
      throw new InvalidArgumentError(`unknown layer "${id}". Expected: ${LAYER_IDS.join(', ')}.`);
    }
    ids.push(id as LayerId);
  }
  return ids;
}

/** Shape commander produces from the flags below. */
export interface CliOptions {
  splitPolicy: SplitPolicy;
  seed?: string;
  maxDepth?: number;
  only?: LayerId[];
  explain?: boolean;
  variant: boolean;
  styleStandalone: boolean;
  preserve: boolean;
  latin: boolean;
  digit: boolean;
  hiragana: boolean;
  katakana: boolean;
  kanji: boolean;
  symbol: boolean;
}

/**
 * Build the command definition.
 *
 * Kept separate from execution so the tests can drive it without touching the
 * real process, and so `--help` output can be rendered anywhere.
 */
export function buildProgram(): Command {
  const program = new Command();

  program
    .name('galjp')
    // Commander wraps help text to `process.stdout.columns`, which makes the
    // output depend on the terminal it happens to run in (a wide PowerShell
    // window wraps differently from CI's non-TTY 80). Pin it so `--help` is
    // identical everywhere, including the copy embedded in the README.
    .configureHelp({ helpWidth: 80 })
    .description(
      'ギャル文字 (galmoji) converter.\n\nReads stdin when given no text, so it composes with pipes.',
    )
    .version(VERSION, '-v, --version', 'output the version number')
    .helpOption('-h, --help', 'display help for command')
    .argument('[text...]', 'text to convert')
    .addOption(
      new Option('-p, --split-policy <policy>', 'how far a kanji may be taken apart')
        .choices(SPLIT_POLICIES)
        .default('balanced'),
    )
    .option('-s, --seed <seed>', 'seed for candidate selection (deterministic without one)')
    .option('-d, --max-depth <n>', 'kanji decomposition recursion limit', parseMaxDepth)
    .option(
      '--only <layers>',
      `convert only these layers (${LAYER_IDS.join(', ')})`,
      parseLayerList,
    )
    .option('-e, --explain', 'show the route and steps for each character')
    .option('--no-variant', 'do not substitute traditional forms (学 → 學)')
    .option('--no-style-standalone', 'do not decorate single-component kanji (口 → ﾛ)')
    .option('--no-preserve', 'also convert URLs and emoji')
    .option('--no-latin', 'skip the latin layer')
    .option('--no-digit', 'skip the digit layer')
    .option('--no-hiragana', 'skip the hiragana layer')
    .option('--no-katakana', 'skip the katakana layer')
    .option('--no-kanji', 'skip the kanji layer')
    .option('--no-symbol', 'skip the symbol layer')
    .addHelpText(
      'after',
      `
Examples:
  $ galjp 信頼してる                       ｲ言束頁Ｕτゑ
  $ galjp 学校                             學木交
  $ galjp -p aggressive 男女               田ｶ女
  $ echo 信頼してる | galjp
  $ galjp --explain 湾                     湾  decompose  湾 → 灣 → ｼ彎

Data: ${DATA_META.structureEntries} kanji structures, ${DATA_META.variantEntries} traditional-form pairs.`,
    );

  return program;
}

/** Translate commander's flat option bag into library options. */
export function toGaljpOptions(cli: CliOptions): GaljpOptions {
  const options: GaljpOptions = { splitPolicy: cli.splitPolicy };

  if (cli.seed !== undefined) options.seed = cli.seed;
  if (cli.maxDepth !== undefined) options.maxDepth = cli.maxDepth;
  if (!cli.variant) options.variant = false;
  if (!cli.styleStandalone) options.styleStandalone = false;
  if (!cli.preserve) options.preserve = false;

  const layers: Partial<Record<LayerId, boolean>> = {};
  if (cli.only) {
    for (const id of LAYER_IDS) layers[id] = cli.only.includes(id);
  }
  // Applied after --only so `--only kanji --no-kanji` resolves the obvious way.
  for (const id of LAYER_IDS) {
    if (cli[id] === false) layers[id] = false;
  }
  if (Object.keys(layers).length > 0) options.layers = layers;

  return options;
}
