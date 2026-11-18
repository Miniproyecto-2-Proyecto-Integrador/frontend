const API_URL = import.meta.env.VITE_API_URL as string | undefined

export class ApiError extends Error {
  status?: number
  errores: Record<string, string>
  respuestaApi: boolean
  requestId?: string
  revision?: string

  constructor(message: string, status?: number, errores: Record<string, string> = {}, respuestaApi = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errores = errores
    this.respuestaApi = respuestaApi
  }
}

async function solicitar<T>(path: string, method: 'GET' | 'POST' | 'PATCH', token?: string, body?: unknown): Promise<T> {
  if (!API_URL || API_URL === 'url_vite_ejemplo') {
    throw new ApiError('Falta configurar la dirección del servidor (VITE_API_URL).')
  }

  if (/^\/api\/usuarios(?:\/|$)/.test(path) && (!token || !token.trim())) {
    throw new ApiError('No pudimos obtener tu sesión. Vuelve a iniciar sesión.', 401)
  }
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token.trim()}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, {
      headers,
      method,
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
    const respuestaApi = error.success === false && typeof error.message === 'string'
    const mensaje = respuesta.status === 404
      ? (method === 'PATCH' && path === '/api/usuarios/yo'
        ? 'La edición del perfil no está disponible en el servidor. Intenta más tarde.'
        : 'La dirección solicitada no está disponible en el servidor. Intenta más tarde.')
      : `El servidor respondió con un error (${respuesta.status}).`
    const fallo = new ApiError(typeof error.message === 'string' ? error.message : mensaje, respuesta.status, errores, respuestaApi)
    const requestId = respuesta.headers?.get('X-Request-Id') ?? error.requestId
    const revision = respuesta.headers?.get('X-App-Revision')
    if (typeof requestId === 'string' && /^[a-f0-9-]{36}$/i.test(requestId)) fallo.requestId = requestId
    if (revision && (/^[a-f0-9]{7,40}$/i.test(revision) || revision === 'local-sin-revision')) fallo.revision = revision
    throw fallo
  }

  try {
    return (await respuesta.json()) as T
  } catch {
    throw new ApiError('La respuesta del servidor no tiene el formato esperado.')
  }
}

export function apiGet<T>(path: string, token?: string): Promise<T> {
  return solicitar<T>(path, 'GET', token)
}

export function apiPost<T>(path: string, body: unknown, token: string): Promise<T> {
  return solicitar<T>(path, 'POST', token, body)
}

export function apiPatch<T>(path: string, body: unknown, token: string): Promise<T> {
  return solicitar<T>(path, 'PATCH', token, body)
}
