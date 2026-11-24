import { useRef, useState } from 'react'
import { Leaf, Plus } from 'lucide-react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { RequierePerfil } from '../components/auth/RequierePerfil'
import { AvatarUsuario } from '../components/common/AvatarUsuario'
import { Cargando, EstadoVacio, MensajeAviso, MensajeError, MensajeExito } from '../components/common/Estados'
import { Button, ButtonLink } from '../components/common/Button'
import { Tarjeta } from '../components/common/Tarjeta'
import { CampoFormulario } from '../components/auth/CampoFormulario'
import { CopiarIdSala } from '../components/common/CopiarIdSala'
import { UnirseASala } from '../components/salas/UnirseASala'
import { useSalasPropias } from '../hooks/useSalasPropias'
import { crearSala, validarNombreSala } from '../services/api/salas'

// US-07: aviso tras eliminar una sala (la propia o la que el anfitrión eliminó estando dentro).
function avisoDeSala(estado: unknown): { tipo: 'eliminada-propia' | 'eliminada-por-anfitrion'; nombre: string } | null {
  const aviso = estado && typeof estado === 'object' && 'avisoSala' in estado ? (estado as { avisoSala: unknown }).avisoSala : null
  if (!aviso || typeof aviso !== 'object') return null
  const { tipo, nombre } = aviso as { tipo?: unknown; nombre?: unknown }
  return (tipo === 'eliminada-propia' || tipo === 'eliminada-por-anfitrion') && typeof nombre === 'string' ? { tipo, nombre } : null
}

export function Panel() {
  return <RequierePerfil><MisSalas /></RequierePerfil>
}

