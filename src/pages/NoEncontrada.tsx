import type { CSSProperties } from 'react'
import { Leaf } from 'lucide-react'
import { ButtonLink } from '../components/common/Button'

export function NoEncontrada() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <span aria-hidden="true" className="brisa mx-auto flex size-16 items-center justify-center rounded-full bg-hoja-suave text-primario" style={{ '--t': '4s' } as CSSProperties}>
        <Leaf size={32} className="-rotate-12" />
      </span>
      <p className="entrada mt-5 font-bold text-acento">Error 404</p>
      <h1 className="entrada mt-2" style={{ '--d': '60ms' } as CSSProperties}>Página no encontrada</h1>
      <p className="entrada mt-4 text-lg text-texto-suave" style={{ '--d': '120ms' } as CSSProperties}>La dirección que buscas no existe o fue movida.</p>
      <div className="entrada mt-8" style={{ '--d': '180ms' } as CSSProperties}>
        <ButtonLink to="/">Ir al inicio</ButtonLink>
      </div>
    </section>
  )
}
