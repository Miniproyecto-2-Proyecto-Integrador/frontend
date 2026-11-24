import type { Anuncio } from '../../hooks/useSalaEnVivo'

// US-10 · WCAG 4.1.3: mensajes nuevos, entradas y salidas se anuncian sin mover el foco.
// Es una región oculta a la vista: cada aviso nuevo se agrega como párrafo y el lector lo lee.
export function AnunciosSala({ anuncios }: { anuncios: Anuncio[] }) {
  return <div role="status" aria-live="polite" aria-atomic="false" className="sr-only">
    {anuncios.map(anuncio => <p key={anuncio.clave}>{anuncio.texto}</p>)}
  </div>
}
