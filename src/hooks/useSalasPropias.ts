import { useEffect, useState } from 'react'
import { useAuth } from '../context/auth'
import { listarSalas } from '../services/api/salas'
import type { SalaPropia } from '../services/api/salas'

export function useSalasPropias() {
  const { usuario } = useAuth()
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<{ uid: string; intento: number; salas: SalaPropia[]; error: string } | null>(null)
  useEffect(() => {
    if (!usuario) return
    let activo = true
    listarSalas(usuario).then(salas => {
      if (activo) setResultado({ uid: usuario.uid, intento, salas, error: '' })
    }).catch(error => {
      if (activo) setResultado({ uid: usuario.uid, intento, salas: [], error: error instanceof Error ? error.message : 'No pudimos cargar tus salas.' })
    })
    return () => { activo = false }
  }, [usuario, intento])
  const actual = resultado?.uid === usuario?.uid && resultado?.intento === intento ? resultado : null
  return { salas: actual?.salas ?? [], error: actual?.error ?? '', cargando: !actual, reintentar: () => setIntento(valor => valor + 1) }
}
