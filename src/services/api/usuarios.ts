import type { User } from 'firebase/auth'
import { ApiError, apiGet, apiPost } from './apiClient'

export type DatosPerfil = { nombres: string; apellidos: string; username: string; avatar: string }
export type Perfil = DatosPerfil & { correo: string; creadoEn: string | null }

export async function consultarPerfil(usuario: User): Promise<Perfil | null> {
  try {
    const respuesta = await apiGet<{ success: boolean; data: Perfil }>('/api/usuarios/yo', await usuario.getIdToken())
    const perfil = respuesta.data
    if (!respuesta.success || !perfil || !['nombres', 'apellidos', 'username', 'avatar', 'correo'].every(campo => typeof perfil[campo as keyof Perfil] === 'string' && perfil[campo as keyof Perfil])) {
      throw new ApiError('El servidor devolvió un perfil incompleto. Reintenta la consulta.')
    }
    return perfil
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function crearPerfil(usuario: User, datos: DatosPerfil) {
  await apiPost<{ success: boolean; message: string }>('/api/usuarios', datos, await usuario.getIdToken())
}
