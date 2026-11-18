import type { User } from 'firebase/auth'
import { ApiError, apiGet, apiPost, apiPatch } from './apiClient'

export type DatosPerfil = { nombres: string; apellidos: string; username: string; avatar: string }
export type Perfil = DatosPerfil & { correo: string; creadoEn: string | null }

function esPerfil(valor: unknown): valor is Perfil {
  if (!valor || typeof valor !== 'object') return false
  const perfil = valor as Record<string, unknown>
  return ['nombres', 'apellidos', 'username', 'avatar', 'correo'].every(campo => typeof perfil[campo] === 'string' && perfil[campo].trim())
}

export async function consultarPerfil(usuario: User): Promise<Perfil | null> {
  try {
    const respuesta = await apiGet<{ success: boolean; data: Perfil }>('/api/usuarios/yo', await usuario.getIdToken())
    const perfil = respuesta.data
    if (!respuesta.success || !esPerfil(perfil)) {
      throw new ApiError('El servidor devolvió un perfil incompleto. Reintenta la consulta.')
    }
    return perfil
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.respuestaApi && error.message === 'Este usuario aún no tiene perfil.') return null
    throw error
  }
}

export async function crearPerfil(usuario: User, datos: DatosPerfil) {
  await apiPost<{ success: boolean; message: string }>('/api/usuarios', datos, await usuario.getIdToken())
}

export type EdicionPerfil = DatosPerfil & { correo: string }

export async function editarPerfil(usuario: User, datos: Partial<EdicionPerfil>): Promise<Perfil> {
  const campos = ['nombres', 'apellidos', 'username', 'avatar', 'correo'] as const
  const cambios = Object.fromEntries(campos.filter(campo => datos[campo] !== undefined).map(campo => [campo, datos[campo]]))
  if (!Object.keys(cambios).length) throw new ApiError('No hay cambios por guardar.', 400)
  const respuesta = await apiPatch<{ success: boolean; data: Perfil }>('/api/usuarios/yo', cambios, await usuario.getIdToken())
  if (!respuesta.success || !esPerfil(respuesta.data)) throw new ApiError('No pudimos confirmar los cambios. Vuelve a cargar tu perfil.')
  return respuesta.data
}
