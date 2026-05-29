


export function resolveDatabaseUrl(raw?: string): string {
  if (!raw?.trim()) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  let url = raw.trim();
  if (url.startsWith('DATABASE_URL=')) {
    url = url.slice('DATABASE_URL='.length).trim();
  }

  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error(
      'DATABASE_URL must be a PostgreSQL connection string (postgresql://...), without the "DATABASE_URL=" prefix'
    );
  }

  return url;
}
