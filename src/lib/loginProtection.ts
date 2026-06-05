import { SECURITY_CONFIG } from '@/config/constants';
import { checkRateLimit, getClientIp } from '@/lib/rateLimitEnhanced';
import { RateLimitError } from '@/lib/errors';

function normalizeLoginKey(value: string): string {
  return value.trim().toLowerCase();
}

export async function assertLoginAllowed(
  request: Request,
  emailOrUsername: string
): Promise<void> {
  const ip = getClientIp(request);
  const identity = normalizeLoginKey(emailOrUsername);

  const [ipLimit, accountLimit] = await Promise.all([
    checkRateLimit(
      `AUTH:ip:${ip}`,
      SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
      SECURITY_CONFIG.LOCKOUT_DURATION
    ),
    checkRateLimit(
      `AUTH:account:${identity}`,
      SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS,
      SECURITY_CONFIG.LOCKOUT_DURATION
    ),
  ]);

  if (!ipLimit.success || !accountLimit.success) {
    throw new RateLimitError(
      'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.'
    );
  }
}

export async function recordSuccessfulLogin(
  request: Request,
  emailOrUsername: string
): Promise<void> {
  const ip = getClientIp(request);
  const identity = normalizeLoginKey(emailOrUsername);
  const { connectMongo } = await import('@/lib/mongo');
  const { RateLimitModel } = await import('@/models');

  try {
    await connectMongo();
    await RateLimitModel.deleteMany({
      _id: { $in: [`AUTH:ip:${ip}`, `AUTH:account:${identity}`] },
    });
  } catch {
    // No bloquear login exitoso si falla la limpieza del contador.
  }
}
