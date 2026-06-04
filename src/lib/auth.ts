import { generateToken } from "@/lib/crypto";
import { SESSION_MAX_AGE_MS } from "@/lib/authConfig";
import { isTransientDbError } from "@/lib/dbErrors";
import { withDbRetry } from "@/lib/dbRetry";
import { connectMongo } from "@/lib/mongo";
import { SessionTokenModel, UserModel } from "@/models";

const TOKEN_EXPIRY = SESSION_MAX_AGE_MS;

export async function createToken(userId: string): Promise<string> {
  const token = generateToken(64);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);

  await connectMongo();
  await SessionTokenModel.create({
    _id: token,
    userId,
    expiresAt,
    userAgent: "",
    ipAddress: "",
  });

  return token;
}

export async function validateToken(userId: string, token: string): Promise<boolean> {
  try {
    const sessionToken = await withDbRetry(async () => {
      await connectMongo();
      return SessionTokenModel.findById(token).lean();
    });

    if (!sessionToken) return false;
    if (sessionToken.userId !== userId) return false;

    if (new Date(sessionToken.expiresAt) < new Date()) {
      await SessionTokenModel.findByIdAndDelete(token);
      return false;
    }

    return true;
  } catch (error) {
    if (isTransientDbError(error)) throw error;
    return false;
  }
}

export async function touchSession(token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY);
  await connectMongo();
  await SessionTokenModel.findByIdAndUpdate(token, { expiresAt });
}

export async function revokeToken(token: string): Promise<void> {
  try {
    await connectMongo();
    await SessionTokenModel.findByIdAndDelete(token);
  } catch {
    /* ignore */
  }
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await connectMongo();
  await SessionTokenModel.deleteMany({ userId });
}

export async function cleanupExpiredTokens(): Promise<number> {
  await connectMongo();
  const result = await SessionTokenModel.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount ?? 0;
}

export async function getUserFromToken(token: string | undefined) {
  if (!token) return null;

  try {
    const row = await withDbRetry(async () => {
      await connectMongo();
      const session = await SessionTokenModel.findById(token).lean();
      if (!session) return null;
      const user = await UserModel.findById(session.userId).lean();
      if (!user) return null;
      return { user, expiresAt: session.expiresAt };
    });

    if (!row) return null;

    if (new Date(row.expiresAt) < new Date()) {
      await SessionTokenModel.findByIdAndDelete(token);
      return null;
    }

    const { user } = row;
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      image: user.image,
      phone: user.phone,
      lastLogin: user.lastLogin,
      lastLoginIP: user.lastLoginIP,
      lastLoginCountry: user.lastLoginCountry,
      currentPath: user.currentPath,
      lastActive: user.lastActive,
      birthday: user.birthday,
      schedule: user.schedule,
      tempSchedule: user.tempSchedule,
      createdAt: user.createdAt,
    };
  } catch (error) {
    if (isTransientDbError(error)) throw error;
    return null;
  }
}
