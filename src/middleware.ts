


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


const PUBLIC_ROUTES = [
  '/login',
  '/operadores',
  '/operadores/monitoreo',
];


const PUBLIC_API_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/users',
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


function hasSessionCookie(request: NextRequest): boolean {
  return !!request.cookies.get('auth-token')?.value;
}

function hasCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
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


  if (isApiRoute(pathname) && !isPublic) {
    const hasSession = hasSessionCookie(request);

    if (!hasSession) {
      return NextResponse.json(
        { error: 'No autorizado. Inicia sesión nuevamente.' },
        {
          status: 401,
          headers: SECURITY_HEADERS,
        }
      );
    }
  }


  if (!isPublic && !isApiRoute(pathname)) {
    const hasSession = hasSessionCookie(request);

    if (!hasSession) {
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
};
