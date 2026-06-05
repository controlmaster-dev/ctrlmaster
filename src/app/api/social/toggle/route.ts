import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { getBooleanSetting, setSetting } from "@/lib/appSettings";
import { ValidationError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const PLATFORM_KEYS: Record<string, string> = {
  youtube: "YOUTUBE_MANUAL_LIVE",
  facebook: "FACEBOOK_MANUAL_LIVE",
};

const toggleSchema = z.object({
  platform: z.enum(["youtube", "facebook"]),
  enabled: z.boolean(),
});

const SOCIAL_ADMIN_ROLES = ["ADMIN", "BOSS", "ENGINEER"];

export const GET = apiHandler({ auth: true }, async () => {
  const [youtube, facebook] = await Promise.all([
    getBooleanSetting("YOUTUBE_MANUAL_LIVE"),
    getBooleanSetting("FACEBOOK_MANUAL_LIVE"),
  ]);
  return { youtube, facebook };
});

export const POST = apiHandler(
  { auth: true, roles: SOCIAL_ADMIN_ROLES, bodySchema: toggleSchema },
  async ({ body }) => {
    const key = PLATFORM_KEYS[body.platform];
    if (!key) throw new ValidationError("Invalid platform");

    await setSetting(key, body.enabled ? "true" : "false");

    return {
      success: true,
      message: `${body.platform} monitor ${body.enabled ? "enabled" : "disabled"}.`,
    };
  }
);
