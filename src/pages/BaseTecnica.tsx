import { Button } from '../components/common/Button'
import { Cargando, EstadoVacio, MensajeError, MensajeExito } from '../components/common/Estados'
import { Tarjeta } from '../components/common/Tarjeta'
import { useApiGet } from '../hooks/useApiGet'
import type { PruebasRespuesta } from '../types/prueba'

export function BaseTecnica() {
  const { resultado, reintentar } = useApiGet<PruebasRespuesta>('/api/pruebas')

  const documentos =
    resultado.estado === 'exito' && Array.isArray(resultado.datos.data) ? resultado.datos.data : null

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1>Base técnica</h1>
      <p className="mt-2 text-lg text-texto-suave">
        Esta pantalla consulta al servidor (API), que lee la colección «pruebas» de Firestore.
      </p>

      <div className="mt-6 space-y-4">
        {resultado.estado === 'cargando' && (
          <Cargando detalle="Si el servidor estaba en reposo, la primera respuesta puede tardar unos segundos." />
        )}

        {resultado.estado === 'error' && (
          <MensajeError mensaje={resultado.mensaje} onReintentar={reintentar} />
        )}

        {resultado.estado === 'exito' && documentos === null && (
          <MensajeError
            mensaje="La respuesta del servidor no tiene el formato esperado."
            onReintentar={reintentar}
          />
        )}

        {documentos !== null && documentos.length === 0 && (
          <EstadoVacio mensaje="La colección «pruebas» no tiene documentos.">
            <Button variante="secundario" onClick={reintentar}>
              Reintentar
            </Button>
          </EstadoVacio>
        )}

        {documentos !== null && documentos.length > 0 && (
          <>
            <MensajeExito>Datos recibidos desde Firestore a través de la API.</MensajeExito>
            <ul className="space-y-3">
              {documentos.map((documento) => (
                <li key={documento.id}>
                  <Tarjeta>
                    <h2 className="text-xl">{documento.nombre}</h2>
                    <p className="mt-1">{documento.mensaje}</p>
                    <p className="mt-2 text-texto-suave">
                      Estado: {documento.estado} · ID del documento: {documento.id}
                    </p>
                  </Tarjeta>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}