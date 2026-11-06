import type { ReactNode } from 'react'

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[28px] border border-borde-tarjeta bg-white/85 p-6 shadow-lg shadow-acento/10 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  )
}