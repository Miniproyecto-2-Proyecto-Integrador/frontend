import type { User } from 'firebase/auth'
import { ApiError } from './api/apiClient'
import { crearPerfil } from './api/usuarios'
import type { DatosPerfil, Perfil } from './api/usuarios'
import { ConsultaCanceladaError } from './consultaCoordinada'

export async function finalizarPerfil(
  usuario: User,
  datos: DatosPerfil,
  actualizar: (usuario: User) => Promise<Perfil | null>,
  cuentaActual: () => User | null,
) {
  const comprobarCuenta = () => {
    if (cuentaActual()?.uid !== usuario.uid) throw new ConsultaCanceladaError()
  }
  comprobarCuenta()
  const existente = await actualizar(usuario)
  comprobarCuenta()
  if (existente) return existente
  try {
    await crearPerfil(usuario, datos)
  } catch (error) {
    comprobarCuenta()
    if (!(error instanceof ApiError && error.status === 409)) throw error
    const perfil = await actualizar(usuario)
    comprobarCuenta()
    if (perfil) return perfil
    throw error
  }
  comprobarCuenta()
  const perfil = await actualizar(usuario)
  comprobarCuenta()
  if (!perfil) throw new Error('Aún no pudimos confirmar tu perfil. Reintenta; tu sesión se conserva.')
  return perfil
}
