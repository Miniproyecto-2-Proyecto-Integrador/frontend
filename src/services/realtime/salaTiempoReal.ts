import { io } from 'socket.io-client'
import type { CambioPresencia, Mensaje, Participante } from '../../types/chat'
import { normalizarIdSala, validarIdSala, validarNombreSala } from '../api/salas'
import { SIN_CONEXION_CHAT, esCambioPresencia, esMensaje, esParticipante, validarTextoMensaje } from '../chat'

// Conexión Socket.IO a backend-realtime para una sala. El servidor exige el ID token en el handshake
// (auth.token) y emite «sala:eliminada» y «sala:actualizada» a quienes están dentro de la sala.
// US-10 amplía estos eventos con el chat («chat:enviar», «chat:mensaje») y la presencia («sala:presencia»).
export type EstadoConexion = 'conectando' | 'conectada' | 'sin-conexion'
export type EventosSala = {
  alEstado?: (estado: EstadoConexion, mensaje?: string) => void
  alEliminarSala?: () => void
  alActualizarNombre?: (nombre: string) => void
  // Lista completa de quienes están en la sala; «cambio» dice quién entró o salió (solo en sala:presencia).
  alParticipantes?: (participantes: Participante[], cambio?: CambioPresencia) => void
  // Mensaje de otra persona de esta sala. El propio llega en la confirmación de enviarMensaje.
  alMensaje?: (mensaje: Mensaje) => void
}
export type ConexionSala = { desconectar: () => void; enviarMensaje: (texto: string) => Promise<Mensaje> }
const ESPERA_CONFIRMACION_MS = 10_000
type Respuesta = { ok: boolean; error?: string; data?: unknown }
// Subconjunto de Socket del cliente que usamos; permite probar sin red.
export type SocketSala = {
  connected: boolean
  on: (evento: string, manejador: (...argumentos: any[]) => void) => unknown // eslint-disable-line @typescript-eslint/no-explicit-any
  emit: (evento: string, ...argumentos: unknown[]) => unknown
  disconnect: () => unknown
}
type FabricaSocket = (url: string, opciones: { auth: (entregar: (datos: { token: string }) => void) => void }) => SocketSala

export function conectarSala({ idSala, obtenerToken, eventos, url = import.meta.env.VITE_REALTIME_URL as string | undefined, crearSocket = io as unknown as FabricaSocket }: {
  idSala: string
  obtenerToken: () => Promise<string>
  eventos: EventosSala
  url?: string
  crearSocket?: FabricaSocket
}): ConexionSala {
  const id = normalizarIdSala(idSala)
  if (validarIdSala(id) || !url || url === 'url_realtime_ejemplo') {
    eventos.alEstado?.('sin-conexion', 'Falta configurar la conexión en tiempo real (VITE_REALTIME_URL).')
    return { desconectar: () => undefined, enviarMensaje: () => Promise.reject(new Error(SIN_CONEXION_CHAT)) }
  }
  let activa = true
  // Solo se puede escribir cuando el servidor confirmó que esta conexión ya está dentro de la sala.
  let unido = false
  eventos.alEstado?.('conectando')
  const socket = crearSocket(url.replace(/\/$/, ''), {
    // Se pide un token vigente en cada conexión y reconexión.
    auth: entregar => { obtenerToken().then(token => entregar({ token }), () => entregar({ token: '' })) },
  })
  const unir = () => socket.emit('sala:unir', id, (respuesta: Respuesta) => {
    if (!activa) return
    if (respuesta?.ok) {
      unido = true
      const participantes = (respuesta.data as { participantes?: unknown } | undefined)?.participantes
      if (Array.isArray(participantes) && participantes.every(esParticipante)) eventos.alParticipantes?.(participantes)
      eventos.alEstado?.('conectada')
    } else eventos.alEstado?.('sin-conexion', respuesta?.error ?? 'No pudimos entrar a la sala en tiempo real.')
  })
  socket.on('connect', () => { if (activa) { unido = false; unir() } })
  socket.on('disconnect', () => {
    unido = false
    if (activa) eventos.alEstado?.('sin-conexion', 'Se perdió la conexión en tiempo real. Estamos intentando reconectar.')
  })
  socket.on('connect_error', (error: Error) => {
    if (activa) eventos.alEstado?.('sin-conexion', error?.message?.startsWith('No autorizado')
      ? 'Tu sesión no es válida para el tiempo real. Vuelve a iniciar sesión.'
      : 'No pudimos conectar en tiempo real. Estamos reintentando.')
  })
  socket.on('sala:eliminada', (datos: unknown) => {
    if (activa && (datos as { id?: unknown } | null)?.id === id) eventos.alEliminarSala?.()
  })
  socket.on('sala:actualizada', (datos: unknown) => {
    const { id: recibido, nombre } = (datos ?? {}) as { id?: unknown; nombre?: unknown }
    if (activa && recibido === id && typeof nombre === 'string' && !validarNombreSala(nombre)) eventos.alActualizarNombre?.(nombre)
  })
  socket.on('sala:presencia', (datos: unknown) => {
    const { id: recibido, participantes, cambio } = (datos ?? {}) as { id?: unknown; participantes?: unknown; cambio?: unknown }
    if (!activa || recibido !== id || !Array.isArray(participantes) || !participantes.every(esParticipante)) return
    eventos.alParticipantes?.(participantes, esCambioPresencia(cambio) ? cambio : undefined)
  })
  // Solo se aceptan mensajes bien formados y de esta sala; los de otras salas nunca llegan a la pantalla.
  socket.on('chat:mensaje', (datos: unknown) => {
    if (activa && esMensaje(datos) && datos.salaId === id) eventos.alMensaje?.(datos)
  })
  const enviarMensaje = (texto: string) => new Promise<Mensaje>((resolver, rechazar) => {
    const error = validarTextoMensaje(texto)
    if (error) { rechazar(new Error(error)); return }
    if (!activa || !unido || !socket.connected) { rechazar(new Error(SIN_CONEXION_CHAT)); return }
    let terminado = false
    const espera = setTimeout(() => {
      terminado = true
      rechazar(new Error('No pudimos confirmar el envío. Revisa el chat antes de volver a intentarlo.'))
    }, ESPERA_CONFIRMACION_MS)
    socket.emit('chat:enviar', { id, texto: texto.trim() }, (respuesta: Respuesta) => {
      if (terminado) return
      terminado = true
      clearTimeout(espera)
      if (respuesta?.ok && esMensaje(respuesta.data) && respuesta.data.salaId === id) resolver({ ...respuesta.data, esPropio: true })
      else rechazar(new Error(respuesta?.ok ? 'No pudimos confirmar el mensaje. Revisa el chat antes de volver a intentarlo.'
        : respuesta?.error ?? 'No pudimos enviar el mensaje. Intenta de nuevo.'))
    })
  })
  return {
    enviarMensaje,
    desconectar: () => {
      if (!activa) return
      activa = false
      unido = false
      if (socket.connected) socket.emit('sala:salir', id)
      socket.disconnect()
    },
  }
}
