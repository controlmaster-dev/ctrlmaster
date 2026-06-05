import { connectMongo } from "@/lib/mongo";
import { UserModel } from "@/models";
import { sendEmail } from "@/lib/email";
import { verifyPassword, needsRehash, hashPassword } from "@/lib/crypto";
import { createToken } from "@/lib/auth";
import { fetchWithTimeout } from "@/lib/fetch";
import { EMAIL_CONFIG } from "@/config/constants";
import { renderSecurityAlertEmail } from "@/lib/emailTemplates";
import { AuthenticationError, ConflictError } from "@/lib/errors";
import type { LoginInput, PublicRegisterInput } from "@/lib/validation";
import { markRegistrationCodeUsed } from "@/server/repositories/registrationCodeRepository";
import { validateRegistrationCodeForSignup } from "@/server/services/registrationCodeService";

export type LoginSessionUser = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  avatar: string | null;
};

async function getCountryFromIp(ip: string): Promise<string> {
  const privateIps = ["::1", "127.0.0.1"];
  const privateRanges = ["192.168.", "10.", "172.16."];

  if (privateIps.includes(ip) || privateRanges.some((range) => ip.startsWith(range))) {
    return "Localhost";
  }

  try {
    const geoRes = await fetchWithTimeout(`https://ip-api.com/json/${ip}`, { timeout: 5000 });
    const geoData = await geoRes.json();
    if (geoData.status === "success") return geoData.country;
  } catch (error) {
    console.error("GeoIP lookup failed:", error);
  }

  return "Desconocido";
}

function isForeignLogin(country: string): boolean {
  const allowedCountries = ["Costa Rica", "Localhost", "Desconocido"];
  return !allowedCountries.includes(country);
}

async function sendSecurityAlert(
  user: { name: string; email: string },
  country: string,
  ip: string
): Promise<void> {
  try {
    await sendEmail({
      to: EMAIL_CONFIG.SECURITY_ALERT_RECIPIENT,
      subject: "Alerta de seguridad — inicio de sesión inusual",
      html: renderSecurityAlertEmail({
        userName: user.name,
        userEmail: user.email,
        country,
        ip,
        timestamp: new Date().toLocaleString("es-CR"),
      }),
    });
  } catch (error) {
    console.error("Failed to send security alert email:", error);
  }
}

export async function loginUser(
  input: LoginInput,
  clientIp: string,
  request?: Request
): Promise<{ user: LoginSessionUser; token: string }> {
  const { email, password } = input;

  await connectMongo();
  const user = await UserModel.findOne({
    $or: [{ email }, { username: email }],
  }).lean();

  if (!user) throw new AuthenticationError("Credenciales inválidas");

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) throw new AuthenticationError("Credenciales inválidas");

  if (needsRehash(user.password)) {
    try {
      const upgraded = await hashPassword(password);
      await UserModel.findByIdAndUpdate(user._id, { password: upgraded });
    } catch (rehashError) {
      console.error("Password rehash failed:", rehashError);
    }
  }

  const country = await getCountryFromIp(clientIp);

  await UserModel.findByIdAndUpdate(user._id, {
    lastLogin: new Date(),
    lastLoginIP: clientIp,
    lastLoginCountry: country,
  });

  if (isForeignLogin(country)) {
    await sendSecurityAlert({ name: user.name, email: user.email }, country, clientIp);
  }

  const token = await createToken(String(user._id));

  if (request) {
    const { recordSuccessfulLogin } = await import('@/lib/loginProtection');
    await recordSuccessfulLogin(request, email);
  }

  return {
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.image,
    },
    token,
  };
}

export type RegisteredUserPayload = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  avatar: string | null;
};

export async function registerUser(input: PublicRegisterInput): Promise<RegisteredUserPayload> {
  const { registrationCode } = await validateRegistrationCodeForSignup(input.securityCode);

  if (!registrationCode) {
    throw new AuthenticationError("Código de seguridad inválido");
  }

  if (registrationCode.usedById) {
    throw new AuthenticationError("Este código ya fue utilizado");
  }

  if (new Date(registrationCode.expiresAt) < new Date()) {
    throw new AuthenticationError("Este código ha expirado. Solicite uno nuevo al administrador");
  }

  const email = input.email.toLowerCase().trim();

  await connectMongo();
  const existingUser = await UserModel.findOne({
    $or: [{ email }, { username: email }],
  }).lean();

  if (existingUser) {
    throw new ConflictError("Ya existe un usuario con ese correo");
  }

  const username = email.split("@")[0].toLowerCase();
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(input.name)}&background=random&color=fff&bold=true&size=128`;
  const hashedPassword = await hashPassword(input.password);

  const { randomUUID } = await import("crypto");
  const newUser = await UserModel.create({
    _id: randomUUID(),
    name: input.name.trim(),
    email,
    username,
    password: hashedPassword,
    role: "OPERATOR",
    image: avatarUrl,
  });

  await markRegistrationCodeUsed(registrationCode.id, String(newUser._id));

  return {
    id: String(newUser._id),
    name: newUser.name,
    email: newUser.email,
    username: newUser.username ?? username,
    role: newUser.role,
    avatar: newUser.image,
  };
}
