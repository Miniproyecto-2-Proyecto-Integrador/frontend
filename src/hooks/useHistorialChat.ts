import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/auth'
import { obtenerMensajes } from '../services/api/mensajes'
import type { EstadoConexion } from '../services/realtime/salaTiempoReal'
import type { Mensaje } from '../types/chat'

export type HistorialChat = {
  estado: 'cargando' | 'listo' | 'error'
  error: string
  hayMas: boolean
  cargandoMas: boolean
  errorMas: string
  aviso: string
  reintentar: () => void
  cargarAnteriores: () => Promise<{ hayMas: boolean }>
}
type Carga = { clave: string; error: string; hayMas: boolean; cursor: string | null }

const mensajeError = (fallo: unknown) => fallo instanceof Error ? fallo.message : 'No pudimos cargar los mensajes. Intenta de nuevo.'

// US-11: pide el historial a la API (los últimos mensajes) al abrir la sala y los anteriores a demanda.
// Los mensajes entran por «incorporar», que los une sin duplicar con los que llegan en vivo.
// Si se pierde y vuelve la conexión, se piden de nuevo los últimos para no dejar huecos.
export function useHistorialChat(idSala: string | undefined, conexion: EstadoConexion, incorporar: (mensajes: Mensaje[]) => void): HistorialChat {
  const { usuario } = useAuth()
  const [intento, setIntento] = useState(0)
  const [carga, setCarga] = useState<Carga | null>(null)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [errorMas, setErrorMas] = useState('')
  const [aviso, setAviso] = useState('')
  const bloqueo = useRef(false)
  const huboCorte = useRef(false)
  const alIncorporar = useRef(incorporar)
  useEffect(() => { alIncorporar.current = incorporar })
  const clave = usuario && idSala ? `${usuario.uid}:${idSala}:${intento}` : ''

  useEffect(() => {
    if (!usuario || !idSala) return
    let activo = true
    obtenerMensajes(usuario, idSala).then(pagina => {
      if (!activo) return
      alIncorporar.current(pagina.mensajes)
      setCarga({ clave, error: '', hayMas: pagina.hayMas, cursor: pagina.siguienteCursor })
    }).catch(fallo => {
      if (activo) setCarga({ clave, error: mensajeError(fallo), hayMas: false, cursor: null })
    })
    return () => { activo = false }
  }, [usuario, idSala, clave])

  // Recuperación tras una desconexión: se traen los últimos mensajes sin tocar la paginación.
  useEffect(() => {
    if (conexion === 'sin-conexion') { huboCorte.current = true; return }
    if (conexion !== 'conectada' || !huboCorte.current || !usuario || !idSala) return
    huboCorte.current = false
    obtenerMensajes(usuario, idSala).then(pagina => alIncorporar.current(pagina.mensajes)).catch(() => undefined)
  }, [conexion, usuario, idSala])

  const actual = carga?.clave === clave ? carga : null
  const cursor = actual?.cursor ?? null
  const cargarAnteriores = useCallback(async () => {
    if (!usuario || !idSala || !cursor || bloqueo.current) return { hayMas: true }
    bloqueo.current = true
    setCargandoMas(true); setErrorMas(''); setAviso('')
    try {
      const pagina = await obtenerMensajes(usuario, idSala, { antes: cursor })
      alIncorporar.current(pagina.mensajes)
      setCarga({ clave, error: '', hayMas: pagina.hayMas, cursor: pagina.siguienteCursor })
      setAviso(pagina.mensajes.length === 1 ? 'Se cargó 1 mensaje anterior.' : `Se cargaron ${pagina.mensajes.length} mensajes anteriores.`)
      return { hayMas: pagina.hayMas }
    } catch (fallo) {
      setErrorMas(mensajeError(fallo))
      return { hayMas: true }
    } finally {
      bloqueo.current = false
      setCargandoMas(false)
    }
  }, [usuario, idSala, cursor, clave])

  return {
    estado: !actual ? 'cargando' : actual.error ? 'error' : 'listo',
    error: actual?.error ?? '', hayMas: actual?.hayMas ?? false, cargandoMas, errorMas, aviso,
    reintentar: () => setIntento(valor => valor + 1), cargarAnteriores,
  }
}
