import { parseArgs, UsageError } from '../src/cli/args';
import { run, VERSION, type CliIo } from '../src/cli/run';

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

describe('parseArgs', () => {
  it('collects positional text', () => {
    expect(parseArgs(['信頼してる']).text).toEqual(['信頼してる']);
  });

  it('reads split policy', () => {
    expect(parseArgs(['-p', 'aggressive']).options.splitPolicy).toBe('aggressive');
    expect(parseArgs(['--split-policy', 'horizontal']).options.splitPolicy).toBe('horizontal');
  });

  it('rejects an unknown split policy', () => {
    expect(() => parseArgs(['-p', 'sideways'])).toThrow(UsageError);
  });

  it('rejects a flag with a missing value', () => {
    expect(() => parseArgs(['--seed'])).toThrow(/needs a value/);
  });

  it('turns --no-<layer> into a disabled layer', () => {
    expect(parseArgs(['--no-kanji']).options.layers).toEqual({ kanji: false });
  });

  it('--only enables just the named layers', () => {
    expect(parseArgs(['--only', 'kanji,latin']).options.layers).toEqual({
      latin: true,
      digit: false,
      hiragana: false,
      katakana: false,
      kanji: true,
      symbol: false,
    });
  });

  it('rejects an unknown layer', () => {
    expect(() => parseArgs(['--only', 'kanji,bogus'])).toThrow(UsageError);
    expect(() => parseArgs(['--bogus'])).toThrow(UsageError);
  });

  it('validates max-depth', () => {
    expect(parseArgs(['-d', '0']).options.maxDepth).toBe(0);
    expect(() => parseArgs(['-d', '-1'])).toThrow(UsageError);
    expect(() => parseArgs(['-d', 'x'])).toThrow(UsageError);
  });

  it('treats everything after -- as text', () => {
    expect(parseArgs(['--', '--no-kanji']).text).toEqual(['--no-kanji']);
  });

  it('treats a bare - as text', () => {
    expect(parseArgs(['-']).text).toEqual(['-']);
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
    expect(stdout()).toContain('Usage');
  });

  it('honours --help and --version', async () => {
    const help = makeIo();
    expect(await run(['--help'], help.io)).toBe(0);
    expect(help.stdout()).toContain('galjp');

    const version = makeIo();
    expect(await run(['--version'], version.io)).toBe(0);
    expect(version.stdout()).toBe(`${VERSION}\n`);
  });

  it('reports usage errors on stderr with exit code 2', async () => {
    const { io, stderr, stdout } = makeIo();
    expect(await run(['--bogus'], io)).toBe(2);
    expect(stderr()).toContain('unknown option');
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
});
