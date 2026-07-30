import { LAYER_IDS, type GaljpOptions, type LayerId, type SplitPolicy } from '../types';

export class UsageError extends Error {}

export interface ParsedArgs {
  options: GaljpOptions;
  text: string[];
  explain: boolean;
  help: boolean;
  version: boolean;
}

const SPLIT_POLICIES: readonly string[] = ['horizontal', 'balanced', 'aggressive'];

/**
 * Hand-rolled so the CLI keeps the package dependency-free, and pure so it can
 * be tested without spawning a process.
 */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const options: GaljpOptions = {};
  const layers: Partial<Record<LayerId, boolean>> = {};
  const text: string[] = [];
  let explain = false;
  let help = false;
  let version = false;
  let noMoreFlags = false;

  const valueFor = (index: number, flag: string): string => {
    const value = argv[index];
    if (value === undefined) throw new UsageError(`${flag} needs a value`);
    return value;
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;

    if (noMoreFlags || !arg.startsWith('-') || arg === '-') {
      text.push(arg);
      continue;
    }

    switch (arg) {
      case '--':
        noMoreFlags = true;
        continue;
      case '-h':
      case '--help':
        help = true;
        continue;
      case '-v':
      case '--version':
        version = true;
        continue;
      case '-e':
      case '--explain':
        explain = true;
        continue;
      case '--no-variant':
        options.variant = false;
        continue;
      case '--no-style-standalone':
        options.styleStandalone = false;
        continue;
      case '--no-preserve':
        options.preserve = false;
        continue;
      case '-p':
      case '--split-policy': {
        const value = valueFor(++i, arg);
        if (!SPLIT_POLICIES.includes(value)) {
          throw new UsageError(
            `--split-policy must be one of ${SPLIT_POLICIES.join(', ')} (got "${value}")`,
          );
        }
        options.splitPolicy = value as SplitPolicy;
        continue;
      }
      case '-s':
      case '--seed':
        options.seed = valueFor(++i, arg);
        continue;
      case '-d':
      case '--max-depth': {
        const value = Number(valueFor(++i, arg));
        if (!Number.isInteger(value) || value < 0) {
          throw new UsageError('--max-depth must be a non-negative integer');
        }
        options.maxDepth = value;
        continue;
      }
      case '--only': {
        for (const id of LAYER_IDS) layers[id] = false;
        for (const name of valueFor(++i, arg).split(',')) {
          const id = name.trim();
          if (!LAYER_IDS.includes(id as LayerId)) {
            throw new UsageError(`unknown layer "${id}" (expected ${LAYER_IDS.join(', ')})`);
          }
          layers[id as LayerId] = true;
        }
        continue;
      }
      default:
        break;
    }

    const disabled = /^--no-(.+)$/.exec(arg)?.[1];
    if (disabled !== undefined && LAYER_IDS.includes(disabled as LayerId)) {
      layers[disabled as LayerId] = false;
      continue;
    }

    throw new UsageError(`unknown option "${arg}"`);
  }

  if (Object.keys(layers).length > 0) options.layers = layers;
  return { options, text, explain, help, version };
}
