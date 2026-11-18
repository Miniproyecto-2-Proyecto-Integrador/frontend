import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variante = 'primario' | 'secundario' | 'peligro'

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2 text-base font-bold transition-[color,background-color,border-color,box-shadow,translate] duration-200 ease-out motion-safe:enabled:hover:-translate-y-1 motion-safe:enabled:focus-visible:-translate-y-1 motion-safe:enabled:active:translate-y-0 motion-safe:[a&]:hover:-translate-y-1 motion-safe:[a&]:focus-visible:-translate-y-1 motion-safe:[a&]:active:translate-y-0 enabled:hover:shadow-md [a&]:hover:shadow-md motion-reduce:transition-none disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-600'

const estilos: Record<Variante, string> = {
  primario: 'bg-primario text-white hover:bg-primario-oscuro',
  secundario: 'border-2 border-primario bg-white text-primario hover:bg-azul-claro',
  peligro: 'bg-error text-white hover:bg-red-800',
}

type BotonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }

export function Button({ variante = 'primario', className = '', ...props }: BotonProps) {
  return <button type="button" className={`${base} ${estilos[variante]} ${className}`} {...props} />
}

export function ButtonLink({
  to,
  variante = 'primario',
  className = '',
  onClick,
  children,
  state,
}: {
  to: string
  variante?: Variante
  className?: string
  onClick?: () => void
  children: ReactNode
  state?: unknown
}) {
  return (
    <Link to={to} state={state} onClick={onClick} className={`${base} ${estilos[variante]} ${className}`}>
      {children}
    </Link>
  )
}
