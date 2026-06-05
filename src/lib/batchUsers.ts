import { UserModel } from "@/models";

export type UserBrief = { id: string; name: string; image: string | null };

export async function loadUserBriefMap(userIds: string[]): Promise<Map<string, UserBrief>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map = new Map<string, UserBrief>();
  if (unique.length === 0) return map;

  const users = await UserModel.find({ _id: { $in: unique } }).select("name image").lean();
  for (const u of users) {
    map.set(String(u._id), { id: String(u._id), name: u.name, image: u.image ?? null });
  }
  return map;
}

export function userBriefFromMap(map: Map<string, UserBrief>, userId: string): UserBrief {
  return map.get(userId) ?? { id: userId, name: "Usuario", image: null };
}
