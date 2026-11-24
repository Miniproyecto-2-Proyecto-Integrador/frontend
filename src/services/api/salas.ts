import type { User } from 'firebase/auth'
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from './apiClient'

export type SalaPropia = { id: string; nombre: string; rol: 'administrador' }
// US-08: la sala que devuelve GET /api/salas/:id; el rol lo calcula el servidor.
export type SalaAcceso = { id: string; nombre: string; rol: 'administrador' | 'participante' }
const formatoIdSala = /^(?:[A-Za-z0-9_-]{8}|[A-Za-z0-9]{20})$/
export const MENSAJE_ID_SALA = 'Escribe un ID de sala válido: 8 caracteres entre letras, números, guion o guion bajo.'
// Los espacios al inicio o al final se ignoran, igual que en la API.
export function normalizarIdSala(valor: string): string {
  return valor.trim()
}
export function validarIdSala(valor: string): string {
  const id = normalizarIdSala(valor)
  if (!id) return 'Escribe el ID de la sala.'
  return formatoIdSala.test(id) ? '' : MENSAJE_ID_SALA
}
export function validarNombreSala(valor: string): string {
  const nombre = valor.trim()
  return !nombre || Array.from(nombre).length > 80 ? 'Escribe un nombre de sala de 1 a 80 caracteres.' : ''
}
function esSala(valor: unknown): valor is SalaPropia {
  if (!valor || typeof valor !== 'object') return false
  const sala = valor as Record<string, unknown>
  return typeof sala.id === 'string' && /^(?:[A-Za-z0-9_-]{8}|[A-Za-z0-9]{20})$/.test(sala.id)
    && typeof sala.nombre === 'string' && !validarNombreSala(sala.nombre) && sala.rol === 'administrador'
}
async function token(usuario: User) {
  const valor = await usuario.getIdToken()
  if (!valor.trim()) throw new ApiError('No pudimos obtener tu sesión. Vuelve a iniciar sesión.', 401)
  return valor
}
export async function listarSalas(usuario: User): Promise<SalaPropia[]> {
  const respuesta = await apiGet<{ success: boolean; data: unknown }>('/api/salas', await token(usuario))
  if (!respuesta.success || !Array.isArray(respuesta.data) || !respuesta.data.every(esSala)) {
    throw new ApiError('No pudimos leer tus salas. Intenta de nuevo.')
  }
  return respuesta.data
}
export async function crearSala(usuario: User, valor: string): Promise<SalaPropia> {
  const error = validarNombreSala(valor)
  if (error) throw new ApiError(error, 400)
  const respuesta = await apiPost<{ success: boolean; data: unknown }>('/api/salas', { nombre: valor.trim() }, await token(usuario))
  if (!respuesta.success || !esSala(respuesta.data)) throw new ApiError('No pudimos confirmar la sala creada. Revisa tus salas antes de reintentar.')
  return respuesta.data
}
export async function obtenerSala(usuario: User, valor: string): Promise<SalaAcceso> {
  const error = validarIdSala(valor)
  if (error) throw new ApiError(error, 400)
  const id = normalizarIdSala(valor)
  const respuesta = await apiGet<{ success: boolean; data: unknown }>(`/api/salas/${encodeURIComponent(id)}`, await token(usuario))
  const sala = respuesta.data as Record<string, unknown> | null
  if (!respuesta.success || !sala || typeof sala !== 'object' || sala.id !== id || typeof sala.nombre !== 'string'
    || validarNombreSala(sala.nombre) || (sala.rol !== 'administrador' && sala.rol !== 'participante')) {
    throw new ApiError('No pudimos confirmar la sala. Intenta de nuevo.')
  }
  return { id, nombre: sala.nombre, rol: sala.rol }
}

// US-07: solo el anfitrión puede editar o eliminar; el servidor responde 403 a cualquier otra persona.
export async function actualizarSala(usuario: User, valor: string, nombreNuevo: string): Promise<SalaAcceso> {
  const errorId = validarIdSala(valor)
  if (errorId) throw new ApiError(errorId, 400)
  const errorNombre = validarNombreSala(nombreNuevo)
  if (errorNombre) throw new ApiError(errorNombre, 400)
  const id = normalizarIdSala(valor)
  const respuesta = await apiPatch<{ success: boolean; data: unknown }>(
    `/api/salas/${encodeURIComponent(id)}`, { nombre: nombreNuevo.trim() }, await token(usuario))
  const sala = respuesta.data as Record<string, unknown> | null
  if (!respuesta.success || !sala || typeof sala !== 'object' || sala.id !== id || typeof sala.nombre !== 'string'
    || validarNombreSala(sala.nombre) || sala.rol !== 'administrador') {
    throw new ApiError('No pudimos confirmar el cambio. Revisa el nombre de la sala antes de reintentar.')
  }
  return { id, nombre: sala.nombre, rol: 'administrador' }
}

export async function eliminarSala(usuario: User, valor: string): Promise<void> {
  const errorId = validarIdSala(valor)
  if (errorId) throw new ApiError(errorId, 400)
  await apiDelete(`/api/salas/${encodeURIComponent(normalizarIdSala(valor))}`, await token(usuario))
}
