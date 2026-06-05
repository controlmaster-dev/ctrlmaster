export const CACHE_HEADERS = {
  noStore: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  privateShort: (maxAgeSec: number) => ({
    'Cache-Control': `private, max-age=${maxAgeSec}`,
  }),
  publicShort: (maxAgeSec: number) => ({
    'Cache-Control': `public, max-age=${maxAgeSec}`,
  }),
} as const;
