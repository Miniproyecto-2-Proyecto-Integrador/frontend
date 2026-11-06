import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './Button'

export function Cargando({ detalle }: { detalle?: string }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl bg-azul-claro p-4 text-azul-texto">
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
    <div role="alert" className="flex items-start gap-3 rounded-xl bg-error-fondo p-4 text-error">
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
    <div role="status" className="flex items-start gap-3 rounded-xl bg-exito-fondo p-4 text-exito">
      <CircleCheck aria-hidden="true" size={24} className="shrink-0" />
      <p>{children}</p>
    </div>
  )
}

export function EstadoVacio({ mensaje, children }: { mensaje: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-borde-tarjeta bg-white p-4 text-texto-suave">
      <p>{mensaje}</p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  )
}