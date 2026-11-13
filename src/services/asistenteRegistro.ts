import { validarRegistro } from './validarRegistro'
import type { DatosRegistro, ErroresRegistro } from './validarRegistro'

export type PasoRegistro = 1 | 2
export const nombresPasos = ['Tu perfil', 'Acceso'] as const
const camposPorPaso: Record<PasoRegistro, (keyof DatosRegistro)[]> = {
  1: ['nombres', 'apellidos', 'username', 'avatar'],
  2: ['correo', 'password'],
}

export const formularioInicial = {
  datos: { nombres: '', apellidos: '', username: '', avatar: '', correo: '', password: '' },
  errores: {},
  validados: {},
  paso: 1,
} satisfies EstadoFormulario

type EstadoFormulario = {
  datos: DatosRegistro
  errores: ErroresRegistro
  validados: Partial<Record<keyof DatosRegistro, true>>
  paso: PasoRegistro
}
type AccionFormulario =
  | { tipo: 'editar'; campo: keyof DatosRegistro; valor: string }
  | { tipo: 'siguiente'; pendiente: boolean }
  | { tipo: 'anterior'; pasoActual: PasoRegistro }
  | { tipo: 'errores'; errores: ErroresRegistro }
  | { tipo: 'validar-envio'; pendiente: boolean }
  | { tipo: 'limpiar-password' }
  | { tipo: 'cambiar-cuenta' }
  | { tipo: 'reiniciar' }

export function validarPaso(datos: DatosRegistro, paso: PasoRegistro, pendiente: boolean): ErroresRegistro {
  const errores = validarRegistro(datos, pendiente)
  return Object.fromEntries(camposPorPaso[paso].filter(campo => errores[campo]).map(campo => [campo, errores[campo]]))
}

export function pasoDelPrimerError(errores: ErroresRegistro): PasoRegistro {
  for (const paso of [1, 2] as const) {
    if (camposPorPaso[paso].some(campo => errores[campo])) return paso
  }
  return 1
}

export function reducirFormulario(estado: EstadoFormulario, accion: AccionFormulario): EstadoFormulario {
  switch (accion.tipo) {
    case 'editar': {
      const datos = { ...estado.datos, [accion.campo]: accion.valor }
      return {
        ...estado,
        datos,
        errores: {
          ...estado.errores,
          [accion.campo]: estado.validados[accion.campo] ? validarRegistro(datos, false)[accion.campo] : undefined,
        },
      }
    }
    case 'siguiente': {
      const total = accion.pendiente ? 1 : 2
      const paso = Math.min(estado.paso, total) as PasoRegistro
      const errores = validarPaso(estado.datos, paso, accion.pendiente)
      const actualizados = { ...estado.errores }
      const validados = { ...estado.validados }
      for (const campo of camposPorPaso[paso]) delete actualizados[campo]
      for (const campo of camposPorPaso[paso]) validados[campo] = true
      return { ...estado, validados, errores: { ...actualizados, ...errores }, paso: Object.keys(errores).length ? paso : Math.min(paso + 1, total) as PasoRegistro }
    }
    case 'anterior':
      return { ...estado, paso: Math.max(1, accion.pasoActual - 1) as PasoRegistro }
    case 'errores': {
      const validados = { ...estado.validados }
      for (const campo of Object.keys(accion.errores) as (keyof DatosRegistro)[]) validados[campo] = true
      return { ...estado, validados, errores: accion.errores, paso: pasoDelPrimerError(accion.errores) }
    }
    case 'validar-envio': {
      const errores = validarRegistro(estado.datos, accion.pendiente)
      const validados = { ...estado.validados }
      for (const campo of [...camposPorPaso[1], ...(accion.pendiente ? [] : camposPorPaso[2])]) validados[campo] = true
      return { ...estado, validados, errores, paso: Object.keys(errores).length ? pasoDelPrimerError(errores) : estado.paso }
    }
    case 'limpiar-password':
      return { ...estado, datos: { ...estado.datos, password: '' } }
    case 'cambiar-cuenta':
      return { ...estado, paso: 2, errores: {}, validados: {}, datos: { ...estado.datos, password: '' } }
    case 'reiniciar':
      return { ...formularioInicial, datos: { ...formularioInicial.datos }, errores: {}, validados: {} }
  }
}

// El cerrojo se activa antes de cualquier await y se comparte con los reintentos/cambio de cuenta.
export async function confirmarPasoFinal(
  paso: PasoRegistro,
  total: 1 | 2,
  bloqueo: { current: boolean },
  accion: () => Promise<void>,
) {
  if (paso !== total || bloqueo.current) return false
  bloqueo.current = true
  try {
    await accion()
    return true
  } finally {
    bloqueo.current = false
  }
}
