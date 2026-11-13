import { useEffect, useReducer, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { CampoFormulario } from '../components/auth/CampoFormulario'
import { SelectorAvatar } from '../components/auth/SelectorAvatar'
import { Button, ButtonLink } from '../components/common/Button'
import { Cargando, MensajeExito } from '../components/common/Estados'
import { Tarjeta } from '../components/common/Tarjeta'
import { useAuth } from '../context/auth'
import { ApiError } from '../services/api/apiClient'
import { crearPerfil } from '../services/api/usuarios'
import { obtenerAuth } from '../services/firebase'
import { validarRegistro } from '../services/validarRegistro'
import type { DatosRegistro, ErroresRegistro } from '../services/validarRegistro'
import { confirmarPasoFinal, formularioInicial, nombresPasos, reducirFormulario, validarPaso } from '../services/asistenteRegistro'
import type { PasoRegistro } from '../services/asistenteRegistro'
import { esUsuarioGoogle } from '../services/googleAuth'

export function ContadorPaso({ actual, total }: { actual: PasoRegistro; total: 1 | 2 }) {
  return <p className="whitespace-nowrap pt-1 font-bold text-azul-texto">{total === 1 ? 'Completar perfil' : `Paso ${actual} de ${total}`}</p>
}

export function BotonSiguiente({ disabled, avanzar }: { disabled: boolean; avanzar: () => void }) {
  return <Button type="button" disabled={disabled} className="flex-1" onClick={evento => {
    // Cancelar el clic antes de cambiar de paso evita activar el submit recién montado.
    evento.preventDefault()
    avanzar()
  }}>Siguiente</Button>
}

function mensajeError(error: unknown) {
  if (error instanceof FirebaseError) {
    const mensajes: Record<string, string> = {
      'auth/email-already-in-use': 'Ese correo ya está registrado. Inicia sesión para continuar.',
      'auth/weak-password': 'La contraseña no cumple los requisitos de seguridad de Firebase. Elige una más segura.',
      'auth/invalid-email': 'Revisa el formato del correo electrónico.',
      'auth/network-request-failed': 'No pudimos conectar con Firebase. Revisa tu conexión y reintenta.',
      'auth/too-many-requests': 'Hubo demasiados intentos. Espera unos minutos y reintenta.',
      'auth/operation-not-allowed': 'El registro por correo no está habilitado. Contacta al equipo.',
      'auth/user-token-expired': 'Tu sesión expiró. Inicia sesión para completar tu registro.',
      'auth/invalid-user-token': 'Tu sesión no es válida. Inicia sesión para continuar.',
    }
    return mensajes[error.code] ?? 'No pudimos completar la autenticación. Reintenta o contacta al equipo.'
  }
  if (error instanceof ApiError && error.status === 401) return 'No se pudo validar tu sesión. Reintenta; si persiste, inicia sesión de nuevo.'
  return error instanceof Error ? error.message : 'No pudimos completar el registro. Reintenta.'
}

export function Registro() {
  const { usuario, estado, error: errorSesion, actualizarPerfil, cerrarSesion, googleActivo } = useAuth()
  const [{ datos, errores, paso }, dispatch] = useReducer(reducirFormulario, formularioInicial)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [visible, setVisible] = useState(false)
  const [reintentando, setReintentando] = useState(false)
  const [cambiandoCuenta, setCambiandoCuenta] = useState(false)
  const [avisoCuenta, setAvisoCuenta] = useState('')
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const [errorCierre, setErrorCierre] = useState('')
  const alertaCierre = useRef<HTMLDivElement>(null)
  const focoCuenta = useRef(false)
  const focoConsulta = useRef(false)
  const bloqueo = useRef(false)
  const formulario = useRef<HTMLFormElement>(null)
  const alerta = useRef<HTMLDivElement>(null)
  const reintentar = useRef<HTMLDivElement>(null)
  const tituloExito = useRef<HTMLHeadingElement>(null)
  const tituloPaso = useRef<HTMLHeadingElement>(null)
  const campoConError = useRef<keyof DatosRegistro | null>(null)
  const sesionAlEnviar = useRef(false)
  const pendiente = !!usuario
  // Mantener el paso de Acceso durante el envío aunque Firebase ya haya creado la cuenta.
  const recuperando = enviando ? sesionAlEnviar.current : pendiente
  const totalPasos = recuperando ? 1 : 2
  const pasoActual = Math.min(paso, totalPasos) as PasoRegistro
  const ultimoPaso = pasoActual === totalPasos
  const pasoAnterior = useRef({ paso: pasoActual, total: totalPasos })
  const ocupado = enviando || cambiandoCuenta || reintentando || cerrandoSesion || googleActivo
  const envioBloqueado = ocupado || (estado !== 'sin-sesion' && estado !== 'pendiente')

  useEffect(() => {
    if (campoConError.current) {
      const campo = campoConError.current
      campoConError.current = null
      const elemento = campo === 'avatar'
        ? formulario.current?.querySelector<HTMLInputElement>('input[name="avatar"]')
        : formulario.current?.querySelector<HTMLInputElement>(`#${campo}`)
      elemento?.focus()
    } else if (pasoAnterior.current.paso !== pasoActual || pasoAnterior.current.total !== totalPasos) {
      tituloPaso.current?.focus()
    }
    pasoAnterior.current = { paso: pasoActual, total: totalPasos }
  }, [pasoActual, totalPasos, errores])

  useEffect(() => {
    if (focoCuenta.current && estado === 'sin-sesion' && !cambiandoCuenta && !cerrandoSesion) {
      focoCuenta.current = false
      tituloPaso.current?.focus()
    }
  }, [estado, cambiandoCuenta, cerrandoSesion])

  useEffect(() => {
    if (estado === 'completo' && !enviando) {
      tituloExito.current?.focus()
    } else if (focoConsulta.current && !reintentando) {
      focoConsulta.current = false
      if (estado === 'error') reintentar.current?.querySelector<HTMLButtonElement>('button')?.focus()
      if (estado === 'pendiente') tituloPaso.current?.focus()
    }
  }, [estado, enviando, reintentando])

  function cambiar(campo: keyof DatosRegistro, valor: string) {
    dispatch({ tipo: 'editar', campo, valor })
  }

  function avanzar() {
    if (bloqueo.current || envioBloqueado) return
    const validacion = validarPaso(datos, pasoActual, recuperando)
    dispatch({ tipo: 'siguiente', pendiente: recuperando })
    if (Object.keys(validacion).length) enfocarError(validacion)
  }

  function retroceder() {
    if (bloqueo.current || ocupado) return
    dispatch({ tipo: 'anterior', pasoActual })
  }

  function enfocarError(erroresNuevos: ErroresRegistro) {
    campoConError.current = (['nombres', 'apellidos', 'username', 'avatar', 'correo', 'password'] as const)
      .find(campo => erroresNuevos[campo]) ?? null
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (bloqueo.current || envioBloqueado) return
    // Enter avanza en los primeros pasos, sin crear credenciales.
    if (!ultimoPaso) { avanzar(); return }
    const actualAuth = obtenerUsuarioSeguro()
    if (actualAuth?.uid !== usuario?.uid) {
      setMensaje('La sesión está cambiando. Espera a que se compruebe la cuenta activa.')
      return
    }
    const validacion = validarRegistro(datos, !!actualAuth)
    dispatch({ tipo: 'validar-envio', pendiente: !!actualAuth })
    setMensaje('')
    setAvisoCuenta('')
    if (Object.keys(validacion).length) {
      enfocarError(validacion)
      return
    }
    await confirmarPasoFinal(pasoActual, totalPasos, bloqueo, async () => {
      sesionAlEnviar.current = !!actualAuth
      setEnviando(true)
      try {
        const auth = obtenerAuth()
        const actual = auth.currentUser ?? (await createUserWithEmailAndPassword(auth, datos.correo.trim(), datos.password)).user
        // La contraseña ya no se necesita después de crear las credenciales.
        dispatch({ tipo: 'limpiar-password' })
        // Comparte la consulta del observador de Firebase y refleja sus errores en el contexto.
        const existente = await actualizarPerfil(actual)
        if (!existente) {
          if (auth.currentUser?.uid !== actual.uid) throw new Error('La cuenta activa cambió. Revisa tu sesión antes de continuar.')
          try {
            await crearPerfil(actual, {
              nombres: datos.nombres.trim(), apellidos: datos.apellidos.trim(),
              username: datos.username.trim(), avatar: datos.avatar,
            })
          } catch (error) {
            // Un 409 también puede significar que otro intento ya creó el perfil.
            if (!(error instanceof ApiError && error.status === 409) || !await actualizarPerfil(actual)) throw error
          }
        }
        const perfil = await actualizarPerfil(actual)
        if (!perfil) throw new Error('Tu cuenta está creada, pero falta confirmar el perfil. Reintenta para completarlo.')
      } catch (error) {
        const campos = error instanceof ApiError ? error.errores : {}
        const permitidos = Object.fromEntries(Object.entries(campos).filter(([campo]) => ['nombres', 'apellidos', 'username', 'avatar'].includes(campo)))
        if (Object.keys(permitidos).length) dispatch({ tipo: 'errores', errores: permitidos })
        setMensaje(mensajeError(error))
        if (Object.keys(permitidos).length) enfocarError(permitidos)
        else requestAnimationFrame(() => alerta.current?.focus())
      } finally {
        setEnviando(false)
      }
    })
  }

  async function reintentarConsulta() {
    if (bloqueo.current) return
    bloqueo.current = true
    setReintentando(true)
    focoConsulta.current = true
    setMensaje('')
    try {
      await actualizarPerfil()
    } catch { /* El contexto muestra el error y permite reintentar. */ }
    finally { bloqueo.current = false; setReintentando(false) }
  }

  async function cambiarCuenta() {
    if (bloqueo.current) return
    bloqueo.current = true
    setCambiandoCuenta(true)
    setMensaje('')
    try {
      await signOut(obtenerAuth())
      dispatch({ tipo: 'cambiar-cuenta' })
      setAvisoCuenta('La sesión anterior se cerró. Puedes crear otra cuenta; conservamos los datos del perfil.')
      focoCuenta.current = true
    } catch (error) {
      setMensaje(mensajeError(error))
      requestAnimationFrame(() => alerta.current?.focus())
    } finally {
      bloqueo.current = false
      setCambiandoCuenta(false)
    }
  }

  async function cerrarSesionCompleta() {
    if (bloqueo.current) return
    bloqueo.current = true
    setCerrandoSesion(true)
    setErrorCierre('')
    try {
      await cerrarSesion()
      dispatch({ tipo: 'reiniciar' })
      setVisible(false)
      setMensaje('')
      campoConError.current = null
      focoConsulta.current = false
      sesionAlEnviar.current = false
      focoCuenta.current = true
      setAvisoCuenta('Sesión cerrada. Puedes crear una nueva cuenta.')
    } catch {
      setErrorCierre('No pudimos cerrar la sesión. Vuelve a pulsar Cerrar sesión para reintentar.')
      requestAnimationFrame(() => alertaCierre.current?.focus())
    } finally {
      bloqueo.current = false
      setCerrandoSesion(false)
    }
  }

  if (esUsuarioGoogle(usuario) && !ocupado) {
    if (estado === 'completo') return <Navigate to="/dashboard" replace />
    if (estado === 'pendiente') return <Navigate to="/registro/usuario" replace />
  }

  if ((estado === 'completo' && !enviando) || cerrandoSesion) return <section className="mx-auto max-w-2xl px-4 py-12" aria-busy={cerrandoSesion}>
    <h1 ref={tituloExito} tabIndex={-1}>Crear cuenta</h1><div className="mt-6"><MensajeExito>Tu cuenta y tu perfil están listos.</MensajeExito></div>
    {cerrandoSesion && <div className="mt-4"><Cargando detalle="Estamos cerrando tu sesión." /></div>}
    {errorCierre && <div ref={alertaCierre} tabIndex={-1} role="alert" className="mt-4 rounded-xl bg-error-fondo p-4 text-error">{errorCierre}</div>}
    <div className="mt-6 flex flex-wrap gap-3">
      {cerrandoSesion ? <Button disabled>Ir al Panel</Button> : <ButtonLink to="/dashboard">Ir al Panel</ButtonLink>}
      <Button variante="secundario" onClick={() => void cerrarSesionCompleta()} disabled={cerrandoSesion}>
        {cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </Button>
    </div>
  </section>

  return <section className="mx-auto max-w-2xl px-4 py-12">
    <h1>Crear cuenta</h1>
    <p className="mt-3 text-lg text-texto-suave">Prepárate para estudiar y compartir con tus compañeros.</p>
    <Tarjeta className="mt-6">
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <h2 ref={tituloPaso} tabIndex={-1} className="min-w-0 break-words">{nombresPasos[pasoActual - 1]}</h2>
        <ContadorPaso actual={pasoActual} total={totalPasos} />
      </div>
      {pendiente && <div className="mb-6 rounded-xl bg-aviso-fondo p-4 text-aviso">
        <p role="status">Cuenta autenticada: <strong className="break-all">{usuario.email ?? 'Correo no disponible'}</strong>.
          {estado === 'pendiente' ? ' Tu perfil aún no existe. Completa el registro sin crear otra cuenta.' : ' Debemos confirmar tu perfil antes de continuar.'}
        </p>
        <p id="cambiar-cuenta-ayuda" className="mt-2">Cambiar de cuenta cierra esta sesión y conserva los datos del perfil escritos.</p>
        <Button variante="secundario" className="mt-3" onClick={() => void cambiarCuenta()} disabled={ocupado} aria-describedby="cambiar-cuenta-ayuda">
          {cambiandoCuenta ? 'Cambiando de cuenta…' : 'Cambiar de cuenta'}
        </Button>
      </div>}
      {avisoCuenta && <div className="mb-6"><MensajeExito>{avisoCuenta}</MensajeExito></div>}
      {estado === 'error' && <div ref={reintentar} role="alert" className="mb-6 rounded-xl bg-error-fondo p-4 text-error">
        <p>{errorSesion}</p>
        <p className="mt-2">No pudimos comprobar el perfil. El registro está bloqueado hasta recuperar la consulta.</p>
        {pendiente
          ? <Button className="mt-3" onClick={() => void reintentarConsulta()} disabled={ocupado}>Reintentar</Button>
          : <Button className="mt-3" onClick={() => window.location.reload()} disabled={ocupado}>Reintentar</Button>}
      </div>}
      {estado === 'cargando' && !enviando && <div className="mb-6"><Cargando detalle="Estamos comprobando tu sesión y tu perfil. Conservamos los datos escritos." /></div>}
      {mensaje && <div ref={alerta} tabIndex={-1} role="alert" className="mb-6 rounded-xl bg-error-fondo p-4 text-error">{mensaje}</div>}
      <form ref={formulario} noValidate onSubmit={enviar} aria-busy={enviando} className="space-y-6"
        onKeyDown={evento => {
          // Sin botón submit, el navegador no envía implícitamente un paso con varios inputs.
          if (evento.key === 'Enter' && !evento.nativeEvent.isComposing && !ultimoPaso
            && evento.target instanceof HTMLInputElement && evento.target.type !== 'radio') {
            evento.preventDefault()
            avanzar()
          }
        }}>
        {pasoActual === 1 && <>
          <div className="grid gap-6 sm:grid-cols-2">
            <CampoFormulario id="nombres" etiqueta="Nombres" autoComplete="given-name" required maxLength={50} value={datos.nombres} onChange={e => cambiar('nombres', e.target.value)} error={errores.nombres} disabled={enviando} />
            <CampoFormulario id="apellidos" etiqueta="Apellidos" autoComplete="family-name" required maxLength={50} value={datos.apellidos} onChange={e => cambiar('apellidos', e.target.value)} error={errores.apellidos} disabled={enviando} />
          </div>
          <CampoFormulario id="username" etiqueta="Nombre de usuario" autoComplete="username" required maxLength={20} value={datos.username} onChange={e => cambiar('username', e.target.value)} error={errores.username} ayuda="Entre 3 y 20 caracteres: letras de A a Z, números o guion bajo. Debe ser único." disabled={enviando} />
          <SelectorAvatar valor={datos.avatar} onChange={valor => cambiar('avatar', valor)} error={errores.avatar} disabled={enviando} />
        </>}
        {pasoActual === 2 && <>
          <CampoFormulario id="correo" etiqueta="Correo electrónico" type="email" autoComplete="email" required value={datos.correo} onChange={e => cambiar('correo', e.target.value)} error={errores.correo} disabled={enviando} />
          <CampoFormulario id="password" etiqueta="Contraseña" type={visible ? 'text' : 'password'} autoComplete="new-password" required value={datos.password} onChange={e => cambiar('password', e.target.value)} error={errores.password} ayuda="Al menos ocho caracteres, una letra y un número." disabled={enviando}>
            <button type="button" aria-controls="password" aria-pressed={visible} onClick={() => setVisible(valor => !valor)} className="absolute inset-y-0 right-1 min-h-11 rounded-xl px-3 font-bold text-azul-texto" disabled={enviando}>{visible ? 'Ocultar' : 'Mostrar'}</button>
          </CampoFormulario>
        </>}
        {enviando && <Cargando detalle="Estamos guardando tu cuenta y comprobando tu perfil." />}
        <div className="flex flex-col gap-3 sm:flex-row">
          {pasoActual > 1 && <Button type="button" variante="secundario" disabled={ocupado} onClick={retroceder}>Anterior</Button>}
          {ultimoPaso
            ? <Button key="confirmar" type="submit" disabled={envioBloqueado} className="flex-1">{enviando ? 'Guardando…' : recuperando ? 'Completar registro' : 'Crear cuenta'}</Button>
            : <BotonSiguiente key="siguiente" disabled={envioBloqueado} avanzar={avanzar} />}
        </div>
        <p className="text-texto-suave">¿Ya tienes cuenta? <Link to="/ingresar" className="font-bold text-azul-texto underline underline-offset-4">Iniciar sesión</Link></p>
      </form>
    </Tarjeta>
  </section>
}

function obtenerUsuarioSeguro() {
  try { return obtenerAuth().currentUser } catch { return null }
}
