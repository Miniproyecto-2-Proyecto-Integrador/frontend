// Refresco automático «casi en vivo» de una consulta: cada cierto tiempo mientras la pestaña está visible
// y al volver a ella. No solapa peticiones y no consulta en segundo plano. Devuelve la función para detenerlo.
type Escucha = { addEventListener: (tipo: string, manejador: () => void) => void; removeEventListener: (tipo: string, manejador: () => void) => void }

export function iniciarRefresco({ refrescar, intervaloMs = 20000, documento = document as unknown as Escucha & { visibilityState: string }, ventana = window as unknown as Escucha }: {
  refrescar: () => Promise<void>
  intervaloMs?: number
  documento?: Escucha & { visibilityState: string }
  ventana?: Escucha
}): () => void {
  let enCurso = false
  const lanzar = () => {
    if (enCurso || documento.visibilityState === 'hidden') return
    enCurso = true
    refrescar().catch(() => undefined).finally(() => { enCurso = false })
  }
  const temporizador = setInterval(lanzar, intervaloMs)
  documento.addEventListener('visibilitychange', lanzar)
  ventana.addEventListener('focus', lanzar)
  return () => {
    clearInterval(temporizador)
    documento.removeEventListener('visibilitychange', lanzar)
    ventana.removeEventListener('focus', lanzar)
  }
}
