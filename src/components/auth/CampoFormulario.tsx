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
        className={`min-h-11 w-full rounded-xl border bg-white px-3 py-3 text-base disabled:bg-slate-100 ${error ? 'border-error' : 'border-borde'} ${children ? 'pr-28' : ''}`} />
      {children}
    </div>
    {ayuda && <p id={`${id}-ayuda`} className="mt-2 text-texto-suave">{ayuda}</p>}
    {error && <p id={`${id}-error`} className="mt-2 font-bold text-error">{error}</p>}
  </div>
}
