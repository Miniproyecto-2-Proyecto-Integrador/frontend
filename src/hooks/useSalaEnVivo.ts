import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/auth'
import { conectarSala } from '../services/realtime/salaTiempoReal'
import type { EstadoConexion, EventosSala } from '../services/realtime/salaTiempoReal'

// US-07: mantiene la conexión en tiempo real mientras la sala esté abierta y la cierra al salir.
export function useSalaEnVivo(idSala: string | undefined, eventos: Pick<EventosSala, 'alEliminarSala' | 'alActualizarNombre'>) {
  const { usuario } = useAuth()
  const [conexion, setConexion] = useState<{ estado: EstadoConexion; mensaje: string }>({ estado: 'conectando', mensaje: '' })
  const manejadores = useRef(eventos)
  useEffect(() => { manejadores.current = eventos })
  useEffect(() => {
    if (!usuario || !idSala) return
    const conexionSala = conectarSala({
      idSala,
      obtenerToken: () => usuario.getIdToken(),
      eventos: {
        alEstado: (estado, mensaje) => setConexion({ estado, mensaje: mensaje ?? '' }),
        alEliminarSala: () => manejadores.current.alEliminarSala?.(),
        alActualizarNombre: nombre => manejadores.current.alActualizarNombre?.(nombre),
      },
    })
    return () => conexionSala.desconectar()
  }, [usuario, idSala])
  return conexion
}
