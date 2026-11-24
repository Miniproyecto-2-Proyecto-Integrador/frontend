import { useEffect, useRef } from 'react'
import { Button } from '../common/Button'
import { Cargando } from '../common/Estados'

// US-07: confirmación crítica. El foco empieza en «Cancelar» y Esc cancela (salvo mientras se elimina).
export function DialogoEliminarSala({ nombre, ocupado, error, cancelar, confirmar }: {
  nombre: string; ocupado: boolean; error: string; cancelar: () => void; confirmar: () => void
}) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const alerta = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const elemento = dialogo.current
    elemento?.showModal()
    elemento?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => elemento?.close()
  }, [])
  useEffect(() => { if (error) alerta.current?.focus() }, [error])

  return <dialog ref={dialogo} aria-labelledby="eliminar-sala-titulo" aria-describedby="eliminar-sala-detalle" aria-busy={ocupado}
    className="m-auto w-[90vw] max-w-lg rounded-3xl border border-borde-tarjeta bg-papel p-6 text-texto shadow-papel backdrop:bg-corteza/55"
    onCancel={evento => { evento.preventDefault(); if (!ocupado) cancelar() }}>
    <h2 id="eliminar-sala-titulo">¿Eliminar esta sala?</h2>
    <div id="eliminar-sala-detalle">
      <p className="mt-3 break-words">Vas a eliminar «{nombre}».</p>
      <p className="mt-3 font-bold">Esta acción no se puede deshacer.</p>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>Se borrará la sala y todo su historial de chat.</li>
        <li>Quienes estén dentro recibirán un aviso y volverán al panel.</li>
      </ul>
    </div>
    {error && <p ref={alerta} tabIndex={-1} role="alert" className="mt-4 rounded-xl bg-error-fondo p-4 text-error">{error}</p>}
    {ocupado && <div className="mt-4"><Cargando variante="compacto" detalle="Estamos eliminando la sala." /></div>}
    <div className="mt-6 flex flex-wrap gap-3">
      <Button variante="secundario" disabled={ocupado} onClick={cancelar}>Cancelar</Button>
      <Button variante="peligro" disabled={ocupado} onClick={confirmar}>{ocupado ? 'Eliminando…' : 'Sí, eliminar sala'}</Button>
    </div>
  </dialog>
}
