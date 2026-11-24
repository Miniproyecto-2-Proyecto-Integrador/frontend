import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/auth'
import { SIN_CONEXION_CHAT, fusionarMensajes, textoAnuncioMensaje, textoPresencia } from '../services/chat'
import { conectarSala } from '../services/realtime/salaTiempoReal'
import type { ConexionSala, EstadoConexion, EventosSala } from '../services/realtime/salaTiempoReal'
import type { Mensaje, Participante } from '../types/chat'

export type Anuncio = { clave: number; texto: string }
const MAX_ANUNCIOS = 3

// US-07 y US-10: mantiene UNA conexión en tiempo real mientras la sala esté abierta y la cierra al salir.
// Entrega el estado de la conexión, los participantes, los mensajes y los avisos para el lector de pantalla.
export function useSalaEnVivo(idSala: string | undefined, eventos: Pick<EventosSala, 'alEliminarSala' | 'alActualizarNombre'>) {
  const { usuario, perfil } = useAuth()
  const [conexion, setConexion] = useState<{ estado: EstadoConexion; mensaje: string }>({ estado: 'conectando', mensaje: '' })
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const manejadores = useRef(eventos)
  const miNombre = useRef(perfil?.username)
  const enlace = useRef<ConexionSala | null>(null)
  const contador = useRef(0)
  useEffect(() => { manejadores.current = eventos; miNombre.current = perfil?.username })

  // Cada aviso es un párrafo nuevo en una región «status»: el lector lo lee sin mover el foco.
  const anunciar = useCallback((texto: string) => {
    contador.current += 1
    const clave = contador.current
    setAnuncios(previos => [...previos, { clave, texto }].slice(-MAX_ANUNCIOS))
  }, [])

  useEffect(() => {
    if (!usuario || !idSala) return
    const conexionSala = conectarSala({
      idSala,
      obtenerToken: () => usuario.getIdToken(),
      eventos: {
        alEstado: (estado, mensaje) => setConexion({ estado, mensaje: mensaje ?? '' }),
        alEliminarSala: () => manejadores.current.alEliminarSala?.(),
        alActualizarNombre: nombre => manejadores.current.alActualizarNombre?.(nombre),
        alParticipantes: (lista, cambio) => {
          setParticipantes(lista)
          // La propia entrada a la sala no se anuncia: solo quién entra o sale después.
          if (cambio && cambio.nombre !== miNombre.current) anunciar(textoPresencia(cambio))
        },
        alMensaje: mensaje => {
          setMensajes(previos => fusionarMensajes(previos, [mensaje]))
          if (!mensaje.esPropio) anunciar(textoAnuncioMensaje(mensaje))
        },
      },
    })
    enlace.current = conexionSala
    return () => { enlace.current = null; conexionSala.desconectar() }
  }, [usuario, idSala, anunciar])

  // Resuelve con el mensaje guardado por el servidor; rechaza con un texto listo para mostrar.
  const enviarMensaje = useCallback(async (texto: string) => {
    const actual = enlace.current
    if (!actual) throw new Error(SIN_CONEXION_CHAT)
    const mensaje = await actual.enviarMensaje(texto)
    setMensajes(previos => fusionarMensajes(previos, [mensaje]))
    anunciar('Mensaje enviado.')
    return mensaje
  }, [anunciar])

  // US-11: el historial que entrega la API se une a los mensajes en vivo sin duplicar y sin anunciarse.
  const incorporarMensajes = useCallback((nuevos: Mensaje[]) => setMensajes(previos => fusionarMensajes(previos, nuevos)), [])

  return { ...conexion, participantes, mensajes, anuncios, enviarMensaje, incorporarMensajes }
}
