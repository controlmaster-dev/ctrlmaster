function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  return String((error as { code?: string }).code ?? "");
}

export function isTransientDbError(error: unknown): boolean {
  if (error instanceof AggregateError) {
    return error.errors.some((e) => isTransientDbError(e));
  }
  const code = errorCode(error);
  return (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    code === "CONNECT_TIMEOUT" ||
    code === "CONNECTION_CLOSED" ||
    code === "CONNECTION_DESTROYED" ||
    code === "0A000"
  );
}

/** Plan preparado inválido tras cambio de esquema (p. ej. nueva columna `code`). */
export function isCachedPlanError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return String((error as { code?: string }).code ?? "") === "0A000";
}
