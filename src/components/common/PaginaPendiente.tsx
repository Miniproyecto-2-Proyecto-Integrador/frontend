export function PaginaPendiente({ titulo }: { titulo: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">{titulo}</h1>
      <p className="mt-4 text-texto-suave">Esta pantalla se implementará en un sprint posterior.</p>
    </section>
  )
}