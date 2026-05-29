


import sql from '@/lib/db';


export async function getSetting(
  key: string,
  fallback = ''
): Promise<string> {
  try {
    const [row] = await sql`
      SELECT "value" FROM "AppSetting" WHERE "key" = ${key} LIMIT 1
    `;
    if (row?.value !== undefined && row?.value !== null) {
      return String(row.value);
    }
  } catch (error) {
    console.error(`[appSettings] Failed to read "${key}":`, error);
  }

  const envValue = process.env[key];
  if (envValue !== undefined) return envValue;

  return fallback;
}


export async function getBooleanSetting(key: string): Promise<boolean> {
  const value = await getSetting(key, 'false');
  return value === 'true';
}


export async function setSetting(key: string, value: string): Promise<void> {
  await sql`
    INSERT INTO "AppSetting" ("key", "value", "updatedAt")
    VALUES (${key}, ${value}, NOW())
    ON CONFLICT ("key")
    DO UPDATE SET "value" = ${value}, "updatedAt" = NOW()
  `;
}
