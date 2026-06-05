import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// GitHub ubuntu-latest ≈ 7 GB RAM total; dejar margen para el SO y npm.
const heap = process.env.TYPECHECK_HEAP_MB ?? '6144';
const tscBin = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'node_modules',
  'typescript',
  'bin',
  'tsc'
);

const projects = [
  'tsconfig.typecheck.app.json',
  'tsconfig.typecheck.tests.json',
];

for (const project of projects) {
  console.log(`\n[typecheck] ${project} (heap ${heap} MB)`);
  const result = spawnSync(
    process.execPath,
    [`--max-old-space-size=${heap}`, tscBin, '--noEmit', '-p', project],
    { stdio: 'inherit' }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\n[typecheck] OK');
