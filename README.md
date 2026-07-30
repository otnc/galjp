# galjp

≠”兯儿亠ﾒウ子亦夂ｵ奐ラィ┐”ラױ — a galmoji (ギャル文字) converter for JavaScript.

Works in browsers, Node.js, Deno, Bun and Cloudflare Workers. The library uses
no Node built-ins and pulls in nothing at runtime; ESM and CJS, TypeScript types
and a CLI included. (The CLI uses `commander`; importing the library never
loads it.)

```bash
npm install galjp
```

## Usage

```ts
import { galjp } from 'galjp';

galjp('信頼してる'); // 'ｲ言束頁Ｕτゑ'
galjp('Hello World!'); // '丩ヨ└└口 山口尺└囙.ᐟ'
galjp('こんにちは！'); // '⊇ωﾚﾆㄘﾚ￡.ᐟ'
galjp('男女'); // '田ｶ女'
galjp('学校'); // '學木交'
```

URLs and emoji are left alone by default:

```ts
galjp('見て https://example.com/A だよ😀');
// '見τ https://example.com/A ﾅﾆ”ょ😀'
```

### Options

```ts
galjp('信頼してる', { layers: { kanji: false } }); // '信頼Ｕτゑ'
galjp('男女', { splitPolicy: 'horizontal' }); // '男女'
galjp('まじ卍', { dictionary: { まじ: 'маＵ”' } }); // 'маＵ”卍'
```

| Option            | Default      | Description                                                                |
| ----------------- | ------------ | -------------------------------------------------------------------------- |
| `layers`          | all on       | Enable/disable `latin`, `digit`, `hiragana`, `katakana`, `kanji`, `symbol` |
| `splitPolicy`     | `'balanced'` | How far kanji may be taken apart — see below                               |
| `variant`         | `true`       | Substitute traditional forms (`学` → `學`)                                 |
| `styleStandalone` | `true`       | Decorate single-component kanji (`口` → `ﾛ`)                               |
| `maxDepth`        | `2`          | Recursion limit when decomposing                                           |
| `seed`            | —            | Seed for candidate selection; deterministic without one                    |
| `preserve`        | URLs + emoji | `RegExp`, `RegExp[]`, a predicate, or `false`                              |
| `dictionary`      | `{}`         | Literal (never regex) replacements, applied first                          |

### Split policy

| Value          | Left/right | Top/bottom                     | Enclosures | Example      |
| -------------- | ---------- | ------------------------------ | ---------- | ------------ |
| `'horizontal'` | ✅         | —                              | —          | `男` → `男`  |
| `'balanced'`   | ✅         | when both halves stay readable | —          | `男` → `田ｶ` |
| `'aggressive'` | ✅         | ✅                             | ✅         | `凶` → `凵ﾒ` |

### Reusing a converter

