import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildProgram, toGaljpOptions, VERSION, type CliOptions } from '../src/cli/program';
import { run, type CliIo } from '../src/cli/run';

function makeIo(stdin = '', isInteractive = false) {
  const out: string[] = [];
  const err: string[] = [];
  const io: CliIo = {
    stdout: (t) => void out.push(t),
    stderr: (t) => void err.push(t),
    isInteractive,
    readStdin: () => Promise.resolve(stdin),
  };
  return { io, stdout: () => out.join(''), stderr: () => err.join('') };
}

/** Parse argv the way run() does, without executing anything. */
function opts(argv: string[]): CliOptions {
  const program = buildProgram().exitOverride();
  program.parse(argv, { from: 'user' });
  return program.opts<CliOptions>();
}

describe('option parsing', () => {
  it('defaults to the balanced split policy', () => {
    expect(opts([]).splitPolicy).toBe('balanced');
  });

  it('reads the split policy', () => {
    expect(opts(['-p', 'aggressive']).splitPolicy).toBe('aggressive');
    expect(opts(['--split-policy', 'horizontal']).splitPolicy).toBe('horizontal');
  });

  it('rejects an unknown split policy', () => {
    expect(() => opts(['-p', 'sideways'])).toThrow(/sideways/);
  });

  it('rejects a flag with a missing value', () => {
    expect(() => opts(['--seed'])).toThrow();
  });

  it('validates max-depth', () => {
    expect(opts(['-d', '0']).maxDepth).toBe(0);
    expect(() => opts(['-d', '-1'])).toThrow();
    expect(() => opts(['-d', 'x'])).toThrow();
  });

  it('rejects an unknown layer and an unknown flag', () => {
    expect(() => opts(['--only', 'kanji,bogus'])).toThrow(/bogus/);
    expect(() => opts(['--bogus'])).toThrow();
  });
});

describe('toGaljpOptions', () => {
  it('turns --no-<layer> into a disabled layer', () => {
    expect(toGaljpOptions(opts(['--no-kanji'])).layers).toEqual({ kanji: false });
  });

  it('--only enables just the named layers', () => {
    expect(toGaljpOptions(opts(['--only', 'kanji,latin'])).layers).toEqual({
      latin: true,
      digit: false,
      hiragana: false,
      katakana: false,
      kanji: true,
      symbol: false,
    });
  });

  it('lets --no-<layer> win over --only', () => {
    const layers = toGaljpOptions(opts(['--only', 'kanji,latin', '--no-kanji'])).layers;
    expect(layers).toMatchObject({ latin: true, kanji: false });
  });

  it('only sets a flag when it was actually passed', () => {
    const bare = toGaljpOptions(opts([]));
    expect(bare.variant).toBeUndefined();
    expect(bare.styleStandalone).toBeUndefined();
    expect(bare.preserve).toBeUndefined();
    expect(bare.layers).toBeUndefined();

    expect(toGaljpOptions(opts(['--no-variant'])).variant).toBe(false);
    expect(toGaljpOptions(opts(['--no-preserve'])).preserve).toBe(false);
  });
});

describe('run', () => {
  it('converts positional arguments', async () => {
    const { io, stdout } = makeIo();
    expect(await run(['信頼してる'], io)).toBe(0);
    expect(stdout()).toBe('ｲ言束頁Ｕτゑ\n');
  });

  it('joins several arguments with a space', async () => {
    const { io, stdout } = makeIo();
    await run(['学校', '男女'], io);
    expect(stdout()).toBe('學木交 田ｶ女\n');
  });

  it('reads stdin when given no text', async () => {
    const { io, stdout } = makeIo('学校\n');
    expect(await run([], io)).toBe(0);
    expect(stdout()).toBe('學木交\n');
  });

  it('keeps multi-line input line-for-line', async () => {
    const { io, stdout } = makeIo('学校\n男女\n');
    await run([], io);
    expect(stdout()).toBe('學木交\n田ｶ女\n');
  });

  it('prints help when interactive with no input', async () => {
    const { io, stdout } = makeIo('', true);
    expect(await run([], io)).toBe(0);
    expect(stdout()).toContain('Usage:');
  });

  it('honours -h and --help', async () => {
    for (const flag of ['-h', '--help']) {
      const { io, stdout } = makeIo();
      expect(await run([flag], io)).toBe(0);
      expect(stdout()).toContain('Usage: galjp');
      expect(stdout()).toContain('--split-policy');
      expect(stdout()).toContain('Examples:');
    }
  });

  it('honours -v and --version', async () => {
    for (const flag of ['-v', '--version']) {
      const { io, stdout } = makeIo();
      expect(await run([flag], io)).toBe(0);
      expect(stdout()).toBe(`${VERSION}\n`);
    }
  });

  it('reports usage errors on stderr with a non-zero exit code', async () => {
    const { io, stderr, stdout } = makeIo();
    expect(await run(['--bogus'], io)).toBeGreaterThan(0);
    expect(stderr()).toContain('--bogus');
    expect(stdout()).toBe('');
  });

  it('applies options', async () => {
    const horizontal = makeIo();
    await run(['-p', 'horizontal', '男女'], horizontal.io);
    expect(horizontal.stdout()).toBe('男女\n');

    const noKanji = makeIo();
    await run(['--no-kanji', '信頼してる'], noKanji.io);
    expect(noKanji.stdout()).toBe('信頼Ｕτゑ\n');
  });

  it('explains each character', async () => {
    const { io, stdout } = makeIo();
    expect(await run(['--explain', '湾'], io)).toBe(0);
    expect(stdout()).toContain('decompose');
    expect(stdout()).toContain('湾 → 灣');
  });

  it('leaves URLs alone unless --no-preserve', async () => {
    const kept = makeIo();
    await run(['https://example.com/A'], kept.io);
    expect(kept.stdout()).toContain('https://example.com/A');

    const converted = makeIo();
    await run(['--no-preserve', 'https://example.com/A'], converted.io);
    expect(converted.stdout()).not.toContain('https');
  });

  it('treats everything after -- as text', async () => {
    const { io, stdout } = makeIo();
    await run(['--', '--no-kanji'], io);
    expect(stdout()).not.toBe('--no-kanji\n');
  });
});

describe('help output', () => {
  let help = '';

  beforeAll(async () => {
    // Via run() rather than helpInformation(), which omits addHelpText content.
    const { io, stdout } = makeIo();
    await run(['--help'], io);
    help = stdout();
  });

  it('documents every option', () => {
    for (const flag of [
      '-p, --split-policy',
      '-s, --seed',
      '-d, --max-depth',
      '--only',
      '-e, --explain',
      '--no-variant',
      '--no-style-standalone',
      '--no-preserve',
      '--no-kanji',
      '-h, --help',
      '-v, --version',
    ]) {
      expect(help).toContain(flag);
    }
  });

  it('states the version it was built from', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('matches the copy pasted into the README', () => {
    // The README quotes `galjp --help` verbatim; this keeps the two in step
    // rather than letting the docs drift the next time an option is added.
    const readme = readFileSync(join(__dirname, '..', 'README.md'), 'utf8');
    const block = /<!-- Keep in step with `galjp --help`\. -->\n+```\n([\s\S]*?)```/.exec(readme);
    expect(block).not.toBeNull();
    expect(block![1]!.trimEnd()).toBe(help.trimEnd());
  });
});
