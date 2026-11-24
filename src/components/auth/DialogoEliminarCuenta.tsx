import { useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { Cargando } from '../common/Estados';

export function DialogoEliminarCuenta({ ocupado, error, cancelar, confirmar }: {
  ocupado: boolean; error: string; cancelar: () => void; confirmar: () => void
}) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const alerta = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    const elemento = dialogo.current
    elemento?.showModal()
    // El foco empieza en «Cancelar» para evitar borrar la cuenta por error.
    elemento?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => elemento?.close()
  }, [])
  useEffect(() => { if (error) alerta.current?.focus() }, [error])

  return <dialog ref={dialogo} aria-labelledby="eliminar-cuenta-titulo" aria-describedby="eliminar-cuenta-detalle"
    aria-busy={ocupado} className="m-auto w-[90vw] max-w-lg rounded-3xl border border-borde-tarjeta bg-papel p-6 text-texto shadow-papel backdrop:bg-corteza/55"
    onCancel={evento => { evento.preventDefault(); if (!ocupado) cancelar() }}>
    <h2 id="eliminar-cuenta-titulo">¿Deseas eliminar tu cuenta?</h2>
    <div id="eliminar-cuenta-detalle">
      <p className="mt-3 font-bold">Esta acción no se puede deshacer.</p>
      <ul className="mt-3 list-disc space-y-1 pl-6">
        <li>Se borrará tu perfil y tu nombre de usuario quedará libre.</li>
        <li>Se borrarán las salas que creaste y sus mensajes.</li>
        <li>Tus mensajes en salas de otras personas se conservarán como «Cuenta eliminada».</li>
      </ul>
    </div>
    {error && <p ref={alerta} tabIndex={-1} role="alert" className="mt-4 rounded-xl bg-error-fondo p-4 text-error">{error}</p>}
    {ocupado && <div className="mt-4"><Cargando detalle="Estamos eliminando tu cuenta." /></div>}
    <div className="mt-6 flex flex-wrap gap-3">
      <Button variante="secundario" disabled={ocupado} onClick={cancelar}>Cancelar</Button>
      <Button variante="peligro" disabled={ocupado} onClick={confirmar}>{ocupado ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}</Button>
    </div>
  </dialog>
}