`createConverter` resolves options and builds the tables once — prefer it in a
loop. See [API](#api) for the full surface.

```ts
import { createConverter } from 'galjp';

const conv = createConverter({ splitPolicy: 'aggressive' });
for (const line of lines) console.log(conv.convert(line));
```

## CLI

```sh
npx galjp 信頼してる       # ｲ言束頁Ｕτゑ
npx galjp 学校             # 學木交
echo 信頼してる | galjp
galjp --explain 湾         # 湾  decompose   湾 → 灣 → ｼ彎
```

Reads stdin when given no text, so it composes with pipes. `galjp --version`
prints the version, `galjp --help` prints the following.

<!-- Keep in step with `galjp --help`. -->

```
Usage: galjp [options] [text...]

ギャル文字 (galmoji) converter.

Reads stdin when given no text, so it composes with pipes.

Arguments:
  text                         text to convert

Options:
  -v, --version                output the version number
  -p, --split-policy <policy>  how far a kanji may be taken apart (choices:
                               "horizontal", "balanced", "aggressive", default:
                               "balanced")
  -s, --seed <seed>            seed for candidate selection (deterministic
                               without one)
  -d, --max-depth <n>          kanji decomposition recursion limit
  --only <layers>              convert only these layers (latin, digit,
                               hiragana, katakana, kanji, symbol)
  -e, --explain                show the route and steps for each character
  --no-variant                 do not substitute traditional forms (学 → 學)
  --no-style-standalone        do not decorate single-component kanji (口 → ﾛ)
  --no-preserve                also convert URLs and emoji
  --no-latin                   skip the latin layer
  --no-digit                   skip the digit layer
  --no-hiragana                skip the hiragana layer
  --no-katakana                skip the katakana layer
  --no-kanji                   skip the kanji layer
  --no-symbol                  skip the symbol layer
  -h, --help                   display help for command

Examples:
  $ galjp 信頼してる                       ｲ言束頁Ｕτゑ
  $ galjp 学校                             學木交
  $ galjp -p aggressive 男女               田ｶ女
  $ echo 信頼してる | galjp
  $ galjp --explain 湾                     湾  decompose  湾 → 灣 → ｼ彎

Data: 5129 kanji structures, 81 traditional-form pairs.
```

## API

### `galjp(input, options?): string`

Convert a string. Returns `''` for `''`, and throws `TypeError` for anything
that is not a string. With no `options` it reuses a shared converter; with
`options` it builds a new one per call, so prefer `createConverter` in a loop.

```ts
galjp('信頼してる'); // 'ｲ言束頁Ｕτゑ'
galjp('男女', { splitPolicy: 'horizontal' }); // '男女'
```

### `createConverter(options?): Converter`

Resolve options and build the lookup tables once.

```ts
interface Converter {
  /** Convert a string. */
  convert(input: string): string;
  /** Every rendering this configuration could produce for one character. */
  candidates(char: string): readonly string[];
  /** Which route converted a character, and the intermediate forms. */
  explain(char: string): Explanation;
  /** The options after defaults are filled in. */
  readonly options: Readonly<ResolvedOptions>;
}

interface Explanation {
  route: 'override' | 'homoglyph' | 'variant' | 'decompose' | 'style' | 'none';
  result: string;
  /** e.g. ['湾', '灣', 'ｼ彎'] */
  steps: readonly string[];
}
```

`explain()` is the fastest way to understand — or report — a surprising result:

```ts
const conv = createConverter();
conv.explain('湾'); // { route: 'decompose', result: 'ｼ彎', steps: ['湾', '灣', 'ｼ彎'] }
conv.explain('川'); // { route: 'override',  result: '丿丨丨', steps: ['川', '丿丨丨'] }
conv.explain('★'); // { route: 'none',      result: '★',    steps: ['★'] }
conv.candidates('あ'); // ['क॑']
```

### `measureCoverage(chars, options?): CoverageReport`

How much of a character set a configuration can convert. Used by the CI gate.

```ts
measureCoverage('日本語漢字');
// { total: 5, converted: 3, ratio: 0.6,
//   byRoute: { decompose: 2, homoglyph: 1, none: 2, override: 0, variant: 0, style: 0 } }
```

### `resolveOptions(options?): ResolvedOptions`

Validate and fill in defaults without building a converter. Throws `TypeError`
naming the offending key.

### Other exports

| Export                                                                                                                  | What it is                                   |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `LAYER_IDS`                                                                                                             | The six layer names, in order                |
| `DATA_META`                                                                                                             | Table sizes and a hash of the generated data |
| `GaljpOptions`, `ResolvedOptions`, `Converter`, `Explanation`, `LayerId`, `SplitPolicy`, `KanjiRoute`, `CoverageReport` | Types                                        |

## How kanji conversion works

Rather than storing a hand-written result for every kanji, galjp stores
**where a character splits** and **how each component is written**, then
combines them:

```
信 → ⿰(亻, 言)      structure, derived from KanjiVG
亻 → ｲ               style map, ~20 hand-written entries
─────────────────
        ｲ言
```

Each kanji is tried against five routes in order:

1. **override** — stroke-level splits no component data can express (`川` → `丿丨丨`)
2. **homoglyph** — whole-character look-alikes (`中` → `㊥`)
3. **variant** — swap in the traditional form, then keep going (`湾` → `灣` → …)
4. **decompose** — split into components (`信` → `ｲ言`)
5. **style** — decorate a kanji that cannot be split (`口` → `ﾛ`)

Because routes 3–5 share one style map, editing a single line changes every
character using that component: `亻` alone reaches about 190 kanji.

See [docs/DESIGN.md](docs/DESIGN.md) for the full design.

## Coverage

Measured with `npm run coverage:report`:

| Character set     | `horizontal` | `balanced` (default) | `aggressive` |
| ----------------- | ------------ | -------------------- | ------------ |
| 常用漢字 (2140)   | 54.3%        | **73.2%**            | 75.5%        |
| JIS X 0208 (6355) | 58.3%        | **77.7%**            | 80.0%        |

Bundle: 86.6 KB raw, 40.1 KB gzip. Kanji tables are built on first use, so text
without kanji never pays for them.

## Migrating from v4

v4's `generate()` is gone; there is no compatibility shim.

| v4                                              | v5                                                         |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `const { generate } = require('galjp')`         | `import { galjp } from 'galjp'`                            |
| `{ alphabet, number, hira, kata, other, word }` | `{ layers: { latin, digit, hiragana, katakana, symbol } }` |
| `generate('')` threw                            | `galjp('')` returns `''`                                   |
| built-in `word.json`                            | `dictionary` option (no built-in phrases)                  |

Kanji output has been rebuilt from scratch and differs throughout. Kana, latin,
digit and symbol output is unchanged from v4 and is covered by a parity test.
Two v4 bugs are fixed, so their output changes: `E` now gives `ヨ` rather than
`∋` (it was being converted twice), and `部` gives `立ﾛ⻏` rather than `立ﾛ卩`.

## Development

```bash
npm run data:fetch    # download KanjiVG + Unihan into .cache/ (gitignored)
npm run data:all      # regenerate data/ and src/generated/
npm run build         # tsup -> dist/
npm test              # jest
npm run check         # prettier + eslint, writing fixes
```

See [CONTRIBUTING.md](CONTRIBUTING.md) — especially if you want to change how a
character converts, which is usually a one-line edit to `data/component-style.ts`.

## Data sources and licence

The code is ISC. The generated tables are derived from third-party data:

- **[KanjiVG](https://kanjivg.tagaini.net/)** © Ulrich Apel — CC BY-SA 3.0.
  Supplies the structure table (`src/generated/structure.ts`).
- **[Unicode Character Database](https://www.unicode.org/)** © Unicode, Inc. —
  Unicode Licence. Supplies the variant table and the JIS X 0208 character set.

See [NOTICE](NOTICE).
