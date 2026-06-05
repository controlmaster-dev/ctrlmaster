import { generateToken } from "@/lib/crypto";
import { connectMongo } from "@/lib/mongo";
import { UserModel } from "@/models";

export { verifyCalendarFeedToken } from "@/lib/calendarFeedToken";

export async function getOrCreateCalendarFeedToken(userId: string): Promise<string | null> {
  await connectMongo();
  const user = await UserModel.findById(userId).select("calendarFeedToken").lean();
  if (!user) return null;

  if (user.calendarFeedToken) {
    return user.calendarFeedToken;
  }

  const token = generateToken(32);
  await UserModel.findByIdAndUpdate(userId, { calendarFeedToken: token });
  return token;
}
