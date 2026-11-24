import { CircleAlert, CircleCheck, Info, LoaderCircle, Sprout } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button'

// «centrado» (por defecto): bloque centrado con aro giratorio y brote, para cuando se carga una zona entera.
// «pagina»: igual, pero ocupa la altura de la pantalla. «compacto»: franja en línea, dentro de formularios y diálogos.
export function Cargando({ detalle, variante = 'centrado' }: { detalle?: string; variante?: 'centrado' | 'pagina' | 'compacto' }) {
  if (variante === 'compacto') {
    return (
      <div role="status" className="aparecer flex items-start gap-3 rounded-2xl bg-hoja-claro p-4 text-bosque">
        <LoaderCircle aria-hidden="true" size={24} className="shrink-0 text-primario motion-safe:animate-spin" />
        <div>
          <p className="font-bold">Cargando…</p>
          {detalle && <p>{detalle}</p>}
        </div>
      </div>
    )
  }
  return (
    <div role="status" className={`aparecer flex flex-col items-center justify-center gap-4 px-4 text-center ${variante === 'pagina' ? 'min-h-[60dvh] py-12' : 'py-12'}`}>
      <span aria-hidden="true" className="relative grid size-24 place-items-center rounded-full bg-hoja-suave">
        <LoaderCircle size={96} strokeWidth={1.5} className="absolute inset-0 text-primario motion-safe:animate-spin" />
        <Sprout size={36} className="text-primario" />
      </span>
      <p className="font-titulo text-2xl font-extrabold text-bosque">Cargando…</p>
      {detalle && <p className="max-w-md text-pretty text-texto-suave">{detalle}</p>}
    </div>
  )
}

export function MensajeError({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="aparecer flex items-start gap-3 rounded-2xl bg-error-fondo p-4 text-error">
      <CircleAlert aria-hidden="true" size={24} className="shrink-0" />
      <div>
        <p>{mensaje}</p>
        <Button className="mt-3" onClick={onReintentar}>
          Reintentar
        </Button>
      </div>
    </div>
  )
}

// Los avisos de éxito se quitan solos a los 10 s. Mientras el puntero está encima el tiempo se detiene,
// para quien necesite leerlo con calma.
const DURACION_EXITO = 10_000

export function MensajeExito({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true)
  const [pausado, setPausado] = useState(false)
  useEffect(() => {
    if (pausado) return
    const temporizador = setTimeout(() => setVisible(false), DURACION_EXITO)
    return () => clearTimeout(temporizador)
  }, [pausado])
  if (!visible) return null
  return (
    <div role="status" onMouseEnter={() => setPausado(true)} onMouseLeave={() => setPausado(false)}
      className="aparecer flex items-start gap-3 rounded-2xl bg-exito-fondo p-4 text-exito">
      <CircleCheck aria-hidden="true" size={24} className="shrink-0" />
      <p>{children}</p>
    </div>
  )
}

export function MensajeAviso({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="aparecer flex items-start gap-3 rounded-2xl bg-aviso-fondo p-4 text-aviso">
      <Info aria-hidden="true" size={24} className="shrink-0" />
      <p>{children}</p>
    </div>
  )
}

export function EstadoVacio({ mensaje, children }: { mensaje: string; children?: ReactNode }) {
  return (
    <div className="aparecer flex items-start gap-4 rounded-2xl border border-dashed border-borde bg-papel p-5 text-texto-suave">
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-hoja-suave text-primario">
        <Sprout size={22} />
      </span>
      <div>
        <p>{mensaje}</p>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  )
}
