import type { ReactNode } from 'react'

const colores = {
  hoja: 'bg-hoja-suave text-bosque',
  cafe: 'bg-arena text-acento',
}

export function Chip({
  icono,
  color = 'hoja',
  children,
}: {
  icono?: ReactNode
  color?: keyof typeof colores
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-base font-bold ${colores[color]}`}
    >
      {icono}
      {children}
    </span>
  )
}
