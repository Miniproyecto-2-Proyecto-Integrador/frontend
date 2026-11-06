import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variante = 'primario' | 'secundario'

const base =
  'inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors'

const estilos: Record<Variante, string> = {
  primario: 'bg-primario text-white hover:bg-primario-oscuro',
  secundario: 'border border-primario bg-white text-primario hover:bg-blue-50',
}

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }

export function Button({ variante = 'primario', className = '', ...props }: BotonProps) {
  return <button type="button" className={`${base} ${estilos[variante]} ${className}`} {...props} />
}

export function ButtonLink({
  to,
  variante = 'primario',
  children,
}: {
  to: string
  variante?: Variante
  children: ReactNode
}) {
  return (
    <Link to={to} className={`${base} ${estilos[variante]}`}>
      {children}
    </Link>
  )
}