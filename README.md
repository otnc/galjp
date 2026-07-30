# galjp

≠”兯儿亠ﾒウ子亦夂ｵ奐ラィ┐”ラױ — JavaScript 向けのギャル文字変換ライブラリ。

ブラウザ、Node.js、Deno、Bun、Cloudflare Workers で動作します。ライブラリ本体は Node.js 固有の API を使わず、実行時に何も依存しません。ESM と CJS の両方、TypeScript の型定義、CLI を同梱しています（CLI は `commander` を使いますが、ライブラリ本体をインポートしても読み込まれません）。

```bash
npm install galjp
```

## 使い方

```ts
import { galjp } from 'galjp';

galjp('信頼してる'); // 'ｲ言束頁Ｕτゑ'
galjp('Hello World!'); // '丩ヨ└└口 山口尺└囙.ᐟ'
galjp('こんにちは！'); // '⊇ωﾚﾆㄘﾚ￡.ᐟ'
galjp('男女'); // '田ｶ女'
galjp('学校'); // '學木交'
```

URL と絵文字は既定で変換されません。

```ts
galjp('見て https://example.com/A だよ😀');
// '見τ https://example.com/A ﾅﾆ”ょ😀'
```

### オプション

```ts
galjp('信頼してる', { layers: { kanji: false } }); // '信頼Ｕτゑ'
galjp('男女', { splitPolicy: 'horizontal' }); // '男女'
galjp('まじ卍', { dictionary: { まじ: 'маＵ”' } }); // 'маＵ”卍'
```

| オプション        | 既定値       | 説明                                                                           |
| ----------------- | ------------ | ------------------------------------------------------------------------------ |
| `layers`          | 全て有効     | `latin` `digit` `hiragana` `katakana` `kanji` `symbol` の有効/無効を切り替える |
| `splitPolicy`     | `'balanced'` | 漢字をどこまで分解するか（下記参照）                                           |
| `variant`         | `true`       | 旧字体へ置き換える（`学` → `學`）                                              |
| `styleStandalone` | `true`       | 分解できない単体の漢字を装飾する（`口` → `ﾛ`）                                 |
| `maxDepth`        | `2`          | 分解時の再帰の上限                                                             |
| `seed`            | なし         | 候補選択のシード。未指定なら決定的な出力になる                                 |
| `preserve`        | URL と絵文字 | `RegExp`、`RegExp[]`、述語関数、または `false`                                 |
| `dictionary`      | `{}`         | 最初に適用されるリテラル置換（正規表現としては解釈しない）                     |

### 分割方針（splitPolicy）

| 値             | 左右分割 | 上下分割                     | 囲み構造 | 例           |
| -------------- | -------- | ---------------------------- | -------- | ------------ |
| `'horizontal'` | ✅       | —                            | —        | `男` → `男`  |
| `'balanced'`   | ✅       | 両方のパーツが読めるときのみ | —        | `男` → `田ｶ` |
| `'aggressive'` | ✅       | ✅                           | ✅       | `凶` → `凵ﾒ` |

### コンバータを再利用する

