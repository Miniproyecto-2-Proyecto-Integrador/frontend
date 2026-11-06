import { Cargando, MensajeError, MensajeExito } from '../components/common/Estados'
import { useApiGet } from '../hooks/useApiGet'
import type { PruebasRespuesta } from '../types/prueba'

export function BaseTecnica() {
  const { resultado, reintentar } = useApiGet<PruebasRespuesta>('/api/pruebas')

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

        {resultado.estado === 'exito' && !Array.isArray(resultado.datos.data) && (
          <MensajeError
            mensaje="La respuesta del servidor no tiene el formato esperado."
            onReintentar={reintentar}
          />
        )}

        {resultado.estado === 'exito' &&
          Array.isArray(resultado.datos.data) &&
          resultado.datos.data.length === 0 && (
            <p className="rounded-xl border border-borde bg-white p-4 text-texto-suave">
              La colección «pruebas» no tiene documentos.
            </p>
          )}

        {resultado.estado === 'exito' &&
          Array.isArray(resultado.datos.data) &&
          resultado.datos.data.length > 0 && (
            <>
              <MensajeExito>Datos recibidos desde Firestore a través de la API.</MensajeExito>
              <ul className="space-y-3">
                {resultado.datos.data.map((documento) => (
                  <li
                    key={documento.id}
                    className="rounded-xl border border-borde bg-white p-4 shadow-sm"
                  >
                    <h2 className="text-lg font-bold">{documento.nombre}</h2>
                    <p className="mt-1">{documento.mensaje}</p>
                    <p className="mt-2 text-sm text-texto-suave">
                      Estado: {documento.estado} · ID del documento: {documento.id}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
      </div>
    </section>
  )
}