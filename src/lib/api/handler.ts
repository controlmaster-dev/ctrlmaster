import { NextRequest, NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';
import { ApiError, ValidationError, getErrorMessage } from '@/lib/errors';

type MaybePromise<T> = T | Promise<T>;

type RouteContext = {
  params?: Record<string, string | string[] | undefined>;
};

type NextRouteContext = {
  params: Promise<Record<string, string | string[] | undefined>>;
};

type ApiHandlerContext<TBody = unknown, TQuery = unknown> = {
  req: NextRequest;
  route: RouteContext;
  user?: Record<string, unknown>;
  body: TBody;
  query: TQuery;
};

type ApiHandlerOptions<TBody, TQuery> = {
  auth?: boolean;
  roles?: string[];
  bodySchema?: ZodType<TBody>;
  querySchema?: ZodType<TQuery>;
};

type ApiHandler<TBody, TQuery, TResult> = (
  context: ApiHandlerContext<TBody, TQuery>
) => MaybePromise<TResult | NextResponse>;

function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

function normalizeZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Datos de entrada invalidos', details: normalizeZodError(error) },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  console.error('[API] Unexpected error:', error);
  return NextResponse.json(
    { error: getErrorMessage(error) || 'Error interno del servidor' },
    { status: 500 }
  );
}

async function readJsonBody(req: NextRequest): Promise<unknown> {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return undefined;
  }

  const text = await req.text();
  if (!text) return undefined;
  return JSON.parse(text);
}

function readQuery(req: NextRequest): Record<string, string> {
  return Object.fromEntries(req.nextUrl.searchParams.entries());
}

export function apiHandler<TBody = undefined, TQuery = Record<string, string>, TResult = unknown>(
  options: ApiHandlerOptions<TBody, TQuery>,
  handler: ApiHandler<TBody, TQuery, TResult>
) {
  return async (req: NextRequest, route: NextRouteContext) => {
    try {
      const resolvedRoute: RouteContext = {
        params: route?.params ? await route.params : undefined,
      };

      let user: Record<string, unknown> | undefined;

      if (options.auth || options.roles?.length) {
        const authResult = await validateApiAuth(req);
        if (authResult instanceof NextResponse) return authResult;
        user = authResult.user as Record<string, unknown>;

        if (options.roles?.length) {
          const roleResult = requireRole(user, options.roles);
          if (roleResult instanceof NextResponse) return roleResult;
        }
      }

      const rawQuery = readQuery(req);
      const query = options.querySchema
        ? options.querySchema.parse(rawQuery)
        : (rawQuery as TQuery);

      const rawBody = await readJsonBody(req);
      const body = options.bodySchema
        ? options.bodySchema.parse(rawBody)
        : (rawBody as TBody);

      const result = await handler({ req, route: resolvedRoute, user, body, query });
      if (isNextResponse(result)) return result;
      return NextResponse.json(result);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function apiCreated<T>(payload: T): NextResponse {
  return NextResponse.json(payload, { status: 201 });
}

export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
