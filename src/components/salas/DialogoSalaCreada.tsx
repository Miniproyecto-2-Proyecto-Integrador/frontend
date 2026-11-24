import { CircleCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '../common/Button'
import { CopiarIdSala } from '../common/CopiarIdSala'

// Tras crear una sala: entrar ya o dejarla creada. El foco empieza en «Entrar ahora»; Esc equivale a «Solo crear la sala».
export function DialogoSalaCreada({ id, nombre, entrar, cerrar }: {
  id: string; nombre: string; entrar: () => void; cerrar: () => void
}) {
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const elemento = dialogo.current
    elemento?.showModal()
    elemento?.querySelector<HTMLButtonElement>('[data-inicial]')?.focus()
    return () => elemento?.close()
  }, [])

  return <dialog ref={dialogo} aria-labelledby="sala-creada-titulo" aria-describedby="sala-creada-detalle"
    className="m-auto w-[90vw] max-w-lg rounded-3xl border border-borde-tarjeta bg-papel p-6 text-texto shadow-papel backdrop:bg-corteza/55"
    onCancel={evento => { evento.preventDefault(); cerrar() }}>
    <div className="flex items-start gap-4">
      <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-hoja-suave text-primario"><CircleCheck size={26} /></span>
      <div className="min-w-0">
        <h2 id="sala-creada-titulo">¡Tu sala está lista!</h2>
        <div id="sala-creada-detalle">
          <p className="mt-2 break-words">Creamos «{nombre}». ¿Quieres entrar ahora o solo dejarla creada?</p>
          <p className="mt-2 text-texto-suave">Comparte su ID para que otras personas se unan.</p>
        </div>
      </div>
    </div>
    <div className="mt-4"><CopiarIdSala id={id} variante="compacto" /></div>
    <div className="mt-6 flex flex-wrap gap-3">
      <Button data-inicial onClick={entrar}>Entrar ahora</Button>
      <Button variante="secundario" onClick={cerrar}>Solo crear la sala</Button>
    </div>
  </dialog>
}
