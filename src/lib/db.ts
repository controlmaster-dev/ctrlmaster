import postgres from 'postgres';
import { resolveDatabaseUrl } from '@/lib/databaseUrl';

const dbUrl = resolveDatabaseUrl(process.env.DATABASE_URL);

const globalForPostgres = globalThis as typeof globalThis & {
  __sql?: ReturnType<typeof postgres>;
};

const poolMax = process.env.DB_POOL_MAX
  ? Number(process.env.DB_POOL_MAX)
  : process.env.NODE_ENV === 'production'
    ? 5
    : 10;

function createSql() {
  return postgres(dbUrl, {
    max: poolMax,
    idle_timeout: 30,
    connect_timeout: 20,
    ssl: 'require',
    /** Evita planes preparados rotos tras ALTER TABLE (p. ej. columna code). */
    prepare: false,
  });
}

const existing = globalForPostgres.__sql;
const sql: ReturnType<typeof postgres> = existing ?? createSql();

if (process.env.NODE_ENV !== 'production') {
  globalForPostgres.__sql = sql;
}

export { sql };
export default sql;
