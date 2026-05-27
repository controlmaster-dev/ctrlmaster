import postgres from 'postgres';

// Connection pool singleton
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Use global singleton in development to survive hot-reloads
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
