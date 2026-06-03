import { isTransientDbError } from "@/lib/dbErrors";

const DEFAULT_ATTEMPTS = 3;
const BASE_DELAY_MS = 250;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reintenta consultas cuando Neon/Postgres responde con timeout puntual. */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  attempts = DEFAULT_ATTEMPTS
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || i >= attempts - 1) {
        throw error;
      }
      await delay(BASE_DELAY_MS * (i + 1));
    }
  }

  throw lastError;
}
