import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError, ValidationError } from "@/lib/errors";

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

  console.error("[API] Unexpected error:", error);
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}
