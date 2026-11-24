import { ArrowDown, History } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import type { HistorialChat } from '../../hooks/useHistorialChat'
import { formatearMomento } from '../../services/chat'
import type { Mensaje } from '../../types/chat'
import { Button } from '../common/Button'
import { Cargando, EstadoVacio, MensajeError } from '../common/Estados'

const MARGEN_FINAL = 48

function cuentaNuevos(mensajes: Mensaje[], vistoHasta: string | null) {
  const indice = vistoHasta === null ? -1 : mensajes.findIndex(m => m.id === vistoHasta)
  if (indice < 0) return 0
  return mensajes.slice(indice + 1).filter(m => !m.esPropio).length
}

// US-10: lista de mensajes con desplazamiento inteligente. Si estás al final, baja sola al llegar uno nuevo;
// si estás leyendo mensajes anteriores no te mueve y aparece «Mensajes nuevos». Es una región con foco
// de teclado para poder recorrerla sin ratón (WCAG 2.1.1); los avisos al lector de pantalla van aparte.
// US-11: muestra el historial que entrega la API (cargando, vacío, error) y permite pedir los anteriores
// sin perder el punto de lectura.
export function ListaMensajes({ mensajes, historial }: { mensajes: Mensaje[]; historial: HistorialChat }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const primeroPrevio = useRef<string | undefined>(undefined)
  const alturaPrevia = useRef(0)
  const alFinal = useRef(true)
  const [pegado, setPegado] = useState(true)
  const [vistoHasta, setVistoHasta] = useState<string | null>(null)
  const ultimo = mensajes.at(-1)

  // Mientras estés al final, todo lo que llega cuenta como visto.
  if (pegado && (ultimo?.id ?? null) !== vistoHasta) setVistoHasta(ultimo?.id ?? null)
  const nuevos = pegado ? 0 : cuentaNuevos(mensajes, vistoHasta)

  useLayoutEffect(() => {
    const caja = contenedor.current
    if (!caja) return
    const primero = mensajes[0]?.id
    // Si llegaron mensajes ANTERIORES (se agregaron arriba) mientras lees más arriba, se compensa la altura
    // para que no se salte la lectura. Si estás al final (por ejemplo, al abrir la sala), se baja al último.
    const anteriores = !alFinal.current && primeroPrevio.current !== undefined && primero !== primeroPrevio.current
      && mensajes.some(m => m.id === primeroPrevio.current)
    if (anteriores) caja.scrollTop += caja.scrollHeight - alturaPrevia.current
    else if (alFinal.current || ultimo?.esPropio) caja.scrollTop = caja.scrollHeight
    primeroPrevio.current = primero
    alturaPrevia.current = caja.scrollHeight
  }, [mensajes, ultimo?.esPropio])

  function alDesplazar() {
    const caja = contenedor.current
    if (!caja) return
    const cercaDelFinal = caja.scrollHeight - caja.scrollTop - caja.clientHeight <= MARGEN_FINAL
    alFinal.current = cercaDelFinal
    setPegado(cercaDelFinal)
  }
  function irAlFinal() {
    const caja = contenedor.current
    if (!caja) return
    caja.scrollTop = caja.scrollHeight
    caja.focus()
  }

  async function cargarAnteriores() {
    const { hayMas } = await historial.cargarAnteriores()
    // Si ya no quedan más, el botón desaparece: el foco pasa a la lista para no perderlo.
    if (!hayMas) contenedor.current?.focus()
  }

  return <div>
    {historial.estado === 'listo' && historial.hayMas && <div className="mb-3 flex flex-wrap items-center gap-3">
      <Button variante="secundario" onClick={() => void cargarAnteriores()} aria-disabled={historial.cargandoMas || undefined}>
        <History aria-hidden="true" size={20} />{historial.cargandoMas ? 'Cargando…' : 'Cargar mensajes anteriores'}
      </Button>
      {historial.errorMas && <p role="alert" className="font-bold text-error">{historial.errorMas}</p>}
    </div>}
    <p role="status" className="sr-only">{historial.aviso}</p>
    <div className="relative">
    <div ref={contenedor} role="region" aria-label="Mensajes de la sala" tabIndex={0} onScroll={alDesplazar}
      className="h-[22rem] overflow-y-auto rounded-2xl border border-borde-tarjeta bg-fondo p-3 sm:h-[26rem] lg:h-[30rem]">
      {historial.estado === 'cargando' && mensajes.length === 0 && <Cargando detalle="Estamos trayendo los mensajes de la sala." />}
      {historial.estado === 'error' && <div className="mb-3"><MensajeError mensaje={historial.error} onReintentar={historial.reintentar} /></div>}
      {historial.estado === 'listo' && mensajes.length === 0 && <EstadoVacio mensaje="Aún no hay mensajes en esta sala. Escribe el primero para saludar a tu grupo." />}
      {mensajes.length > 0 && <ol className="space-y-3">
          {mensajes.map(m => <li key={m.id} className={`flex ${m.esPropio ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-2 sm:max-w-[80%] ${m.esPropio ? 'bg-hoja-suave text-bosque' : 'border border-borde-tarjeta bg-papel text-texto'}`}>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <strong className="break-all">{m.esPropio ? 'Tú' : m.autor}</strong>
                <time dateTime={m.creadoEn} className="numeros text-sm text-texto-suave">{formatearMomento(m.creadoEn)}</time>
              </p>
              <p className="whitespace-pre-wrap break-words">{m.texto}</p>
            </div>
          </li>)}
        </ol>}
    </div>
    {nuevos > 0 && <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
      <Button className="pointer-events-auto shadow-papel" onClick={irAlFinal}>
        <ArrowDown aria-hidden="true" size={20} />Mensajes nuevos ({nuevos})
      </Button>
    </div>}
    </div>
  </div>
}
