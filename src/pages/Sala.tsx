import { useParams } from 'react-router-dom'
import { ButtonLink } from '../components/common/Button'
import { CopiarIdSala } from '../components/common/CopiarIdSala'
import { Cargando, MensajeError } from '../components/common/Estados'
import { Tarjeta } from '../components/common/Tarjeta'
import { useSala } from '../hooks/useSala'

// US-08: la sala se consulta por ID a la API, sea propia o de otra persona. El rol lo decide el servidor.
export function Sala() {
  const { id } = useParams()
  const { sala, error, status, cargando, reintentar } = useSala(id)
  // 400 (ID inválido) y 404 (no existe) no mejoran al reintentar: se explican y se ofrece volver.
  const sinReintento = status === 400 || status === 404
  const esAnfitrion = sala?.rol === 'administrador'
  return <section className="mx-auto max-w-3xl px-4 py-12">
    <ButtonLink to="/dashboard" variante="secundario">Volver a mis salas</ButtonLink>
    {cargando ? <><h1 className="mt-8">Abriendo la sala</h1><div className="mt-6"><Cargando detalle="Estamos abriendo la sala." /></div></>
      : error ? <><h1 className="mt-8">{sinReintento ? 'Sala no disponible' : 'No pudimos abrir la sala'}</h1><div className="mt-6">{sinReintento
        ? <div role="alert" className="rounded-2xl bg-error-fondo p-4 text-error">{error}</div>
        : <MensajeError mensaje={error} onReintentar={reintentar} />}</div></>
        : sala && <>
          <h1 className="entrada mt-8 break-words">{sala.nombre}</h1>
          <p className="mt-3 text-bosque">{esAnfitrion ? 'Eres administrador de esta sala.' : 'Estás en esta sala como participante.'}</p>
          <Tarjeta className="mt-6">
            <h2>{esAnfitrion ? 'Comparte tu sala' : 'ID de la sala'}</h2>
            <p className="mt-3 mb-4 text-texto-suave">
              {esAnfitrion ? 'Copia el ID para compartirlo con tus compañeros.' : 'Puedes copiar el ID para invitar a otras personas.'}
            </p>
            <CopiarIdSala id={sala.id} />
          </Tarjeta>
        </>}
  </section>
}
