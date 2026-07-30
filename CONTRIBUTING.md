# Contributing

galjp の改善に興味を持っていただきありがとうございます。このガイドでは開発環境の準備と、プロジェクトの構成を説明します。不明な点があれば、issue で質問していただいて構いません。

## セットアップ

Node.js >= 22 が必要です（データ生成スクリプトが TypeScript を node で直接実行するため、その版が CI で使われています）。

```sh
npm install
```

## スクリプト一覧

| コマンド                  | 内容                                                             |
| ------------------------- | ---------------------------------------------------------------- |
| `npm run build`           | tsup で ESM/CJS + 型定義 + CLI をビルドする                      |
| `npm test`                | jest でテストを1回実行する（`npm run test:watch` で監視実行）    |
| `npm run test:coverage`   | テストをカバレッジ計測付きで実行する                             |
| `npm run typecheck`       | `tsc --noEmit` で型チェックする                                  |
| `npm run format`          | Prettier でフォーマットし、修正を書き込む                        |
| `npm run format:check`    | フォーマットを確認するだけで書き込まない                         |
| `npm run lint`            | ESLint で確認するだけで修正を書き込まない                        |
| `npm run lint:fix`        | ESLint で確認し、修正を書き込む                                  |
| `npm run check`           | Prettier と ESLint の両方を実行し、修正を書き込む                |
| `npm run ci`              | 書き込みを行わない同等のチェック（CI が実行するもの）            |
| `npm run coverage:report` | 各設定でどれだけの漢字を変換できるかと、バンドルサイズを計測する |

プルリクエストを送る前に、次を通してください。

```sh
npm run ci && npm run typecheck && npm test && npm run build
```

## プロジェクトの構成

```
data/           入力データ。`.ts` ファイルは手書き、`.tsv` は自動生成
src/            ライブラリ本体（Web 標準のみ、Node API は使わない）
src/cli/        CLI（純粋関数でテスト可能）。src/cli.ts が実行エントリ
src/generated/  自動生成されたテーブル。手で編集しない
scripts/        データ生成パイプライン（Node 専用。`node scripts/*.ts` で実行）
test/           jest によるテスト
docs/DESIGN.md  詳細設計書。各判断の理由も記載
```

自明でない点はすべて `docs/DESIGN.md` が拠り所です。特に §15 には、実装時に実測した値と当初の計画との差分を記録しています。

## 変換データを変更する

もっとも多く、もっとも価値のある種類の貢献です。

**ほとんどの変更は `data/component-style.ts` で完結します。** このファイルは部品とギャル文字表記の対応表で、分解・異体字・単体装飾の3つの経路から共有されているため、1行変更するだけでその部品を使うすべての漢字に反映されます。たとえば `艹: ['ﾅﾅ']` を追加すると、約233字に影響します。

その他の手書きファイルは次のとおりです。

| ファイル                 | 役割                                                                      |
| ------------------------ | ------------------------------------------------------------------------- |
| `component-style.ts`     | 部品をどう書くか（`亻` → `ｲ`）                                            |
| `component-normalize.ts` | 同じ部首の異なる表記をひとつにまとめる（`⻌` → `辶`）                     |
| `renderable.ts`          | 表示はできるが JIS X 0208 の漢字ではない部品                              |
| `homoglyph.ts`           | 分解ではなく、見た目の似た別の文字への置換（`中` → `㊥`）                 |
| `override.ts`            | アルゴリズムでは導けないもの。たとえば筆画レベルの分解（`川` → `丿丨丨`） |
| `variant-block.ts`       | 日本語としては誤りである Unihan の異体字ペア                              |

これらを編集したら、次を実行してください。

```sh
npm run data:build                        # src/generated/ を再生成する
npm run build && npm run coverage:report  # 変換率が下がっていないか確認する
npm test
```

再生成した `src/generated/` はコミットしてください。CI が `data/` との整合性を確認します。

**アルゴリズムがすでに導けるものを `override.ts` に追加しないでください。** そうした場合に失敗するテストがあります。手書きの例外が際限なく増えないようにするためです。

### 元データから再生成する

`data/structure.tsv` と `data/variant.tsv` は、それぞれ KanjiVG と Unihan から生成しています。

```sh
npm run data:fetch   # .cache/ にダウンロードする（gitignore 対象）
npm run data:all     # data/ と src/generated/ を再生成する
```

## 規約

- **フォーマットは Prettier、リントは ESLint** です（`eslint.config.mjs` は `typescript-eslint` の推奨ルールに、Prettier と衝突するルールを無効化する `eslint-config-prettier` を重ねています）。`npm run check` で両方まとめて実行できます。
- **テストは `test/` 以下に** `*.test.ts` として置き、jest で実行します。
- **ソースコード中のコメントは英語**で、簡潔にします。「何をしているか」ではなく「なぜそうしているか」を書いてください。特に変換データについては、その理由こそが価値のある情報です。README や CONTRIBUTING などの利用者向けドキュメントは日本語です。
- **型のみの import には `import type` を使います。**
- **`src/` 以下では Node API を使えません。** ライブラリは Web 標準のみを対象としており、ブラウザや Workers でも動作する必要があります。CI は Deno と Bun 上でも動作を確認します。Node 専用のコードは `src/cli.ts` や `scripts/` に置いてください。

## プルリクエスト

変更は焦点を絞り、新しい挙動には対応するテストを追加してください。

## リリース（メンテナー向け）

リリースは手動の1ステップです。Actions タブから `release` ワークフロー（`workflow_dispatch`）を実行し、`version` にバンプ用のキーワード（`patch` / `minor` / `major` / `prerelease`）か `5.1.0` のような具体的なバージョンを指定してください。ワークフローは各種チェックとビルドを実行し、`package.json` のバージョンを更新し、CLI が表示するバージョン文字列も同期させたうえで、**trusted publishing**（OIDC。`NPM_TOKEN` は不要）で npm に公開し、バージョンのコミットとタグを push し、生成されたリリースノート付きで GitHub Release を作成します。

trusted publishing は npmjs.com 側で一度だけ設定が必要です。パッケージの **Settings → Publishing access → Trusted publishers → GitHub** から、このリポジトリの `release.yml` ワークフローを指定してください。

## ライセンス

このプロジェクトに貢献することで、あなたの貢献が [ISC License](./LICENSE) の下でライセンスされることに同意したものとします。なお、生成されたデータテーブルは元データ側のライセンスを引き継いでいます。詳しくは [NOTICE](./NOTICE) を参照してください。
