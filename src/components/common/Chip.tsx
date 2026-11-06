import type { ReactNode } from 'react'

const colores = {
  azul: 'bg-azul-suave text-azul-texto',
  rosa: 'bg-rosa-suave text-acento',
}

export function Chip({
  icono,
  color = 'azul',
  children,
}: {
  icono?: ReactNode
  color?: keyof typeof colores
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${colores[color]}`}
    >
      {icono}
      {children}
    </span>
  )
}