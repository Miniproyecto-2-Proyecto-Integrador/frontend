const API_URL = import.meta.env.VITE_API_URL as string | undefined

export class ApiError extends Error {
  status?: number
  errores: Record<string, string>

  constructor(message: string, status?: number, errores: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errores = errores
  }
}

async function solicitar<T>(path: string, token?: string, body?: unknown): Promise<T> {
  if (!API_URL || API_URL === 'url_vite_ejemplo') {
    throw new ApiError('Falta configurar la dirección del servidor (VITE_API_URL).')
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, {
      headers,
      method: body === undefined ? 'GET' : 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Puede estar iniciando; intenta de nuevo en unos segundos.',
    )
  }

  if (!respuesta.ok) {
    const datos: unknown = await respuesta.json().catch(() => null)
    const error = datos && typeof datos === 'object' ? datos as Record<string, unknown> : {}
    const errores = error.errores && typeof error.errores === 'object'
      ? Object.fromEntries(Object.entries(error.errores).filter((entrada): entrada is [string, string] => typeof entrada[1] === 'string')) : {}
    throw new ApiError(typeof error.message === 'string' ? error.message : `El servidor respondió con un error (${respuesta.status}).`, respuesta.status, errores)
  }

  try {
    return (await respuesta.json()) as T
  } catch {
    throw new ApiError('La respuesta del servidor no tiene el formato esperado.')
  }
}

export function apiGet<T>(path: string, token?: string): Promise<T> {
  return solicitar<T>(path, token)
}

export function apiPost<T>(path: string, body: unknown, token: string): Promise<T> {
  return solicitar<T>(path, token, body)
}
