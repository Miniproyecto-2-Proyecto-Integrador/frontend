import type { ComponentPropsWithRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variante = 'primario' | 'secundario' | 'peligro'

// Solo se transiciona lo que cambia (nunca «all»). Presión: scale(0.96). Elevación: 2px.
// Con «reducir movimiento» desaparecen el desplazamiento y la escala; el color y la sombra siguen informando.
const base =
  'group/boton inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-6 py-2 text-base font-bold transition-[color,background-color,border-color,box-shadow,translate,scale] duration-200 ease-(--ease-salida) motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:scale-[0.96] motion-safe:[a&]:hover:-translate-y-0.5 motion-safe:[a&]:active:scale-[0.96] motion-reduce:transition-none disabled:cursor-not-allowed disabled:bg-deshabilitado disabled:text-texto-suave disabled:shadow-none'

const estilos: Record<Variante, string> = {
  primario: 'bg-primario text-white shadow-boton hover:bg-primario-oscuro',
  secundario: 'border-2 border-primario bg-papel text-primario hover:bg-hoja-claro disabled:border-deshabilitado',
  peligro: 'bg-error text-white shadow-boton hover:bg-red-800',
}

type BotonProps = ComponentPropsWithRef<'button'> & { variante?: Variante }

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
