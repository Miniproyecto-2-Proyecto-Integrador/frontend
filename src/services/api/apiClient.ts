const API_URL = import.meta.env.VITE_API_URL as string | undefined

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  if (!API_URL) {
    throw new ApiError('Falta configurar la dirección del servidor (VITE_API_URL).')
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${path}`, { headers })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Puede estar iniciando; intenta de nuevo en unos segundos.',
    )
  }

  if (!respuesta.ok) {
    throw new ApiError(`El servidor respondió con un error (${respuesta.status}).`, respuesta.status)
  }

  try {
    return (await respuesta.json()) as T
  } catch {
    throw new ApiError('La respuesta del servidor no tiene el formato esperado.')
  }
}