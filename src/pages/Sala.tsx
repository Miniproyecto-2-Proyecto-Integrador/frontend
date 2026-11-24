import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ButtonLink } from '../components/common/Button'
import { CopiarIdSala } from '../components/common/CopiarIdSala'
import { Cargando, MensajeAviso, MensajeError } from '../components/common/Estados'
import { Tarjeta } from '../components/common/Tarjeta'
import { AdministrarSala } from '../components/salas/AdministrarSala'
import { useSala } from '../hooks/useSala'
import { useSalaEnVivo } from '../hooks/useSalaEnVivo'

// US-08: la sala se consulta por ID a la API, sea propia o de otra persona. El rol lo decide el servidor.
export function Sala() {
  const { id } = useParams()
  // Con «key» el estado de la sala (salida, nombre en vivo) no se arrastra al abrir otra sala.
  return <SalaAbierta key={id} id={id} />
}

function SalaAbierta({ id }: { id: string | undefined }) {
  const { sala, error, status, cargando, reintentar } = useSala(id)
  // 400 (ID inválido) y 404 (no existe) no mejoran al reintentar: se explican y se ofrece volver.
  const sinReintento = status === 400 || status === 404
  const navegar = useNavigate()
  const [cambio, setCambio] = useState<{ id: string; nombre: string } | null>(null)
  const esAnfitrion = sala?.rol === 'administrador'
  const nombre = sala && cambio?.id === sala.id ? cambio.nombre : sala?.nombre ?? ''
  const salio = useRef(false)
  // Elimina quien es anfitrión (respuesta de la API) o lo avisa el servidor en tiempo real a quienes están dentro.
  function volverAlPanelPorEliminacion() {
    if (salio.current) return
    salio.current = true
    navegar('/dashboard', { replace: true, state: { avisoSala: { tipo: esAnfitrion ? 'eliminada-propia' : 'eliminada-por-anfitrion', nombre } } })
  }
  const { estado: conexion, mensaje: mensajeConexion } = useSalaEnVivo(sala?.id, {
    alEliminarSala: volverAlPanelPorEliminacion,
    alActualizarNombre: nuevo => { if (sala) setCambio({ id: sala.id, nombre: nuevo }) },
  })
  return <section className="mx-auto max-w-3xl px-4 py-12">
    <ButtonLink to="/dashboard" variante="secundario">Volver a mis salas</ButtonLink>
    {cargando ? <><h1 className="mt-8">Abriendo la sala</h1><div className="mt-6"><Cargando detalle="Estamos abriendo la sala." /></div></>
      : error ? <><h1 className="mt-8">{sinReintento ? 'Sala no disponible' : 'No pudimos abrir la sala'}</h1><div className="mt-6">{sinReintento
        ? <div role="alert" className="rounded-2xl bg-error-fondo p-4 text-error">{error}</div>
        : <MensajeError mensaje={error} onReintentar={reintentar} />}</div></>
        : sala && <>
          <h1 className="entrada mt-8 break-words">{nombre}</h1>
          {conexion === 'sin-conexion' && <div className="mt-4"><MensajeAviso>{mensajeConexion} Si te pierdes un cambio de la sala, recarga la página.</MensajeAviso></div>}
          <p className="mt-3 text-bosque">{esAnfitrion ? 'Eres administrador de esta sala.' : 'Estás en esta sala como participante.'}</p>
          <Tarjeta className="mt-6">
            <h2>{esAnfitrion ? 'Comparte tu sala' : 'ID de la sala'}</h2>
            <p className="mt-3 mb-4 text-texto-suave">
              {esAnfitrion ? 'Copia el ID para compartirlo con tus compañeros.' : 'Puedes copiar el ID para invitar a otras personas.'}
            </p>
            <CopiarIdSala id={sala.id} />
          </Tarjeta>
          {esAnfitrion && <AdministrarSala id={sala.id} nombre={nombre}
            alActualizar={nuevo => setCambio({ id: sala.id, nombre: nuevo })}
            alEliminar={volverAlPanelPorEliminacion} />}
        </>}
  </section>
}