function MisSalas() {
  const { perfil, usuario, modificandoCuenta, cerrandoSesion } = useAuth()
  const { salas, error, cargando, aviso: avisoLista, reintentar } = useSalasPropias()
  const navegar = useNavigate()
  const aviso = avisoDeSala(useLocation().state)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const activador = useRef<HTMLButtonElement | null>(null)
  const [nombre, setNombre] = useState('')
  const [errorNombre, setErrorNombre] = useState('')
  const [errorCreacion, setErrorCreacion] = useState('')
  const [creando, setCreando] = useState(false)
  const bloqueo = useRef(false)
  const formulario = useRef<HTMLFormElement>(null)
  const alerta = useRef<HTMLDivElement>(null)
  const ocupado = creando || modificandoCuenta || cerrandoSesion

  function abrirFormulario(boton: HTMLButtonElement) {
    activador.current = boton
    setMostrarFormulario(true)
    requestAnimationFrame(() => formulario.current?.querySelector<HTMLInputElement>('#nombre-sala')?.focus())
  }

  function cancelarCreacion() {
    if (bloqueo.current || ocupado) return
    setMostrarFormulario(false)
    setNombre('')
    setErrorNombre('')
    setErrorCreacion('')
    requestAnimationFrame(() => activador.current?.focus())
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!usuario || bloqueo.current || ocupado) return
    const validacion = validarNombreSala(nombre)
    setErrorNombre(validacion)
    setErrorCreacion('')
    if (validacion) { formulario.current?.querySelector<HTMLInputElement>('#nombre-sala')?.focus(); return }
    bloqueo.current = true
    setCreando(true)
    try {
      const sala = await crearSala(usuario, nombre)
      navegar(`/salas/${encodeURIComponent(sala.id)}`)
    } catch (fallo) {
      setErrorCreacion(fallo instanceof Error ? fallo.message : 'No pudimos crear la sala. Intenta de nuevo.')
      requestAnimationFrame(() => alerta.current?.focus())
    } finally {
      bloqueo.current = false
      setCreando(false)
    }
  }

  return <section className="mx-auto max-w-5xl px-4 py-12">
    <div className="entrada"><h1>Salas</h1></div>
    {perfil && <div className="mt-6 flex items-center gap-4">
      <AvatarUsuario valor={perfil.avatar} />
      <p className="min-w-0 break-words text-xl">Hola, {perfil.nombres}.</p>
    </div>}
    {aviso && <div className="mt-6 max-w-xl">{aviso.tipo === 'eliminada-propia'
      ? <MensajeExito>La sala «{aviso.nombre}» se eliminó correctamente.</MensajeExito>
      : <MensajeAviso>El anfitrión eliminó la sala «{aviso.nombre}». Volviste al panel.</MensajeAviso>}</div>}
    <p className="mt-4 text-texto-suave">Organiza un espacio para estudiar y comparte su ID con tus compañeros.</p>

    <div className="mt-8 max-w-xl"><UnirseASala deshabilitado={modificandoCuenta || cerrandoSesion} /></div>

    <div className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2>Mis salas</h2>
        <p role="status" className="sr-only">{avisoLista}</p>
        {(cargando || error || salas.length > 0) && <Button disabled={ocupado || mostrarFormulario}
          aria-expanded={mostrarFormulario} aria-controls="crear-sala-formulario" onClick={evento => abrirFormulario(evento.currentTarget)}>
          <Plus aria-hidden="true" size={20} /> Crear sala
        </Button>}
      </div>
      {mostrarFormulario && <Tarjeta className="mt-5">
      <h3 id="crear-sala-titulo" className="text-xl font-bold">Crear sala</h3>
      <form id="crear-sala-formulario" aria-labelledby="crear-sala-titulo" onKeyDown={evento => { if (evento.key === 'Escape') { evento.preventDefault(); cancelarCreacion() } }} ref={formulario} className="mt-5 space-y-4" onSubmit={evento => void enviar(evento)} noValidate aria-busy={creando}>
        <CampoFormulario id="nombre-sala" etiqueta="Nombre de la sala" value={nombre}
          onChange={evento => { setNombre(evento.target.value); setErrorNombre('') }}
          error={errorNombre} ayuda="Entre 1 y 80 caracteres. Por ejemplo: Repaso de cálculo." required disabled={ocupado} />
        {errorCreacion && <div ref={alerta} tabIndex={-1} role="alert" className="rounded-xl bg-error-fondo p-4 text-error">{errorCreacion}</div>}
        {creando && <Cargando detalle="Estamos creando tu sala." />}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={ocupado}>{creando ? 'Creando sala…' : 'Crear sala'}</Button>
          <Button variante="secundario" disabled={ocupado} onClick={cancelarCreacion}>Cancelar</Button>
        </div>
      </form>
    </Tarjeta>}
      <div className="mt-5">
        {cargando ? <Cargando detalle="Estamos consultando tus salas." /> : error ? <MensajeError mensaje={error} onReintentar={reintentar} /> : salas.length === 0
          ? <EstadoVacio mensaje="Todavía no tienes salas. Aquí las verás cuando las tengas">
            <Button disabled={ocupado || mostrarFormulario} aria-expanded={mostrarFormulario} aria-controls="crear-sala-formulario"
              onClick={evento => abrirFormulario(evento.currentTarget)}>
              <Plus aria-hidden="true" size={20} /> Crear mi primera sala
            </Button>
          </EstadoVacio>
          : <ul className="grid gap-5 sm:grid-cols-2">
            {salas.map(sala => <li key={sala.id} className="min-w-0 transition-transform duration-300 ease-(--ease-salida) motion-safe:hover:-translate-y-0.5">
              <Tarjeta className="h-full">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-hoja-suave text-primario"><Leaf size={20} /></span>
                  <h3 className="min-w-0 break-words text-xl font-bold">{sala.nombre}</h3>
                </div>
                <p className="mt-2 mb-4 text-sm text-bosque">Administrador</p>
                <CopiarIdSala id={sala.id} />
                <ButtonLink className="mt-4" to={`/salas/${encodeURIComponent(sala.id)}`}>Entrar a la sala</ButtonLink>
              </Tarjeta>
            </li>)}
          </ul>}
      </div>
    </div>
  </section>
}
