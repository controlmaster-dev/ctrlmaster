import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError, ValidationError } from "@/lib/errors";
import { isTransientDbError } from "@/lib/dbErrors";
import { logger, serializeError } from "@/lib/logger";

function normalizeZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export function apiErrorResponse(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Datos de entrada invalidos", details: normalizeZodError(error) },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, details: error.details },
      { status: error.statusCode }
    );
  }

  logger.error("api_unexpected_error", serializeError(error));

  const isTransient =
    isTransientDbError(error) ||
    (error instanceof Error &&
      /fetch failed|ETIMEDOUT|ENOTFOUND|could not be resolved|aborted/i.test(
        error.message
      ));

  if (isTransient) {
    return NextResponse.json(
      {
        error:
          "Servicio temporalmente no disponible. Comprueba tu conexión e intenta de nuevo en unos segundos.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}
