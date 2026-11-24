import { useEffect, useState } from 'react'
import { useAuth } from '../context/auth'
import { ApiError } from '../services/api/apiClient'
import { obtenerSala } from '../services/api/salas'
import type { SalaAcceso } from '../services/api/salas'

type Resultado = { uid: string; id: string; intento: number; sala: SalaAcceso | null; error: string; status?: number }

// US-08: consulta la sala por ID a la API (propia o ajena). Descarta respuestas de otra sala o cuenta.
export function useSala(id: string | undefined) {
  const { usuario } = useAuth()
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  useEffect(() => {
    if (!usuario || id === undefined) return
    let activo = true
    obtenerSala(usuario, id).then(sala => {
      if (activo) setResultado({ uid: usuario.uid, id, intento, sala, error: '' })
    }).catch(error => {
      if (activo) setResultado({
        uid: usuario.uid, id, intento, sala: null,
        error: error instanceof Error ? error.message : 'No pudimos abrir la sala.',
        status: error instanceof ApiError ? error.status : undefined,
      })
    })
    return () => { activo = false }
  }, [usuario, id, intento])
  const actual = resultado?.uid === usuario?.uid && resultado?.id === id && resultado?.intento === intento ? resultado : null
  return {
    sala: actual?.sala ?? null, error: actual?.error ?? '', status: actual?.status,
    cargando: !actual, reintentar: () => setIntento(valor => valor + 1),
  }
}
