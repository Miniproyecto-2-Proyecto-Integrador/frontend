import { CircleAlert, CircleCheck, Info, LoaderCircle, Sprout } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function Cargando({ detalle }: { detalle?: string }) {
  return (
    <div role="status" className="aparecer flex items-start gap-3 rounded-2xl bg-hoja-claro p-4 text-bosque">
      <LoaderCircle
        aria-hidden="true"
        size={24}
        className="shrink-0 text-primario motion-safe:animate-spin"
      />
      <div>
        <p className="font-bold">Cargando…</p>
        {detalle && <p>{detalle}</p>}
      </div>
    </div>
  )
}

export function MensajeError({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="aparecer flex items-start gap-3 rounded-2xl bg-error-fondo p-4 text-error">
      <CircleAlert aria-hidden="true" size={24} className="shrink-0" />
      <div>
        <p>{mensaje}</p>
        <Button className="mt-3" onClick={onReintentar}>
          Reintentar
        </Button>
      </div>
    </div>
  )
}

export function MensajeExito({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="aparecer flex items-start gap-3 rounded-2xl bg-exito-fondo p-4 text-exito">
      <CircleCheck aria-hidden="true" size={24} className="shrink-0" />
      <p>{children}</p>
    </div>
  )
}

export function MensajeAviso({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="aparecer flex items-start gap-3 rounded-2xl bg-aviso-fondo p-4 text-aviso">
      <Info aria-hidden="true" size={24} className="shrink-0" />
      <p>{children}</p>
    </div>
  )
}

export function EstadoVacio({ mensaje, children }: { mensaje: string; children?: ReactNode }) {
  return (
    <div className="aparecer flex items-start gap-4 rounded-2xl border border-dashed border-borde bg-papel p-5 text-texto-suave">
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hoja-suave text-primario">
        <Sprout size={22} />
      </span>
      <div>
        <p>{mensaje}</p>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  )
}
