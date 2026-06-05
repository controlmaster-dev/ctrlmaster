import { NextRequest, type NextResponse } from 'next/server';

type RouteHandler = (
  req: NextRequest,
  route: { params: Promise<Record<string, string | string[] | undefined>> }
) => Promise<Response | NextResponse>;

export function createJsonRequest(
  path: string,
  body?: unknown,
  init: RequestInit & { authToken?: string } = {}
): NextRequest {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  if (init.authToken) {
    headers.set('Cookie', `auth-token=${init.authToken}`);
  }

  return new NextRequest(`http://localhost${path}`, {
    method: init.method ?? (body === undefined ? 'GET' : 'POST'),
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export async function invokeRoute(
  handler: RouteHandler,
  req: NextRequest,
  params: Record<string, string | string[] | undefined> = {}
): Promise<Response> {
  return handler(req, { params: Promise.resolve(params) });
}

export function extractAuthToken(res: Response): string | null {
  const setCookies =
    typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [];

  for (const cookie of setCookies) {
    const match = cookie.match(/^auth-token=([^;]+)/);
    if (match?.[1]) return match[1];
  }

  const single = res.headers.get('set-cookie');
  if (!single) return null;

  const fallback = single.match(/auth-token=([^;]+)/);
  return fallback?.[1] ?? null;
}
