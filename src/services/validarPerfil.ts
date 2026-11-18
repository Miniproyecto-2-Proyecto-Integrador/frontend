import type { EdicionPerfil } from './api/usuarios'
import { validarRegistro } from './validarRegistro'

export function validarPerfil(datos: EdicionPerfil): Partial<Record<keyof EdicionPerfil, string>> {
  const errores = validarRegistro({ ...datos, password: '' }, true)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim()) || datos.correo.trim().length > 254) errores.correo = 'Escribe un correo electrónico válido.'
  return errores
}

export function cambiosPerfil(anterior: EdicionPerfil, siguiente: EdicionPerfil): Partial<EdicionPerfil> {
  const cambios: Partial<EdicionPerfil> = {}
  for (const campo of ['nombres', 'apellidos', 'username', 'avatar', 'correo'] as const) {
    const valor = campo === 'correo' ? siguiente[campo].trim().toLowerCase() : siguiente[campo].trim()
    const previo = campo === 'correo' ? anterior[campo].trim().toLowerCase() : anterior[campo]
    if (valor !== previo) cambios[campo] = valor
  }
  return cambios
}
