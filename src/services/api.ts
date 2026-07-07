export type ApiError = {
  message: string
  status?: number
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

const defaultHeaders = {
  'Content-Type': 'application/json',
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const error: ApiError = {
      message: `Request failed with status ${response.status}`,
      status: response.status,
    }
    throw error
  }

  return response.json() as Promise<T>
}
