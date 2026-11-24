import type { InputHTMLAttributes, ReactNode } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string; etiqueta: string; error?: string; ayuda?: string; children?: ReactNode
}

export function CampoFormulario({ id, etiqueta, error, ayuda, children, ...props }: Props) {
  const descripcion = [ayuda ? `${id}-ayuda` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ')
  return <div>
    <label htmlFor={id} className="mb-2 block font-bold">{etiqueta}</label>
    <div className="relative">
      <input {...props} id={id} aria-invalid={error ? true : undefined} aria-describedby={descripcion || undefined}
        className={`min-h-11 w-full rounded-xl border bg-papel px-3 py-3 text-base transition-[border-color,box-shadow] duration-200 ease-(--ease-salida) hover:border-primario focus:border-primario motion-reduce:transition-none disabled:bg-deshabilitado disabled:text-texto-suave ${error ? 'border-error border-2' : 'border-borde'} ${children ? 'pr-28' : ''}`} />
      {children}
    </div>
    {ayuda && <p id={`${id}-ayuda`} className="mt-2 text-texto-suave">{ayuda}</p>}
    {error && <p id={`${id}-error`} className="mt-2 font-bold text-error">{error}</p>}
  </div>
}