`createConverter` はオプションの解決とテーブルの構築を一度だけ行います。ループの中では `galjp()` よりこちらを使ってください。詳しくは [API](#api) を参照してください。

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

テキストを渡さずに実行すると標準入力を読むので、パイプと組み合わせられます。`galjp --version` でバージョンを、`galjp --help` で以下のヘルプを表示します（オプションの説明は英語ですが、実際の `--help` の出力そのものです）。

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

主なオプションの対訳は次のとおりです。

| フラグ                        | 説明                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `-v, --version`               | バージョンを表示する                                                                     |
| `-p, --split-policy <policy>` | 漢字をどこまで分解するか（`horizontal` / `balanced` / `aggressive`）                     |
| `-s, --seed <seed>`           | 候補選択のシード（未指定なら決定的）                                                     |
| `-d, --max-depth <n>`         | 分解時の再帰の上限                                                                       |
| `--only <layers>`             | 指定したレイヤーだけを変換する                                                           |
| `-e, --explain`               | 各文字がどの経路で変換されたかを表示する                                                 |
| `--no-variant`                | 旧字体への置換をしない（`学` → `學` をしない）                                           |
| `--no-style-standalone`       | 単体の漢字を装飾しない（`口` → `ﾛ` をしない）                                            |
| `--no-preserve`               | URL や絵文字も変換する                                                                   |
| `--no-<layer>`                | 指定したレイヤーをスキップする（`latin` `digit` `hiragana` `katakana` `kanji` `symbol`） |
| `-h, --help`                  | ヘルプを表示する                                                                         |

## API

### `galjp(input, options?): string`

文字列を変換します。`''` を渡すと `''` を返し、文字列以外を渡すと `TypeError` を投げます。`options` を省略した場合は共有のコンバータを再利用し、`options` を渡した場合は呼び出しごとに新しいコンバータを作るので、ループ内では `createConverter` を使ってください。

```ts
galjp('信頼してる'); // 'ｲ言束頁Ｕτゑ'
galjp('男女', { splitPolicy: 'horizontal' }); // '男女'
```

### `createConverter(options?): Converter`

オプションを解決し、変換テーブルを一度だけ構築します。

```ts
interface Converter {
  /** 文字列を変換する */
  convert(input: string): string;
  /** この設定で1文字が取りうる変換候補をすべて返す */
  candidates(char: string): readonly string[];
  /** 1文字がどの経路で変換されたか、その途中経過を返す */
  explain(char: string): Explanation;
  /** 既定値を適用した後のオプション */
  readonly options: Readonly<ResolvedOptions>;
}

interface Explanation {
  route: 'override' | 'homoglyph' | 'variant' | 'decompose' | 'style' | 'none';
  result: string;
  /** 例: ['湾', '灣', 'ｼ彎'] */
  steps: readonly string[];
}
```

`explain()` は、変換結果に納得できないときに原因を突き止める一番手っ取り早い方法です。

```ts
const conv = createConverter();
conv.explain('湾'); // { route: 'decompose', result: 'ｼ彎', steps: ['湾', '灣', 'ｼ彎'] }
conv.explain('川'); // { route: 'override',  result: '丿丨丨', steps: ['川', '丿丨丨'] }
conv.explain('★'); // { route: 'none',      result: '★',    steps: ['★'] }
conv.candidates('あ'); // ['क॑']
```

### `measureCoverage(chars, options?): CoverageReport`

ある文字集合のうち、どれだけを変換できるかを計測します。CI のゲートにも使っています。

```ts
measureCoverage('日本語漢字');
// { total: 5, converted: 3, ratio: 0.6,
//   byRoute: { decompose: 2, homoglyph: 1, none: 2, override: 0, variant: 0, style: 0 } }
```

### `resolveOptions(options?): ResolvedOptions`

コンバータを作らずに、オプションの検証と既定値の補完だけを行います。不正な値を渡すと、該当するキー名を含む `TypeError` を投げます。

### その他のエクスポート

| エクスポート                                                                                                            | 内容                                       |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `LAYER_IDS`                                                                                                             | 6つのレイヤー名（順序付き）                |
| `DATA_META`                                                                                                             | 各テーブルの件数と、生成データのハッシュ値 |
| `GaljpOptions`, `ResolvedOptions`, `Converter`, `Explanation`, `LayerId`, `SplitPolicy`, `KanjiRoute`, `CoverageReport` | 型定義                                     |

## 漢字変換の仕組み

galjp は、漢字ごとに変換結果を手書きで持つのではなく、**どこで分割するか**と**各部品をどう書くか**を別々に保存し、それを組み合わせます。

```
信 → ⿰(亻, 言)      構造（KanjiVG から生成）
亻 → ｲ               スタイルマップ（手書き・約20件）
─────────────────
        ｲ言
```

1文字の漢字は、次の5つの経路を順番に試します。

1. **override** — 部品データでは表現できない、筆画レベルの分解（`川` → `丿丨丨`）
2. **homoglyph** — 分解ではなく、見た目の似た別の文字への置換（`中` → `㊥`）
3. **variant** — 旧字体に置き換えたうえで、さらに変換を続ける（`湾` → `灣` → …）
4. **decompose** — 部品に分解する（`信` → `ｲ言`）
5. **style** — 分解できない漢字を装飾する（`口` → `ﾛ`）

経路3〜5は同じスタイルマップを共有しているため、1行変更するだけでその部品を使うすべての漢字に反映されます。たとえば `亻` を1行変えるだけで、約190字の漢字に影響します。

設計の詳細は [docs/DESIGN.md](docs/DESIGN.md)（日本語）を参照してください。

## 変換率

`npm run coverage:report` で計測した値です。

| 対象文字集合         | `horizontal` | `balanced`（既定） | `aggressive` |
| -------------------- | ------------ | ------------------ | ------------ |
| 常用漢字（2140字）   | 54.3%        | **73.2%**          | 75.5%        |
| JIS X 0208（6355字） | 58.3%        | **77.7%**          | 80.0%        |

バンドルサイズは 86.1 KB（raw）/ 40.1 KB（gzip）です。漢字テーブルは実際に漢字が使われたときに初めて構築されるため、漢字を含まないテキストではその分のコストがかかりません。

## v4 からの移行

v4 の `generate()` は廃止され、互換用のラッパーもありません。

| v4                                              | v5                                                         |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `const { generate } = require('galjp')`         | `import { galjp } from 'galjp'`                            |
| `{ alphabet, number, hira, kata, other, word }` | `{ layers: { latin, digit, hiragana, katakana, symbol } }` |
| `generate('')` は例外を投げていた               | `galjp('')` は `''` を返す                                 |
| 組み込みの `word.json`                          | `dictionary` オプション（組み込みの語句は無し）            |

漢字の変換結果はゼロから作り直したため、全面的に変わっています。ひらがな・カタカナ・英数字・記号の変換結果は v4 から変更しておらず、パリティテストで担保しています。v4 のバグを2件修正した影響で出力が変わる箇所もあります。`E` は（二重変換されていた）`∋` ではなく `ヨ` になり、`部` は `立ﾛ卩` ではなく `立ﾛ⻏` になります。

## 開発

```bash
npm run data:fetch    # KanjiVG と Unihan を .cache/ にダウンロード（gitignore 対象）
npm run data:all      # data/ と src/generated/ を再生成する
npm run build         # tsup でビルド -> dist/
npm test              # jest でテストを実行
npm run check         # prettier と eslint を実行し、修正を書き込む
```

詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。特に、文字の変換結果を変えたい場合は、たいてい `data/component-style.ts` を1行編集するだけで済みます。

## データソースとライセンス

コード本体は ISC ライセンスです。生成されたテーブルは、次のサードパーティデータから作成しています。

- **[KanjiVG](https://kanjivg.tagaini.net/)** © Ulrich Apel — CC BY-SA 3.0。構造テーブル（`src/generated/structure.ts`）の元データです。
- **[Unicode Character Database](https://www.unicode.org/)** © Unicode, Inc. — Unicode License。異体字テーブルと JIS X 0208 の文字集合の元データです。

詳細は [NOTICE](NOTICE) を参照してください。
