import sql from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { verifyPassword, needsRehash, hashPassword } from "@/lib/crypto";
import { createToken } from "@/lib/auth";
import { fetchWithTimeout } from "@/lib/fetch";
import { EMAIL_CONFIG } from "@/config/constants";
import { AuthenticationError, ConflictError } from "@/lib/errors";
import type { LoginInput, PublicRegisterInput } from "@/lib/validation";
import {
  markRegistrationCodeUsed,
} from "@/server/repositories/registrationCodeRepository";
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
    const geoRes = await fetchWithTimeout(`http://ip-api.com/json/${ip}`, { timeout: 5000 });
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
      subject: "🔒 Seguridad: Inicio de Sesión Inusual Detectado",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF0C60;">⚠️ Alerta de Seguridad</h2>
          <p>Se ha detectado un inicio de sesión inusual en la cuenta de <strong>${user.name}</strong>.</p>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Usuario:</strong> ${user.email}</p>
            <p><strong>País:</strong> ${country}</p>
            <p><strong>IP:</strong> ${ip}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString("es-CR")}</p>
          </div>
          <p>Si no reconoces esta actividad, por favor cambia tu contraseña inmediatamente.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send security alert email:", error);
  }
}

export async function loginUser(
  input: LoginInput,
  clientIp: string
): Promise<{ user: LoginSessionUser; token: string }> {
  const { email, password } = input;

  const [user] = await sql`
    SELECT * FROM "User"
    WHERE "email" = ${email} OR "username" = ${email}
    LIMIT 1
  `;

  if (!user) throw new AuthenticationError("Credenciales inválidas");

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) throw new AuthenticationError("Credenciales inválidas");

  if (needsRehash(user.password)) {
    try {
      const upgraded = await hashPassword(password);
      await sql`UPDATE "User" SET "password" = ${upgraded} WHERE "id" = ${user.id}`;
    } catch (rehashError) {
      console.error("Password rehash failed:", rehashError);
    }
  }

  const country = await getCountryFromIp(clientIp);

  await sql`
    UPDATE "User"
    SET "lastLogin" = NOW(),
        "lastLoginIP" = ${clientIp},
        "lastLoginCountry" = ${country}
    WHERE "id" = ${user.id}
  `;

  if (isForeignLogin(country)) {
    await sendSecurityAlert({ name: user.name, email: user.email }, country, clientIp);
  }

  const token = await createToken(user.id);

  return {
    user: {
      id: user.id,
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

  const [existingUser] = await sql`
    SELECT * FROM "User"
    WHERE "email" = ${email} OR "username" = ${email}
    LIMIT 1
  `;

  if (existingUser) {
    throw new ConflictError("Ya existe un usuario con ese correo");
  }

  const username = email.split("@")[0].toLowerCase();
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(input.name)}&background=random&color=fff&bold=true&size=128`;
  const hashedPassword = await hashPassword(input.password);

  const [newUser] = await sql`
    INSERT INTO "User" ("name", "email", "username", "password", "role", "image")
    VALUES (${input.name.trim()}, ${email}, ${username}, ${hashedPassword}, 'OPERATOR', ${avatarUrl})
    RETURNING *
  `;

  await markRegistrationCodeUsed(registrationCode.id, newUser.id);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    username: newUser.username,
    role: newUser.role,
    avatar: newUser.image,
  };
}
