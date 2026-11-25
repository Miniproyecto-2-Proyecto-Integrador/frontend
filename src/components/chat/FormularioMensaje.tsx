import { SendHorizontal } from 'lucide-react'
import { useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { validarTextoMensaje } from '../../services/chat'
import { Button } from '../common/Button'

// US-10: Enter envía y Mayús + Enter agrega una línea. Un mensaje vacío no se envía; si falla el envío
// el texto se conserva para reintentar. Los errores se anuncian y quedan asociados al campo.
export function FormularioMensaje({ enviar }: { enviar: (texto: string) => Promise<unknown> }) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bloqueo = useRef(false)
  const campo = useRef<HTMLTextAreaElement>(null)

  async function enviarTexto() {
    if (bloqueo.current) return
    const invalido = validarTextoMensaje(texto)
    setError(invalido)
    if (invalido) { campo.current?.focus(); return }
    bloqueo.current = true
    setEnviando(true)
    try {
      await enviar(texto)
      setTexto('')
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No pudimos enviar el mensaje. Intenta de nuevo.')
    } finally {
      bloqueo.current = false
      setEnviando(false)
      campo.current?.focus()
    }
  }
  function alEnviar(evento: FormEvent<HTMLFormElement>) { evento.preventDefault(); void enviarTexto() }
  function alTeclear(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.nativeEvent.isComposing) { evento.preventDefault(); void enviarTexto() }
  }

  return <form onSubmit={alEnviar} noValidate className="border-t border-borde-tarjeta p-3">
    <label htmlFor="mensaje-chat" className="sr-only">Escribe un mensaje</label>
    <div className="flex items-end gap-2">
      <textarea id="mensaje-chat" ref={campo} rows={2} value={texto} onChange={e => { setTexto(e.target.value); if (error) setError('') }} onKeyDown={alTeclear}
        aria-invalid={error ? true : undefined} aria-describedby={error ? 'mensaje-chat-ayuda mensaje-chat-error' : 'mensaje-chat-ayuda'}
        placeholder="Escribe un mensaje"
        className={`field-sizing-content max-h-40 min-h-12 w-full resize-none rounded-2xl border bg-papel px-4 py-3 text-base placeholder:text-texto-suave transition-[border-color] duration-200 hover:border-primario focus:border-primario motion-reduce:transition-none ${error ? 'border-2 border-error' : 'border-borde'}`} />
      <Button type="submit" aria-disabled={enviando || undefined} className="size-12 shrink-0 rounded-full! px-0!">
        <SendHorizontal aria-hidden="true" size={20} /><span className="sr-only">{enviando ? 'Enviando…' : 'Enviar'}</span>
      </Button>
    </div>
    <p id="mensaje-chat-ayuda" className="mt-2 px-1 text-sm text-texto-suave max-sm:sr-only">Enter envía el mensaje. Mayús + Enter agrega una línea nueva.</p>
    <p id="mensaje-chat-error" role="alert" className={error ? 'mt-2 px-1 font-bold text-error' : 'sr-only'}>{error}</p>
  </form>
}
