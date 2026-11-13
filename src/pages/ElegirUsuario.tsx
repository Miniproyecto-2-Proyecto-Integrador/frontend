import { useEffect, useReducer, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { CampoFormulario } from '../components/auth/CampoFormulario'
import { SelectorAvatar } from '../components/auth/SelectorAvatar'
import { Button } from '../components/common/Button'
import { Cargando, MensajeError } from '../components/common/Estados'
import { Tarjeta } from '../components/common/Tarjeta'
import { ApiError } from '../services/api/apiClient'
import { obtenerAuth } from '../services/firebase'
import { esUsuarioGoogle } from '../services/googleAuth'
import { finalizarPerfil } from '../services/finalizarPerfil'
import { formularioInicial, reducirFormulario } from '../services/asistenteRegistro'
import { validarRegistro } from '../services/validarRegistro'
import type { ErroresRegistro } from '../services/validarRegistro'

export function ElegirUsuario() {
  const { usuario, estado, error } = useAuth()
  if (!usuario) {
    if (estado === 'cargando') return <Cargando detalle="Estamos restaurando tu sesión." />
    if (estado === 'error') return <MensajeError mensaje={error} onReintentar={() => window.location.reload()} />
    return <Navigate to="/ingresar" replace />
  }
  if (!esUsuarioGoogle(usuario)) return <Navigate to="/registro" replace />
  // La clave evita conservar datos de otra cuenta; la carga del perfil no desmonta el formulario.
  return <FormularioPerfilGoogle key={usuario.uid} usuario={usuario} />
}

function FormularioPerfilGoogle({ usuario }: { usuario: User }) {
  const { estado, error, actualizarPerfil, cerrarSesion, googleActivo } = useAuth()
  const [{ datos, errores }, dispatch] = useReducer(reducirFormulario, formularioInicial)
  const [ocupado, setOcupado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const bloqueo = useRef(false)
  const formulario = useRef<HTMLFormElement>(null)
  const titulo = useRef<HTMLHeadingElement>(null)
  const alerta = useRef<HTMLDivElement>(null)
  const campoConError = useRef<string | null>(null)
  const bloqueado = ocupado || googleActivo || estado !== 'pendiente' || !usuario.email

  useEffect(() => { titulo.current?.focus() }, [])
  useEffect(() => {
    const campo = campoConError.current
    if (!campo) return
    campoConError.current = null
    const selector = campo === 'avatar' ? 'input[name="avatar"]' : `#${campo}`
    formulario.current?.querySelector<HTMLInputElement>(selector)?.focus()
  }, [errores])

  function enfocarErrores(campos: ErroresRegistro) {
    campoConError.current = ['nombres', 'apellidos', 'username', 'avatar'].find(campo => campos[campo as keyof ErroresRegistro]) ?? null
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (bloqueo.current || bloqueado) return
    const validacion = validarRegistro(datos, true)
    dispatch({ tipo: 'validar-envio', pendiente: true })
    setMensaje('')
    if (Object.keys(validacion).length) { enfocarErrores(validacion); return }
    bloqueo.current = true
    setOcupado(true)
    try {
      await finalizarPerfil(usuario, {
        nombres: datos.nombres.trim(), apellidos: datos.apellidos.trim(),
        username: datos.username.trim(), avatar: datos.avatar,
      }, actualizarPerfil, () => obtenerAuth().currentUser)
    } catch (e) {
      const campos = e instanceof ApiError ? Object.fromEntries(
        Object.entries(e.errores).filter(([campo]) => ['nombres', 'apellidos', 'username', 'avatar'].includes(campo)),
      ) : {}
      if (Object.keys(campos).length) {
        dispatch({ tipo: 'errores', errores: campos })
        enfocarErrores(campos)
      }
      setMensaje(e instanceof ApiError && e.status === 401
        ? 'No pudimos validar tu sesión. Reintenta la consulta o cambia de cuenta.'
        : e instanceof Error ? e.message : 'No pudimos completar el perfil. Reintenta.')
      if (!Object.keys(campos).length) requestAnimationFrame(() => alerta.current?.focus())
    } finally {
      bloqueo.current = false
      setOcupado(false)
    }
  }

  async function reintentar() {
    if (bloqueo.current) return
    bloqueo.current = true
    setOcupado(true)
    setMensaje('')
    let recuperado = false
    try { await actualizarPerfil(usuario); recuperado = true } catch {
      // El contexto conserva el error; el formulario permanece montado.
    } finally {
      bloqueo.current = false
      setOcupado(false)
      requestAnimationFrame(() => recuperado ? titulo.current?.focus() : alerta.current?.focus())
    }
  }

  async function salir() {
    if (bloqueo.current || googleActivo) return
    bloqueo.current = true
    setOcupado(true)
    setMensaje('')
    try { await cerrarSesion() } catch {
      setMensaje('No pudimos cerrar la sesión. Reintenta para cambiar de cuenta.')
      requestAnimationFrame(() => alerta.current?.focus())
    } finally { bloqueo.current = false; setOcupado(false) }
  }

  if (estado === 'completo' && !ocupado) return <Navigate to="/dashboard" replace />

  return <section className="mx-auto max-w-2xl px-4 py-12">
    <h1 ref={titulo} tabIndex={-1}>Completar perfil</h1>
    <p className="mt-3 text-lg text-texto-suave">Elige tu nombre de usuario y confirma tus datos para continuar al Panel.</p>
    <Tarjeta className="mt-6">
      <div className="mb-6 rounded-xl bg-azul-claro p-4 text-azul-texto">
        <p className="font-bold">Cuenta de Google</p>
        {usuario.displayName && <p className="break-words">{usuario.displayName}</p>}
        <p className="break-all">{usuario.email ?? 'Google no proporcionó un correo electrónico.'}</p>
        <p className="mt-2">Escribe tus nombres y apellidos como quieres que aparezcan en tu perfil.</p>
      </div>
      {!usuario.email && <p role="alert" className="mb-6 rounded-xl bg-aviso-fondo p-4 text-aviso">
        No podemos completar el perfil sin un correo en la identidad autenticada. Cambia de cuenta o contacta al equipo.
      </p>}
      {estado === 'cargando' && <div className="mb-6"><Cargando detalle="Estamos comprobando tu perfil. Conservamos lo que escribiste." /></div>}
      {estado === 'error' && <div ref={alerta} tabIndex={-1} role="alert" className="mb-6 rounded-xl bg-error-fondo p-4 text-error">
        <p>{error}</p><p className="mt-2">Debemos recuperar la consulta antes de guardar tu perfil.</p>
        <Button className="mt-3" onClick={() => void reintentar()} disabled={ocupado}>Reintentar</Button>
      </div>}
      {mensaje && <div ref={estado === 'error' ? undefined : alerta} tabIndex={-1} role="alert" className="mb-6 rounded-xl bg-error-fondo p-4 text-error">{mensaje}</div>}
      <form ref={formulario} noValidate onSubmit={guardar} aria-busy={ocupado} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <CampoFormulario id="nombres" etiqueta="Nombres" autoComplete="given-name" required maxLength={50} disabled={ocupado}
            value={datos.nombres} error={errores.nombres} onChange={e => dispatch({ tipo: 'editar', campo: 'nombres', valor: e.target.value })} />
          <CampoFormulario id="apellidos" etiqueta="Apellidos" autoComplete="family-name" required maxLength={50} disabled={ocupado}
            value={datos.apellidos} error={errores.apellidos} onChange={e => dispatch({ tipo: 'editar', campo: 'apellidos', valor: e.target.value })} />
        </div>
        <CampoFormulario id="username" etiqueta="Nombre de usuario" autoComplete="username" required maxLength={20} disabled={ocupado}
          ayuda="Entre 3 y 20 caracteres: letras de A a Z, números o guion bajo. Debe ser único."
          value={datos.username} error={errores.username} onChange={e => dispatch({ tipo: 'editar', campo: 'username', valor: e.target.value })} />
        <SelectorAvatar valor={datos.avatar} error={errores.avatar} disabled={ocupado}
          onChange={valor => dispatch({ tipo: 'editar', campo: 'avatar', valor })} />
        {ocupado && <Cargando detalle="Estamos procesando tu solicitud." />}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" disabled={bloqueado} className="flex-1">Completar registro</Button>
          <Button variante="secundario" disabled={ocupado || googleActivo} onClick={() => void salir()}>Cambiar de cuenta</Button>
        </div>
      </form>
    </Tarjeta>
  </section>
}
