function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  return String((error as { code?: string }).code ?? "");
}

export function isTransientDbError(error: unknown): boolean {
  if (error instanceof AggregateError) {
    return error.errors.some((e) => isTransientDbError(e));
  }
  const code = errorCode(error);
  const name = String((error as { name?: string }).name ?? "");
  return (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    code === "CONNECT_TIMEOUT" ||
    code === "CONNECTION_CLOSED" ||
    code === "CONNECTION_DESTROYED" ||
    name === "MongoServerSelectionError" ||
    name === "MongoNetworkError"
  );
}
