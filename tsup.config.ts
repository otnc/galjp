import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'es2022',
  sourcemap: true,
  esbuildOptions(options) {
    // esbuild defaults to an ASCII charset, which rewrites every CJK character
    // in the data tables as a 6-byte \uXXXX escape and triples the bundle.
    options.charset = 'utf8';
  },
  treeshake: true,
  splitting: false,
  minify: false,
});
