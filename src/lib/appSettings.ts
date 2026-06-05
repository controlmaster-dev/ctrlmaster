import { connectMongo } from "@/lib/mongo";
import { AppSettingModel } from "@/models";

export async function getSetting(key: string, fallback = ""): Promise<string> {
  try {
    await connectMongo();
    const row = await AppSettingModel.findById(key).lean();
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
  const value = await getSetting(key, "false");
  return value === "true";
}

export async function setSetting(key: string, value: string): Promise<void> {
  await connectMongo();
  await AppSettingModel.findByIdAndUpdate(
    key,
    { value, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}
