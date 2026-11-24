import { useParams } from 'react-router-dom'
import { ButtonLink } from '../components/common/Button'
import { Cargando, MensajeError } from '../components/common/Estados'
import { CopiarIdSala } from '../components/common/CopiarIdSala'
import { Tarjeta } from '../components/common/Tarjeta'
import { useSalasPropias } from '../hooks/useSalasPropias'

export function Sala() {
  const { id } = useParams()
  const { salas, error, cargando, reintentar } = useSalasPropias()
  const sala = salas.find(sala => sala.id === id)
  return <section className="mx-auto max-w-3xl px-4 py-12">
    <ButtonLink to="/dashboard" variante="secundario">Volver a mis salas</ButtonLink>
    {cargando ? <div className="mt-6"><Cargando detalle="Estamos abriendo tu sala." /></div>
      : error ? <div className="mt-6"><MensajeError mensaje={error} onReintentar={reintentar} /></div>
        : !sala ? <div role="alert" className="mt-6 rounded-xl bg-error-fondo p-4 text-error">
          No encontramos esta sala entre tus salas propias. Vuelve a Mis salas y revisa su ID.
        </div>
          : <>
            <h1 className="entrada mt-8 break-words">{sala.nombre}</h1>
            <p className="mt-3 text-bosque">Eres administrador de esta sala.</p>
            <Tarjeta className="mt-6">
              <h2>Comparte tu sala</h2>
              <p className="mt-3 mb-4 text-texto-suave">Copia el ID para compartirlo con tus compañeros.</p>
              <CopiarIdSala id={sala.id} />
            </Tarjeta>
          </>}
  </section>
}
