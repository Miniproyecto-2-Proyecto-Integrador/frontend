import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/auth'
import { listarSalas } from '../services/api/salas'
import type { SalaPropia } from '../services/api/salas'
import { iniciarRefresco } from '../services/refrescoPeriodico'

type Resultado = { uid: string; intento: number; salas: SalaPropia[]; error: string }

export function mismasSalas(a: SalaPropia[], b: SalaPropia[]) {
  return a.length === b.length && a.every((sala, i) => sala.id === b[i].id && sala.nombre === b[i].nombre && sala.rol === b[i].rol)
}

export function useSalasPropias() {
  const { usuario } = useAuth()
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [aviso, setAviso] = useState('')
  const ultimo = useRef<Resultado | null>(null)
  const publicar = (nuevo: Resultado) => { ultimo.current = nuevo; setResultado(nuevo) }

  useEffect(() => {
    if (!usuario) return
    let activo = true
    listarSalas(usuario).then(salas => {
      if (activo) publicar({ uid: usuario.uid, intento, salas, error: '' })
    }).catch(error => {
      if (activo) publicar({ uid: usuario.uid, intento, salas: [], error: error instanceof Error ? error.message : 'No pudimos cargar tus salas.' })
    })
    return () => { activo = false }
  }, [usuario, intento])

  // Refresco silencioso: sin pantalla de carga; un fallo puntual conserva la lista que ya se ve.
  useEffect(() => {
    if (!usuario) return
    let activo = true
    const detener = iniciarRefresco({
      refrescar: async () => {
        const salas = await listarSalas(usuario)
        const previo = ultimo.current
        if (!activo || !previo || previo.uid !== usuario.uid || previo.intento !== intento) return
        if (previo.error) { publicar({ ...previo, salas, error: '' }); return }
        if (mismasSalas(previo.salas, salas)) return
        publicar({ ...previo, salas })
        setAviso('La lista de salas se actualizó.')
      },
    })
    return () => { activo = false; detener() }
  }, [usuario, intento])

  const actual = resultado?.uid === usuario?.uid && resultado?.intento === intento ? resultado : null
  return { salas: actual?.salas ?? [], error: actual?.error ?? '', cargando: !actual, aviso, reintentar: () => setIntento(valor => valor + 1) }
}
