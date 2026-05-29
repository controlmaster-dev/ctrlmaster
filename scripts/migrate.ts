


import postgres from 'postgres';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';
import { resolveDatabaseUrl } from '../src/lib/databaseUrl';

let dbUrl: string;
try {
  dbUrl = resolveDatabaseUrl(process.env.DATABASE_URL);
} catch (e) {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
}

async function runMigrations() {
  const sql = postgres(dbUrl!, { ssl: 'require', max: 1 });


  await sql`
    CREATE TABLE IF NOT EXISTS "_migrations" (
      "name" TEXT PRIMARY KEY,
      "executedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const migrationsDir = join(import.meta.dirname || __dirname, '..', 'migrations');


  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    await sql.end();
    return;
  }

  for (const file of files) {

    const [existing] = await sql`
      SELECT "name" FROM "_migrations" WHERE "name" = ${file}
    `;

    if (existing) {
      console.log(`⏭️  Skipping ${file} (already executed)`);
      continue;
    }

    console.log(`▶️  Running migration: ${file}`);
    const content = readFileSync(join(migrationsDir, file), 'utf-8');

    try {
      await sql.unsafe(content);
      await sql`
        INSERT INTO "_migrations" ("name") VALUES (${file})
      `;
      console.log(`✅  Completed: ${file}`);
    } catch (error) {
      console.error(`❌  Failed: ${file}`);
      console.error(error);
      await sql.end();
      process.exit(1);
    }
  }

  console.log('🎉 All migrations completed successfully.');
  await sql.end();
}

runMigrations().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
