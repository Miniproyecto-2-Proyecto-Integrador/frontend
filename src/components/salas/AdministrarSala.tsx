import { Pencil, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../context/auth'
import { actualizarSala, eliminarSala, validarNombreSala } from '../../services/api/salas'
import { CampoFormulario } from '../auth/CampoFormulario'
import { Button } from '../common/Button'
import { Cargando, MensajeExito } from '../common/Estados'
import { Tarjeta } from '../common/Tarjeta'
import { DialogoEliminarSala } from './DialogoEliminarSala'

// US-07: solo el anfitrión ve estas acciones; la API responde 403 a cualquier otra persona.
export function AdministrarSala({ id, nombre, alActualizar, alEliminar }: {
  id: string; nombre: string; alActualizar: (nombre: string) => void; alEliminar: () => void
}) {
  const { usuario } = useAuth()
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(nombre)
  const [errorNombre, setErrorNombre] = useState('')
  const [errorEdicion, setErrorEdicion] = useState('')
  const [exito, setExito] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')
  const bloqueo = useRef(false)
  const botonEditar = useRef<HTMLButtonElement>(null)
  const botonEliminar = useRef<HTMLButtonElement>(null)
  const alerta = useRef<HTMLDivElement>(null)
  const formulario = useRef<HTMLFormElement>(null)
  const ocupado = guardando || eliminando

  function abrirEdicion() {
    setValor(nombre); setErrorNombre(''); setErrorEdicion(''); setExito(''); setEditando(true)
    requestAnimationFrame(() => formulario.current?.querySelector<HTMLInputElement>('#editar-nombre-sala')?.select())
  }
  function cancelarEdicion() {
    if (bloqueo.current) return
    setEditando(false); setErrorNombre(''); setErrorEdicion('')
    requestAnimationFrame(() => botonEditar.current?.focus())
  }
  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!usuario || bloqueo.current) return
    const validacion = validarNombreSala(valor)
    setErrorNombre(validacion); setErrorEdicion('')
    if (validacion) { formulario.current?.querySelector<HTMLInputElement>('#editar-nombre-sala')?.focus(); return }
    bloqueo.current = true
    setGuardando(true)
    try {
      const sala = await actualizarSala(usuario, id, valor)
      alActualizar(sala.nombre)
      setEditando(false)
      setExito('El nombre de la sala se actualizó.')
      requestAnimationFrame(() => botonEditar.current?.focus())
    } catch (fallo) {
      setErrorEdicion(fallo instanceof Error ? fallo.message : 'No pudimos actualizar la sala. Intenta de nuevo.')
      requestAnimationFrame(() => alerta.current?.focus())
    } finally {
      bloqueo.current = false
      setGuardando(false)
    }
  }
  function cancelarEliminar() {
    if (bloqueo.current) return
    setConfirmando(false); setErrorEliminar('')
    requestAnimationFrame(() => botonEliminar.current?.focus())
  }
  async function confirmarEliminar() {
    if (!usuario || bloqueo.current) return
    bloqueo.current = true
    setEliminando(true); setErrorEliminar('')
    try {
      await eliminarSala(usuario, id)
      alEliminar()
    } catch (fallo) {
      setErrorEliminar(fallo instanceof Error ? fallo.message : 'No pudimos eliminar la sala. Intenta de nuevo.')
    } finally {
      bloqueo.current = false
      setEliminando(false)
    }
  }

  return <Tarjeta>
    <h2>Administrar sala</h2>
    <p className="mt-3 text-texto-suave">Solo tú, como anfitrión, puedes cambiar el nombre o eliminar la sala.</p>
    {exito && <div className="mt-4"><MensajeExito>{exito}</MensajeExito></div>}
    {editando && <form ref={formulario} aria-labelledby="editar-nombre-titulo" noValidate aria-busy={guardando} className="mt-5 space-y-4"
      onKeyDown={evento => { if (evento.key === 'Escape') { evento.preventDefault(); cancelarEdicion() } }} onSubmit={evento => void guardar(evento)}>
      <h3 id="editar-nombre-titulo" className="text-xl font-bold">Editar nombre</h3>
      <CampoFormulario id="editar-nombre-sala" etiqueta="Nombre de la sala" value={valor} required disabled={guardando}
        onChange={evento => { setValor(evento.target.value); setErrorNombre('') }} error={errorNombre}
        ayuda="Entre 1 y 80 caracteres. Pulsa Esc para cancelar." />
      {errorEdicion && <div ref={alerta} tabIndex={-1} role="alert" className="rounded-2xl bg-error-fondo p-4 text-error">{errorEdicion}</div>}
      {guardando && <Cargando detalle="Estamos guardando el nombre." />}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Button>
        <Button variante="secundario" disabled={guardando} onClick={cancelarEdicion}>Cancelar</Button>
      </div>
    </form>}
    <div className="mt-5 flex flex-wrap gap-3">
      <Button ref={botonEditar} variante="secundario" disabled={ocupado || editando} aria-expanded={editando} onClick={abrirEdicion}>
        <Pencil aria-hidden="true" size={18} /> Editar nombre
      </Button>
      <Button ref={botonEliminar} variante="peligro" disabled={ocupado} aria-haspopup="dialog"
        onClick={() => { setErrorEliminar(''); setConfirmando(true) }}>
        <Trash2 aria-hidden="true" size={18} /> Eliminar sala
      </Button>
    </div>
    {confirmando && <DialogoEliminarSala nombre={nombre} ocupado={eliminando} error={errorEliminar}
      cancelar={cancelarEliminar} confirmar={() => void confirmarEliminar()} />}
  </Tarjeta>
}
