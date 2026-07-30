# Contributing

Thanks for your interest in improving galjp!
This guide gets you set up and explains how the project is put together.
If anything here is unclear, opening an issue to ask is welcome.

## Getting set up

You'll need Node.js >= 22: the data scripts are TypeScript run directly by
node, and that is the version CI uses. Then:

```sh
npm install
```

## Scripts

| Command                   | What it does                                                             |
| ------------------------- | ------------------------------------------------------------------------ |
| `npm run build`           | Bundle ESM/CJS + type declarations + the CLI with tsup                   |
| `npm test`                | Run the tests once with jest (`npm run test:watch` to keep them running) |
| `npm run test:coverage`   | Run the tests with a coverage report                                     |
| `npm run typecheck`       | Type-check with `tsc --noEmit`                                           |
| `npm run format`          | Format the code, writing the fixes (Prettier)                            |
| `npm run format:check`    | Check formatting without writing (Prettier)                              |
| `npm run lint`            | Lint the code without writing fixes (ESLint)                             |
| `npm run lint:fix`        | Lint the code, writing the fixes (ESLint)                                |
| `npm run check`           | Format and lint, writing the fixes (Prettier + ESLint)                   |
| `npm run ci`              | The same checks without writing — what CI runs                           |
| `npm run coverage:report` | How many kanji each configuration converts, plus bundle size             |

Before opening a pull request, make sure the full set passes:

```sh
npm run ci && npm run typecheck && npm test && npm run build
```

## How the project is laid out

```
data/         input data — the `.ts` files are hand-written, the `.tsv` generated
src/          the library (Web standards only, no Node APIs)
src/cli/      the CLI (pure and testable); src/cli.ts is the executable
src/generated/  generated tables — never edit by hand
scripts/      data pipeline (Node-only, run with `node scripts/*.ts`)
test/         jest tests
docs/DESIGN.md  the full design, including why each decision was made
```

`docs/DESIGN.md` is the reference for anything non-obvious. Section 15 records
what the implementation actually measured versus what was planned.

## Changing conversion data

This is the most common kind of contribution, and the most valuable.

**Almost everything lives in `data/component-style.ts`.** It maps a component to
its galmoji form, and it is shared by the decomposition, variant and standalone
routes — so one line reaches every kanji using that component. Adding `艹: ['ﾅﾅ']`
affects around 233 characters.

The other hand-written files:

| File                     | For                                                                          |
| ------------------------ | ---------------------------------------------------------------------------- |
| `component-style.ts`     | How a component is written (`亻` → `ｲ`)                                      |
| `component-normalize.ts` | Folding duplicate spellings of one radical (`⻌` → `辶`)                     |
| `renderable.ts`          | Components that display fine but are not JIS X 0208 kanji                    |
| `homoglyph.ts`           | Whole-character look-alikes (`中` → `㊥`)                                    |
| `override.ts`            | Only things the algorithm cannot reach, e.g. stroke splits (`川` → `丿丨丨`) |
| `variant-block.ts`       | Unihan variant pairs that are wrong for Japanese                             |

After editing any of them:

```sh
npm run data:build                      # regenerate src/generated/
npm run build && npm run coverage:report  # check the conversion rate did not drop
npm test
```

Commit the regenerated `src/generated/` — CI checks it matches `data/`.

**Do not add to `override.ts` what the engine can already derive.** There is a
test that fails if you do; the point is to keep hand-written exceptions from
accumulating.

### Regenerating from upstream

`data/structure.tsv` and `data/variant.tsv` come from KanjiVG and Unihan:

```sh
npm run data:fetch   # downloads into .cache/ (gitignored)
npm run data:all     # regenerates data/ and src/generated/
```

## Conventions

- **Formatting is Prettier** and **linting is ESLint** (`eslint.config.mjs` —
  `typescript-eslint`'s recommended rules, with `eslint-config-prettier`
  disabling anything that conflicts with Prettier). `npm run check` handles both.
- **Tests live in `test/`** as `*.test.ts` and run with jest.
- **Comments and docs are in English** and kept brief. Explain _why_, not _what_ —
  especially for conversion data, where the reasoning is the valuable part.
- **Type-only imports use `import type`.**
- **`src/` may not use Node APIs.** The library targets Web standards so it runs
  in browsers and Workers; CI checks it under Deno and Bun. Node-only code
  belongs in `src/cli.ts` or `scripts/`.

## Pull requests

Keep each change focused and add tests for any new behaviour.

## Releasing (maintainers)

Releasing is one manual step. From the Actions tab, run the `release` workflow
(`workflow_dispatch`) and give it a `version` input — either a bump keyword
(`patch` / `minor` / `major` / `prerelease`) or an explicit version like `5.1.0`.
The workflow runs the checks and build, bumps `package.json`, syncs the CLI's
version string, publishes to npm with provenance via **trusted publishing**
(OIDC — no `NPM_TOKEN` needed), pushes the version commit and tag, and creates a
GitHub Release with generated notes.

Trusted publishing must be configured once on npmjs.com: package
**Settings → Publishing access → Trusted publishers → GitHub**, pointing at this
repository's `release.yml` workflow.

## License

By contributing, you agree that your contributions are licensed under the
[ISC License](./LICENSE). Note that the generated data tables carry their own
upstream licences — see [NOTICE](./NOTICE).
