/**
 * Login API route with enhanced security
 */

import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { loginSchema } from '@/lib/validation';
import { verifyPassword, needsRehash, hashPassword } from '@/lib/crypto';
import { withRateLimit } from '@/lib/rateLimitEnhanced';
import { AuthenticationError, ValidationError, ApiError } from '@/lib/errors';
import { createToken } from '@/lib/auth';
import { fetchWithTimeout } from '@/lib/fetch';
import { EMAIL_CONFIG } from '@/config/constants';

/**
 * Get country from IP address
 */
async function getCountryFromIp(ip: string): Promise<string> {
  const privateIps = ['::1', '127.0.0.1'];
  const privateRanges = ['192.168.', '10.', '172.16.'];

  if (privateIps.includes(ip) || privateRanges.some(range => ip.startsWith(range))) {
    return 'Localhost';
  }

  try {
    const geoRes = await fetchWithTimeout(`http://ip-api.com/json/${ip}`, {
      timeout: 5000,
    });
    const geoData = await geoRes.json();

    if (geoData.status === 'success') {
      return geoData.country;
    }
  } catch (error) {
    console.error('GeoIP lookup failed:', error);
  }

  return 'Desconocido';
}

/**
 * Check if login is from a foreign country
 */
function isForeignLogin(country: string): boolean {
  const allowedCountries = ['Costa Rica', 'Localhost', 'Desconocido'];
  return !allowedCountries.includes(country);
}

/**
 * Send security alert email
 */
async function sendSecurityAlert(user: { name: string; email: string }, country: string, ip: string): Promise<void> {
  try {
    await sendEmail({
      to: EMAIL_CONFIG.SECURITY_ALERT_RECIPIENT,
      subject: '🔒 Seguridad: Inicio de Sesión Inusual Detectado',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF0C60;">⚠️ Alerta de Seguridad</h2>
          <p>Se ha detectado un inicio de sesión inusual en la cuenta de <strong>${user.name}</strong>.</p>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Usuario:</strong> ${user.email}</p>
            <p><strong>País:</strong> ${country}</p>
            <p><strong>IP:</strong> ${ip}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CR')}</p>
          </div>
          <p>Si no reconoces esta actividad, por favor cambia tu contraseña inmediatamente.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send security alert email:', error);
  }
}

/**
 * POST /api/auth/login
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit('AUTH')(req);
    if (rateLimitResult.isRateLimited) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos. Por favor espera unos minutos.',
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
          },
        }
      );
    }

    const body = await req.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError('Datos de entrada inválidos', validationResult.error.issues);
    }

    const { email, password } = validationResult.data;

    const [user] = await sql`
      SELECT * FROM "User"
      WHERE "email" = ${email} OR "username" = ${email}
      LIMIT 1
    `;

    if (!user) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Lazily upgrade legacy (plaintext / SHA-256) hashes to salted scrypt.
    if (needsRehash(user.password)) {
      try {
        const upgraded = await hashPassword(password);
        await sql`UPDATE "User" SET "password" = ${upgraded} WHERE "id" = ${user.id}`;
      } catch (rehashError) {
        console.error('Password rehash failed:', rehashError);
      }
    }

    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'Unknown';

    const country = await getCountryFromIp(ip);

    await sql`
      UPDATE "User"
      SET "lastLogin" = NOW(),
          "lastLoginIP" = ${ip},
          "lastLoginCountry" = ${country}
      WHERE "id" = ${user.id}
    `;

    if (isForeignLogin(country)) {
      await sendSecurityAlert(
        { name: user.name, email: user.email },
        country,
        ip
      );
    }

    const token = await createToken(user.id);

    const response = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      avatar: user.image,
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    response.cookies.set('user-id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;

  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: 400 }
      );
    }

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.statusCode }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}
