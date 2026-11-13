import { useEffect, useRef } from 'react'
import { Button } from '../common/Button'
import { Cargando } from '../common/Estados'

export function DialogoCerrarSesion({ ocupado, error, cancelar, confirmar }: {
  ocupado: boolean; error: string; cancelar: () => void; confirmar: () => void
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

  return <dialog ref={dialogo} aria-labelledby="cerrar-sesion-titulo" aria-describedby="cerrar-sesion-detalle"
    aria-busy={ocupado} className="m-auto w-[90vw] max-w-lg rounded-[28px] border border-borde-tarjeta bg-white p-6 text-texto shadow-xl backdrop:bg-slate-900/40"
    onCancel={evento => { evento.preventDefault(); if (!ocupado) cancelar() }}>
    <h2 id="cerrar-sesion-titulo">¿Deseas cerrar sesión?</h2>
    <p id="cerrar-sesion-detalle" className="mt-3">Tendrás que iniciar sesión de nuevo para acceder a tu Panel.</p>
    {error && <p ref={alerta} tabIndex={-1} role="alert" className="mt-4 rounded-xl bg-error-fondo p-4 text-error">{error}</p>}
    {ocupado && <div className="mt-4"><Cargando detalle="Estamos cerrando tu sesión." /></div>}
    <div className="mt-6 flex flex-wrap gap-3">
      <Button variante="secundario" disabled={ocupado} onClick={cancelar}>Cancelar</Button>
      <Button disabled={ocupado} onClick={confirmar}>{ocupado ? 'Cerrando sesión…' : 'Cerrar sesión'}</Button>
    </div>
  </dialog>
}
