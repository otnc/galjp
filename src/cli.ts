#!/usr/bin/env node
/**
 * Executable entry point.
 *
 * The only file in the package that touches Node APIs — everything under
 * src/cli/ is pure so it can be tested directly, and the library itself stays
 * on Web standards so it runs in browsers and Workers.
 */
import { run, type CliIo } from './cli/run';

const io: CliIo = {
  stdout: (text) => void process.stdout.write(text),
  stderr: (text) => void process.stderr.write(text),
  isInteractive: process.stdin.isTTY === true,
  readStdin: async () => {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString('utf8');
  },
};

run(process.argv.slice(2), io)
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    process.stderr.write(`galjp: ${String(error)}\n`);
    process.exitCode = 1;
  });
