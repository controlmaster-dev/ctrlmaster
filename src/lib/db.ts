import postgres from 'postgres';
import { resolveDatabaseUrl } from '@/lib/databaseUrl';

const dbUrl = resolveDatabaseUrl(process.env.DATABASE_URL);

// Connection pool singleton
declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

// On serverless (Vercel) each function instance keeps its own pool, so a high
// `max` multiplied by many concurrent lambdas can exhaust Neon's connections
// even behind the pooler. Keep the per-instance pool small in production.
const poolMax = process.env.DB_POOL_MAX
  ? Number(process.env.DB_POOL_MAX)
  : process.env.NODE_ENV === 'production'
    ? 5
    : 10;

const sql: ReturnType<typeof postgres> =
  globalThis.__sql ??
  postgres(dbUrl, {
    max: poolMax,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: 'require',
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__sql = sql;
}

export { sql };
export default sql;
