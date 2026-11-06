import type { ReactNode } from 'react'
import { Button } from './Button'

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <p role="status" className="rounded-xl border border-borde bg-white p-4 text-texto-suave">
      {texto}
    </p>
  )
}

export function MensajeError({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
      <p>{mensaje}</p>
      <Button className="mt-3" onClick={onReintentar}>
        Reintentar
      </Button>
    </div>
  )
}

export function MensajeExito({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="rounded-xl border border-green-300 bg-green-50 p-4 text-green-900">
      {children}
    </p>
  )
}