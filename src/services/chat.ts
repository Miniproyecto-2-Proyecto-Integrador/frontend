import type { CambioPresencia, Mensaje, Participante } from '../types/chat'

// US-10: reglas del chat que comparten el servicio de tiempo real, el hook y la interfaz.
// El servidor aplica el mismo límite (2000 caracteres) y es quien decide en última instancia.
export const MAX_MENSAJE = 2000
export const MENSAJE_VACIO = 'Escribe un mensaje antes de enviarlo.'
export const MENSAJE_LARGO = `Tu mensaje supera los ${MAX_MENSAJE} caracteres. Acórtalo para poder enviarlo.`
export const SIN_CONEXION_CHAT = 'Todavía no estás conectado a la sala. Espera un momento e intenta de nuevo.'

// Un mensaje vacío o solo con espacios no se envía.
export function validarTextoMensaje(valor: string): string {
  const texto = valor.trim()
  if (!texto) return MENSAJE_VACIO
  return texto.length > MAX_MENSAJE ? MENSAJE_LARGO : ''
}

export function esMensaje(valor: unknown): valor is Mensaje {
  if (!valor || typeof valor !== 'object') return false
  const m = valor as Record<string, unknown>
  return typeof m.id === 'string' && m.id !== '' && typeof m.salaId === 'string' && typeof m.autor === 'string'
    && typeof m.texto === 'string' && typeof m.creadoEn === 'string' && !Number.isNaN(Date.parse(m.creadoEn))
    && typeof m.esPropio === 'boolean'
}

export function esParticipante(valor: unknown): valor is Participante {
  if (!valor || typeof valor !== 'object') return false
  const p = valor as Record<string, unknown>
  return typeof p.nombre === 'string' && p.nombre !== '' && typeof p.esAnfitrion === 'boolean' && (p.avatar === undefined || typeof p.avatar === 'string')
}

export function esCambioPresencia(valor: unknown): valor is CambioPresencia {
  if (!valor || typeof valor !== 'object') return false
  const c = valor as Record<string, unknown>
  return (c.tipo === 'entro' || c.tipo === 'salio') && typeof c.nombre === 'string' && c.nombre !== ''
}

// Une listas de mensajes sin duplicar (mismo id) y en orden cronológico; el desempate por id
// coincide con el orden que usa la API. Si un id se repite, gana la versión más reciente.
export function fusionarMensajes(actuales: Mensaje[], nuevos: Mensaje[]): Mensaje[] {
  if (nuevos.length === 0) return actuales
  const porId = new Map(actuales.map(m => [m.id, m]))
  for (const m of nuevos) porId.set(m.id, m)
  return [...porId.values()].sort((a, b) => Date.parse(a.creadoEn) - Date.parse(b.creadoEn) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

// «10:32 a. m.» si es de hoy; con el día («23 nov, 10:32 a. m.») si es de otro día.
export function formatearMomento(iso: string, ahora: Date = new Date()): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  const hora = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' }).format(fecha)
  if (fecha.toDateString() === ahora.toDateString()) return hora
  return `${new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(fecha)}, ${hora}`
}

export function textoPresencia(cambio: CambioPresencia): string {
  return `${cambio.nombre} ${cambio.tipo === 'entro' ? 'entró a la sala.' : 'salió de la sala.'}`
}

// Lo que lee el lector de pantalla cuando llega un mensaje de otra persona (sin mover el foco).
export function textoAnuncioMensaje(mensaje: Mensaje): string {
  const texto = mensaje.texto.length > 300 ? `${mensaje.texto.slice(0, 300)}…` : mensaje.texto
  return `${mensaje.autor} escribió: ${texto}`
}
