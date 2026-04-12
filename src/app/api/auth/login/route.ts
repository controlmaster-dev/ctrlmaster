/**
 * Login API route with enhanced security
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { loginSchema } from '@/lib/validation';
import { verifyPassword } from '@/lib/crypto';
import { withRateLimit } from '@/lib/rateLimitEnhanced';
import { AuthenticationError, ValidationError, ApiError } from '@/lib/errors';
import { createToken } from '@/lib/auth';
import { fetchWithTimeout } from '@/lib/fetch';
import { EMAIL_CONFIG } from '@/config/constants';

/**
 * Get country from IP address
 */
async function getCountryFromIp(ip: string): Promise<string> {
  // Skip localhost and private IPs
  const privateIps = ['::1', '127.0.0.1'];
  const privateRanges = ['192.168.', '10.', '172.16.'];

  if (privateIps.includes(ip) || privateRanges.some(range => ip.startsWith(range))) {
    return 'Localhost';
  }

  try {
    const geoRes = await fetchWithTimeout(`http://ip-api.com/json/${ip}`, {
      timeout: 5000, // 5 second timeout
    });
    const geoData = await geoRes.json();

    if (geoData.status === 'success') {
      return geoData.country;
    }
  } catch (error) {
    // Silently fail - don't expose errors to client
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
    // Log error but don't fail the login process
    console.error('Failed to send security alert email:', error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return session data
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError('Datos de entrada inválidos', validationResult.error.issues);
    }

    const { email, password } = validationResult.data;

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email },
        ],
      },
    });

    if (!user) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      throw new AuthenticationError('Credenciales inválidas');
    }

    // Get IP address
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'Unknown';

    // Get country from IP
    const country = await getCountryFromIp(ip);

    // Update last login information
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        lastLoginIP: ip,
        lastLoginCountry: country,
      },
    });

    // Send security alert for foreign login
    if (isForeignLogin(country)) {
      await sendSecurityAlert(
        { name: user.name, email: user.email },
        country,
        ip
      );
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = user;

    // Create session token
    const token = await createToken(userData.id);

    // Create response with user data
    const response = NextResponse.json({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      username: userData.username,
      role: userData.role,
      avatar: userData.image,
    });

    // Set secure HTTP-only cookie with session token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    // Set user ID cookie (non-sensitive, needed for middleware)
    response.cookies.set('user-id', userData.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;

  } catch (error) {
    // Handle known error types
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

    // Handle unknown errors
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    );
  }
}
