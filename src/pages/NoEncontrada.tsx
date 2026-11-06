import { ButtonLink } from '../components/common/Button'

export function NoEncontrada() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-sm font-semibold text-acento">Error 404</p>
      <h1 className="mt-2 text-3xl font-bold">Página no encontrada</h1>
      <p className="mt-4 text-texto-suave">La dirección que buscas no existe o fue movida.</p>
      <div className="mt-8">
        <ButtonLink to="/">Volver al inicio</ButtonLink>
      </div>
    </section>
  )
}