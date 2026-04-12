/**
 * Fetch utility with timeout support
 */

interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds

/**
 * Fetch with automatic timeout
 *
 * @param url - URL to fetch
 * @param options - Fetch options with timeout
 * @returns Fetch response
 * @throws Error if request times out
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms to ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Fetch with retry logic
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retries - Number of retries (default: 2)
 * @param delay - Delay between retries in ms (default: 1000)
 * @returns Fetch response
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithTimeoutOptions = {},
  retries: number = 2,
  delay: number = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
}
