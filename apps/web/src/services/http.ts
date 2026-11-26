// Cliente HTTP: envia o JWT no header Authorization e padroniza os erros da API
const BASE = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'readex.token'

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set: (t: string) => { try { localStorage.setItem(TOKEN_KEY, t) } catch { /* modo privado */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY) } catch { /* modo privado */ } },
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string> = {},
    public data: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

let onUnauthorized: () => void = () => {}
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn }

export async function http<T>(path: string, opts: { method?: string; body?: unknown; query?: Record<string, unknown> } = {}): Promise<T> {
  const url = new URL(BASE + path, window.location.origin)
  Object.entries(opts.query ?? {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, String(x)))
    else url.searchParams.set(k, String(v))
  })
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(url, { method: opts.method ?? 'GET', headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined })
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Confira sua internet e tente de novo.')
  }
  const data = res.status === 204 ? {} : await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized()
    const fields: Record<string, string> = { ...(data.fields ?? {}) }
    if (data.field) fields[data.field] = data.message
    throw new ApiError(res.status, data.message ?? 'Algo deu errado. Tente de novo.', fields, data)
  }
  return data as T
}

export const api = {
  get: <T>(p: string, query?: Record<string, unknown>) => http<T>(p, { query }),
  post: <T>(p: string, body?: unknown) => http<T>(p, { method: 'POST', body: body ?? {} }),
  put: <T>(p: string, body?: unknown) => http<T>(p, { method: 'PUT', body: body ?? {} }),
  patch: <T>(p: string, body?: unknown) => http<T>(p, { method: 'PATCH', body: body ?? {} }),
  del: <T>(p: string, body?: unknown) => http<T>(p, { method: 'DELETE', body }),
}
