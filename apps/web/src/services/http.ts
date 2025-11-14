const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  data: unknown
  path: string

  constructor(message: string, status: number, data: unknown, path: string) {
    super(message)
    this.status = status
    this.data = data
    this.path = path
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData | string | null
  token?: string | null
  query?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(path: string, query?: RequestOptions['query']): URL {
  const sanitizedPath = path.startsWith('/') ? path.slice(1) : path
  const url = path.startsWith('http')
    ? new URL(path)
    : new URL(`${sanitizedPath}`, `${API_BASE_URL}/`)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return
      }
      url.searchParams.set(key, String(value))
    })
  }

  return url
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, query, body, headers, ...rest } = options
  const url = buildUrl(path, query)
  const requestHeaders = new Headers(headers)
  let payload: BodyInit | undefined

  if (body instanceof FormData) {
    payload = body
  } else if (typeof body === 'string') {
    payload = body
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json')
    }
  } else if (body) {
    payload = JSON.stringify(body)
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }

  // Debug logging
  console.log('🔍 API Request:', {
    url: url.toString(),
    method: rest.method || 'GET',
    headers: Object.fromEntries(requestHeaders.entries()),
    body: payload,
  })

  const response = await fetch(url, {
    method: rest.method || 'GET',
    ...rest,
    headers: requestHeaders,
    body: payload,
  })

  const contentType = response.headers.get('content-type')
  let responseBody: unknown = null

  if (response.status !== 204) {
    const text = await response.text()
    if (text) {
      if (contentType && contentType.includes('application/json')) {
        try {
          responseBody = JSON.parse(text)
        } catch {
          responseBody = text
        }
      } else {
        responseBody = text
      }
    }
  }

  if (!response.ok) {
    const message =
      typeof responseBody === 'object' && responseBody !== null && 'message' in responseBody
        ? (responseBody as Record<string, string>).message
        : response.statusText || 'Erro inesperado'
    throw new ApiError(message, response.status, responseBody, url.pathname)
  }

  return responseBody as T
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
