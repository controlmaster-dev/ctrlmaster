import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';

function collectTestFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const testFiles = collectTestFiles('tests').sort();

if (testFiles.length === 0) {
  console.error('[test] No se encontraron archivos *.test.ts');
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--import', './tests/setup.ts', '--test', ...testFiles],
  { stdio: 'inherit' }
);

process.exit(result.status ?? 1);
