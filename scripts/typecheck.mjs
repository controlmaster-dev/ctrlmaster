import { spawnSync } from 'node:child_process';

const heap = process.env.TYPECHECK_HEAP_MB ?? '8192';
const nodeOptions = `--max-old-space-size=${heap}`;

const projects = [
  'tsconfig.typecheck.app.json',
  'tsconfig.typecheck.tests.json',
];

for (const project of projects) {
  console.log(`\n[typecheck] ${project}`);
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['tsc', '--noEmit', '-p', project],
    {
      env: {
        ...process.env,
        NODE_OPTIONS: nodeOptions,
      },
      stdio: 'inherit',
    }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\n[typecheck] OK');
