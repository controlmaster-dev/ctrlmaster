import type { NextRequest } from 'next/server';

export async function isSessionValid(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get('auth-token')?.value;
  const userId = request.cookies.get('user-id')?.value;

  if (!token || !userId) {
    return false;
  }

  const verifyUrl = new URL('/api/auth/verify', request.nextUrl.origin);

  try {
    const res = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        cookie: request.headers.get('cookie') ?? `auth-token=${token}; user-id=${userId}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return false;
    }

    const data = (await res.json()) as { authenticated?: boolean };
    return data.authenticated === true;
  } catch {
    return false;
  }
}
