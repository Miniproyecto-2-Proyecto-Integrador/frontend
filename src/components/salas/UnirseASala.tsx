import { DoorOpen } from 'lucide-react'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { obtenerSala, validarIdSala } from '../../services/api/salas'
import { CampoFormulario } from '../auth/CampoFormulario'
import { Button } from '../common/Button'
import { Cargando } from '../common/Estados'
import { Tarjeta } from '../common/Tarjeta'

// US-08: unirse a una sala con su ID. La API confirma que existe; solo entonces se abre /salas/:id.
export function UnirseASala({ deshabilitado = false }: { deshabilitado?: boolean }) {
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const [id, setId] = useState('')
  const [errorId, setErrorId] = useState('')
  const [errorApi, setErrorApi] = useState('')
  const [uniendo, setUniendo] = useState(false)
  const bloqueo = useRef(false)
  const alerta = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLFormElement>(null)
  const ocupado = uniendo || deshabilitado

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!usuario || bloqueo.current || ocupado) return
    const validacion = validarIdSala(id)
    setErrorId(validacion)
    setErrorApi('')
    if (validacion) { campo.current?.querySelector<HTMLInputElement>('#unirse-id-sala')?.focus(); return }
    bloqueo.current = true
    setUniendo(true)
    try {
      const sala = await obtenerSala(usuario, id)
      navegar(`/salas/${encodeURIComponent(sala.id)}`)
    } catch (fallo) {
      setErrorApi(fallo instanceof Error ? fallo.message : 'No pudimos abrir la sala. Intenta de nuevo.')
      requestAnimationFrame(() => alerta.current?.focus())
    } finally {
      bloqueo.current = false
      setUniendo(false)
    }
  }

  return <Tarjeta>
    <div className="flex items-start gap-3">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-arena text-acento"><DoorOpen size={20} /></span>
      <div>
        <h2 id="unirse-titulo">Unirme a una sala</h2>
        <p className="mt-1 text-texto-suave">Pega el ID que te compartió tu compañero o compañera.</p>
      </div>
    </div>
    <form ref={campo} aria-labelledby="unirse-titulo" className="mt-5 space-y-4" noValidate aria-busy={uniendo} onSubmit={evento => void enviar(evento)}>
      <CampoFormulario id="unirse-id-sala" etiqueta="ID de la sala" value={id} autoComplete="off" autoCapitalize="none" spellCheck={false}
        onChange={evento => { setId(evento.target.value); setErrorId('') }} error={errorId}
        ayuda="8 caracteres entre letras, números, guion o guion bajo. Los espacios al inicio o al final se ignoran."
        required disabled={ocupado} />
      {errorApi && <div ref={alerta} tabIndex={-1} role="alert" className="rounded-2xl bg-error-fondo p-4 text-error">{errorApi}</div>}
      {uniendo && <Cargando detalle="Estamos buscando la sala." />}
      <Button type="submit" disabled={ocupado}>{uniendo ? 'Buscando sala…' : 'Unirme a la sala'}</Button>
    </form>
  </Tarjeta>
}
