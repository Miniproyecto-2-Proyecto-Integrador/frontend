import type { DatosPerfil } from './api/usuarios'

export type DatosRegistro = DatosPerfil & { correo: string; password: string }
export type ErroresRegistro = Partial<Record<keyof DatosRegistro, string>>

export function validarRegistro(datos: DatosRegistro, pendiente: boolean): ErroresRegistro {
  const errores: ErroresRegistro = {}
  if (!datos.nombres.trim() || datos.nombres.trim().length > 50) errores.nombres = 'Escribe tus nombres (máximo 50 caracteres).'
  if (!datos.apellidos.trim() || datos.apellidos.trim().length > 50) errores.apellidos = 'Escribe tus apellidos (máximo 50 caracteres).'
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(datos.username.trim())) errores.username = 'Usa entre 3 y 20 caracteres: letras de A a Z, números o guion bajo.'
  if (!/^avatar[1-6]$/.test(datos.avatar)) errores.avatar = 'Selecciona un avatar.'
  if (!pendiente) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) errores.correo = 'Escribe un correo electrónico válido.'
    if (datos.password.length < 8 || !/\p{L}/u.test(datos.password) || !/[0-9]/.test(datos.password)) errores.password = 'Usa al menos ocho caracteres, una letra y un número.'
  }
  return errores
}
