import { ButtonLink } from '../components/common/Button'

export function NoEncontrada() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="font-bold text-acento">Error 404</p>
      <h1 className="mt-2">Página no encontrada</h1>
      <p className="mt-4 text-lg text-texto-suave">La dirección que buscas no existe o fue movida.</p>
      <div className="mt-8">
        <ButtonLink to="/">Ir al inicio</ButtonLink>
      </div>
    </section>
  )
}