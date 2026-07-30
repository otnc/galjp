import { CommanderError } from 'commander';
import { createConverter } from '../converter';
import type { GaljpOptions } from '../types';
import { buildProgram, toGaljpOptions, VERSION, type CliOptions } from './program';

export { VERSION };

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
  const program = buildProgram();

  // Commander would otherwise write straight to the real streams and call
  // process.exit, which makes it untestable and steals our exit codes.
  program.exitOverride().configureOutput({
    writeOut: (s) => io.stdout(s),
    writeErr: (s) => io.stderr(s),
  });

  let text: string[];
  let cli: CliOptions;
  try {
    program.parse(argv, { from: 'user' });
    text = program.processedArgs[0] as string[];
    cli = program.opts<CliOptions>();
  } catch (error) {
    if (!(error instanceof CommanderError)) throw error;
    // --help and --version are reported as errors with exit code 0.
    return error.exitCode;
  }

  let input: string;
  if (text.length > 0) {
    input = text.join(' ');
  } else if (io.isInteractive) {
    // Nothing piped and nothing to convert: show help instead of hanging.
    // outputHelp rather than helpInformation, so this matches `--help` exactly
    // — helpInformation omits the text added with addHelpText.
    program.outputHelp();
    return 0;
  } else {
    input = await io.readStdin();
  }

  try {
    const options = toGaljpOptions(cli);

    if (cli.explain) {
      const report = explainText(input, options);
      if (report.length > 0) io.stdout(`${report}\n`);
      return 0;
    }

    const converter = createConverter(options);
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
