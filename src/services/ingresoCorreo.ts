import { signInWithEmailAndPassword } from 'firebase/auth'
import { obtenerAuth } from './firebase'
import type { User } from 'firebase/auth'

export function autenticarConCorreo(correo: string, password: string) {
  return signInWithEmailAndPassword(obtenerAuth(), correo.trim(), password)
}

export async function accederConCorreo(
  correo: string, password: string,
  autenticar: (correo: string, password: string) => Promise<{ user: User }>,
  cargarPerfil: (usuario: User) => Promise<unknown>,
) {
  const resultado = await autenticar(correo.trim(), password)
  return cargarPerfil(resultado.user)
}

export type DatosIngreso = { correo: string; password: string }
export const ingresoInicial: EstadoIngreso = { datos: { correo: '', password: '' }, errores: {}, intentado: false }
type EstadoIngreso = { datos: DatosIngreso; errores: Partial<Record<keyof DatosIngreso, string>>; intentado: boolean }
export function reducirIngreso(estado: EstadoIngreso, accion:
  | { tipo: 'editar'; campo: keyof DatosIngreso; valor: string }
  | { tipo: 'intentar' }
  | { tipo: 'limpiar-password' }): EstadoIngreso {
  if (accion.tipo === 'intentar') return { ...estado, intentado: true, errores: validarIngreso(estado.datos) }
  if (accion.tipo === 'limpiar-password') return { ...estado, datos: { ...estado.datos, password: '' } }
  const datos = { ...estado.datos, [accion.campo]: accion.valor }
  return { ...estado, datos, errores: {
    ...estado.errores, [accion.campo]: estado.intentado ? validarIngreso(datos)[accion.campo] : undefined,
  } }
}
export function validarIngreso(datos: DatosIngreso) {
  const errores: Partial<Record<keyof DatosIngreso, string>> = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) errores.correo = 'Escribe un correo electrónico válido.'
  if (!datos.password) errores.password = 'Escribe tu contraseña.'
  return errores
}

export function errorIngreso(error: unknown) {
  const codigo = error && typeof error === 'object' && 'code' in error ? error.code : ''
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/user-disabled'].includes(String(codigo))) {
    return 'No pudimos iniciar sesión. Revisa el correo y la contraseña.'
  }
  if (codigo === 'auth/network-request-failed') return 'No pudimos conectar con Firebase. Revisa tu conexión y reintenta.'
  if (codigo === 'auth/too-many-requests') return 'Hubo demasiados intentos. Espera unos minutos y reintenta.'
  return 'No pudimos iniciar sesión. Reintenta; si persiste, contacta al equipo.'
}
