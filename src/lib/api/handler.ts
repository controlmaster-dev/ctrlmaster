import { NextRequest, NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';
import { apiErrorResponse } from '@/lib/api/errorResponse';
import { ApiError, ValidationError } from '@/lib/errors';
import { logger, serializeError } from '@/lib/logger';

const SLOW_REQUEST_MS = 2000;

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
    const startedAt = Date.now();
    const path = req.nextUrl.pathname;
    const method = req.method;

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
      const response = isNextResponse(result)
        ? result
        : NextResponse.json(result);

      const durationMs = Date.now() - startedAt;
      if (durationMs >= SLOW_REQUEST_MS) {
        logger.warn('slow_request', {
          path,
          method,
          durationMs,
          status: response.status,
        });
      }

      return response;
    } catch (error) {
      const isExpectedClientError =
        error instanceof ZodError ||
        error instanceof ValidationError ||
        (error instanceof ApiError && error.statusCode < 500);

      if (!isExpectedClientError) {
        logger.error('api_request_failed', {
          path,
          method,
          durationMs: Date.now() - startedAt,
          ...serializeError(error),
        });
      }

      return apiErrorResponse(error);
    }
  };
}

export function apiCreated<T>(payload: T): NextResponse {
  return NextResponse.json(payload, { status: 201 });
}

export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}
