export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return response.text();
  }
  return response.json();
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, headers, ...requestOptions } = options;
  const response = await fetch(endpoint, {
    credentials: 'include',
    ...requestOptions,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status, payload);
  }

  return payload as T;
}

export function apiGet<T>(endpoint: string, options?: ApiRequestOptions) {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

export function apiPost<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) {
  return apiRequest<T>(endpoint, { ...options, method: 'POST', body });
}

export function apiPatch<T>(endpoint: string, body?: unknown, options?: ApiRequestOptions) {
  return apiRequest<T>(endpoint, { ...options, method: 'PATCH', body });
}

export function apiDelete<T>(endpoint: string, options?: ApiRequestOptions) {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}
