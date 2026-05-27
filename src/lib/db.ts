import postgres from 'postgres';
import { resolveDatabaseUrl } from '@/lib/databaseUrl';

const dbUrl = resolveDatabaseUrl(process.env.DATABASE_URL);

// Connection pool singleton
declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

const sql: ReturnType<typeof postgres> =
  globalThis.__sql ??
  postgres(dbUrl, {
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: 'require',
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__sql = sql;
}

export { sql };
export default sql;
