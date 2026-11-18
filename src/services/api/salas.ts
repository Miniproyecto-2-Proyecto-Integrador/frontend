import type { User } from 'firebase/auth'
import { ApiError, apiGet, apiPost } from './apiClient'

export type SalaPropia = { id: string; nombre: string; rol: 'administrador' }
export function validarNombreSala(valor: string): string {
  const nombre = valor.trim()
  return !nombre || Array.from(nombre).length > 80 ? 'Escribe un nombre de sala de 1 a 80 caracteres.' : ''
}
function esSala(valor: unknown): valor is SalaPropia {
  if (!valor || typeof valor !== 'object') return false
  const sala = valor as Record<string, unknown>
  return typeof sala.id === 'string' && /^[a-zA-Z0-9]{20}$/.test(sala.id)
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
