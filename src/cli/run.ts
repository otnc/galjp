import { createConverter } from '../converter';
import { DATA_META } from '../generated/meta';
import { LAYER_IDS, type GaljpOptions } from '../types';
import { parseArgs, UsageError } from './args';

export const VERSION = '5.0.0';

export const HELP = `galjp ${VERSION} — ギャル文字 converter

Usage
  galjp [options] [text...]
  <stdin> | galjp [options]

Examples
  galjp 信頼してる                      ｲ言束頁Ｕτゑ
  galjp 学校                            學木交
  galjp --split-policy aggressive 男女
  echo 信頼してる | galjp
  galjp --explain 湾

Options
  -p, --split-policy <policy>  horizontal | balanced (default) | aggressive
  -s, --seed <seed>            seed for candidate selection
  -d, --max-depth <n>          kanji recursion limit (default 2)
      --only <layers>          convert only these comma-separated layers
      --no-<layer>             skip a layer (${LAYER_IDS.join(', ')})
      --no-variant             do not substitute traditional forms (学 → 學)
      --no-style-standalone    do not decorate single-component kanji (口 → ﾛ)
      --no-preserve            also convert URLs and emoji
  -e, --explain                show how each character was converted
  -h, --help                   show this help
  -v, --version                show the version

Data: ${DATA_META.structureEntries} kanji structures, ${DATA_META.variantEntries} variants.
`;

/** Injected so tests can drive the CLI without touching the real process. */
export interface CliIo {
  stdout(text: string): void;
  stderr(text: string): void;
  readStdin(): Promise<string>;
  /** True when there is no piped input, i.e. nothing to read. */
  isInteractive: boolean;
}

function explainText(input: string, options: GaljpOptions): string {
  const converter = createConverter(options);
  const rows: string[] = [];
  for (const char of input) {
    if (/\s/u.test(char)) continue;
    const { route, steps } = converter.explain(char);
    rows.push(`${char}  ${route.padEnd(10)}  ${steps.join(' → ')}`);
  }
  return rows.join('\n');
}

export async function run(argv: readonly string[], io: CliIo): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    io.stderr(`galjp: ${error.message}\n\nRun \`galjp --help\` for usage.\n`);
    return 2;
  }

  if (parsed.help) {
    io.stdout(HELP);
    return 0;
  }
  if (parsed.version) {
    io.stdout(`${VERSION}\n`);
    return 0;
  }

  let input: string;
  if (parsed.text.length > 0) {
    input = parsed.text.join(' ');
  } else if (io.isInteractive) {
    // Nothing piped and nothing to convert: show help instead of hanging.
    io.stdout(HELP);
    return 0;
  } else {
    input = await io.readStdin();
  }

  try {
    if (parsed.explain) {
      const report = explainText(input, parsed.options);
      if (report.length > 0) io.stdout(`${report}\n`);
      return 0;
    }

    const converter = createConverter(parsed.options);
    // Convert line by line so `preserve` patterns cannot span a newline, and
    // keep the input's trailing-newline shape.
    const trailing = input.endsWith('\n') ? '' : '\n';
    const output = input
      .split('\n')
      .map((line) => converter.convert(line))
      .join('\n');
    io.stdout(output + trailing);
    return 0;
  } catch (error) {
    io.stderr(`galjp: ${(error as Error).message}\n`);
    return 1;
  }
}
