import { io } from 'socket.io-client'
import { normalizarIdSala, validarIdSala, validarNombreSala } from '../api/salas'

// Conexión Socket.IO a backend-realtime para una sala. El servidor exige el ID token en el handshake
// (auth.token) y emite «sala:eliminada» y «sala:actualizada» a quienes están dentro de la sala.
// Se mantiene pequeña a propósito: el chat y la presencia (US-10) amplían estos eventos.
export type EstadoConexion = 'conectando' | 'conectada' | 'sin-conexion'
export type EventosSala = {
  alEstado?: (estado: EstadoConexion, mensaje?: string) => void
  alEliminarSala?: () => void
  alActualizarNombre?: (nombre: string) => void
}
type Respuesta = { ok: boolean; error?: string }
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
}): { desconectar: () => void } {
  const id = normalizarIdSala(idSala)
  if (validarIdSala(id) || !url || url === 'url_realtime_ejemplo') {
    eventos.alEstado?.('sin-conexion', 'Falta configurar la conexión en tiempo real (VITE_REALTIME_URL).')
    return { desconectar: () => undefined }
  }
  let activa = true
  eventos.alEstado?.('conectando')
  const socket = crearSocket(url.replace(/\/$/, ''), {
    // Se pide un token vigente en cada conexión y reconexión.
    auth: entregar => { obtenerToken().then(token => entregar({ token }), () => entregar({ token: '' })) },
  })
  const unir = () => socket.emit('sala:unir', id, (respuesta: Respuesta) => {
    if (!activa) return
    if (respuesta?.ok) eventos.alEstado?.('conectada')
    else eventos.alEstado?.('sin-conexion', respuesta?.error ?? 'No pudimos entrar a la sala en tiempo real.')
  })
  socket.on('connect', () => { if (activa) unir() })
  socket.on('disconnect', () => {
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
  return {
    desconectar: () => {
      if (!activa) return
      activa = false
      if (socket.connected) socket.emit('sala:salir', id)
      socket.disconnect()
    },
  }
}
