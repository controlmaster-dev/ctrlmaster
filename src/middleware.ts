


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateSession } from '@/lib/sessionMiddleware';


const PUBLIC_ROUTES = [
  '/login',
  '/operadores',
  '/operadores/monitoreo',
];


const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/auth/logout',
  '/api/users/public',
  '/api/operadores/bootstrap',
  '/api/special-events',
  '/api/calendar',
  '/api/health',
];


const SECURITY_HEADERS = {

  'X-Frame-Options': 'DENY',

  'X-Content-Type-Options': 'nosniff',

  'X-XSS-Protection': '1; mode=block',

  'Referrer-Policy': 'strict-origin-when-cross-origin',

  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
} as const;


function pathMatches(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (path === pattern) return true;
    if (path.startsWith(pattern + '/')) return true;
    return false;
  });
}


function isPublicApiRoute(pathname: string): boolean {
  return pathMatches(pathname, PUBLIC_API_ROUTES);
}


function isPublicRoute(pathname: string): boolean {
  return pathMatches(pathname, PUBLIC_ROUTES);
}


function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/');
}


function hasCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}


function jsonApiResponse(
  body: { error: string },
  status: number
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: SECURITY_HEADERS,
  });
}

function unauthorizedApiResponse(): NextResponse {
  return jsonApiResponse(
    { error: 'No autorizado. Inicia sesión nuevamente.' },
    401
  );
}

function unavailableApiResponse(): NextResponse {
  return jsonApiResponse(
    { error: 'No se pudo validar la sesión. Reintenta en unos segundos.' },
    503
  );
}

function unavailablePageResponse(): NextResponse {
  const response = new NextResponse(
    '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Servicio no disponible</title></head><body><p>No se pudo validar la sesión. Reintenta en unos segundos.</p></body></html>',
    {
      status: 503,
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': 'text/html; charset=utf-8',
      },
    }
  );
  return response;
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;


  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_static') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/uploads')
  ) {
    return NextResponse.next();
  }


  const isPublic =
    isPublicRoute(pathname) ||
    isPublicApiRoute(pathname) ||
    (pathname.startsWith('/api/cron/') && hasCronSecret(request));


  if (!isPublic) {
    const session = await validateSession(request);

    if (!session.ok) {
      if (session.reason === 'unavailable') {
        return isApiRoute(pathname)
          ? unavailableApiResponse()
          : unavailablePageResponse();
      }

      if (isApiRoute(pathname)) {
        return unauthorizedApiResponse();
      }

      const loginUrl = new URL('/login', request.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }


  const response = NextResponse.next();

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });


  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}


export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|manifest|uploads).*)',
  ],
  runtime: 'nodejs',
};
