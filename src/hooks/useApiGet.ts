import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiGet } from '../services/api/apiClient'

type Resultado<T> =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'exito'; datos: T }

export function useApiGet<T>(path: string) {
  const [resultado, setResultado] = useState<Resultado<T>>({ estado: 'cargando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    apiGet<T>(path)
      .then((datos) => {
        if (activo) setResultado({ estado: 'exito', datos })
      })
      .catch((e: unknown) => {
        if (activo) {
          setResultado({
            estado: 'error',
            mensaje: e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.',
          })
        }
      })
    return () => {
      activo = false
    }
  }, [path, intento])

  const reintentar = useCallback(() => {
    setResultado({ estado: 'cargando' })
    setIntento((n) => n + 1)
  }, [])

  return { resultado, reintentar }
}