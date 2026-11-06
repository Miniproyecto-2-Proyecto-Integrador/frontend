import { Cargando, MensajeError, MensajeExito } from '../components/common/Estados'
import { useApiGet } from '../hooks/useApiGet'

export function BaseTecnica() {
  const { resultado, reintentar } = useApiGet<unknown>('/api/pruebas')

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Base técnica</h1>
      <p className="mt-2 text-texto-suave">
        Esta pantalla consulta al servidor (API), que lee la colección «pruebas» de Firestore.
      </p>

      <div className="mt-6 space-y-4">
        {resultado.estado === 'cargando' && (
          <Cargando texto="Consultando el servidor… si estaba en reposo, la primera respuesta puede tardar unos segundos." />
        )}

        {resultado.estado === 'error' && (
          <MensajeError mensaje={resultado.mensaje} onReintentar={reintentar} />
        )}

        {resultado.estado === 'exito' && (
          <>
            {Array.isArray(resultado.datos) && resultado.datos.length === 0 ? (
              <p className="rounded-xl border border-borde bg-white p-4 text-texto-suave">
                La colección «pruebas» no tiene documentos.
              </p>
            ) : (
              <>
                <MensajeExito>Datos recibidos desde Firestore a través de la API.</MensajeExito>
                <pre className="overflow-x-auto rounded-xl border border-borde bg-white p-4 text-sm">
                  {JSON.stringify(resultado.datos, null, 2)}
                </pre>
              </>
            )}
          </>
        )}
      </div>
    </section>
  )
}