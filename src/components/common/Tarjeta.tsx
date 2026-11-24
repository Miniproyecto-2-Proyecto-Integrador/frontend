import type { ReactNode } from 'react'

// Superficie de papel: borde cálido y sombra en capas (elevación), sin desenfoque decorativo.
export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`aparecer rounded-3xl border border-borde-tarjeta bg-papel p-6 shadow-papel ${className}`}>
      {children}
    </div>
  )
}
