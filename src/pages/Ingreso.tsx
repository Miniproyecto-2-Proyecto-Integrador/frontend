import { useReducer, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { BotonGoogle } from '../components/auth/BotonGoogle'
import { Button, ButtonLink } from '../components/common/Button'
import { Cargando } from '../components/common/Estados'
import { Tarjeta } from '../components/common/Tarjeta'
import { esUsuarioGoogle } from '../services/googleAuth'
import { CampoFormulario } from '../components/auth/CampoFormulario'
import { errorIngreso, ingresoInicial, reducirIngreso, validarIngreso } from '../services/ingresoCorreo'
import { destinoDelEstado } from '../services/destinoSeguro'
import { ApiError } from '../services/api/apiClient'
import { ConsultaCanceladaError } from '../services/consultaCoordinada'

export function Ingreso() {
  const { usuario, estado, error, actualizarPerfil, googleActivo, ingresarConCorreo, correoActivo, cerrandoSesion } = useAuth()
  const destino = destinoDelEstado(useLocation().state)
  const [{ datos, errores }, dispatch] = useReducer(reducirIngreso, ingresoInicial)
  const [visible, setVisible] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const formulario = useRef<HTMLFormElement>(null)
  const [reintentando, setReintentando] = useState(false)
  const bloqueo = useRef(false)
  const titulo = useRef<HTMLHeadingElement>(null)
  const alerta = useRef<HTMLDivElement>(null)
  const ocupado = reintentando || googleActivo || correoActivo || enviando || cerrandoSesion

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (bloqueo.current || ocupado || estado !== 'sin-sesion') return
    const validacion = validarIngreso(datos)
    dispatch({ tipo: 'intentar' })
    setMensaje('')
    const campo = Object.keys(validacion)[0]
    if (campo) {
      requestAnimationFrame(() => formulario.current?.querySelector<HTMLInputElement>(`#${campo}`)?.focus())
      return
    }
    bloqueo.current = true
    setEnviando(true)
    try {
      await ingresarConCorreo(datos.correo, datos.password)
      dispatch({ tipo: 'limpiar-password' })
    } catch (e) {
      if (e instanceof ApiError || e instanceof ConsultaCanceladaError) dispatch({ tipo: 'limpiar-password' })
      else {
        setMensaje(errorIngreso(e))
        requestAnimationFrame(() => alerta.current?.focus())
      }
    } finally { bloqueo.current = false; setEnviando(false) }
  }

  async function reintentar() {
    if (bloqueo.current || ocupado) return
    if (!usuario) { window.location.reload(); return }
    bloqueo.current = true
    setReintentando(true)
    let recuperado = false
    try { await actualizarPerfil(usuario); recuperado = true } catch {
      // El contexto conserva la sesión y presenta el error de consulta.
    } finally {
      bloqueo.current = false
      setReintentando(false)
      requestAnimationFrame(() => recuperado ? titulo.current?.focus() : alerta.current?.focus())
    }
  }

  if (!ocupado) {
    if (estado === 'completo') return <Navigate to={destino} replace />
    if (estado === 'pendiente') return <Navigate to={esUsuarioGoogle(usuario) ? '/registro/usuario' : '/registro'} state={{ from: destino }} replace />
  }

  return <section className="mx-auto max-w-xl px-4 py-12">
    <h1 ref={titulo} tabIndex={-1} className="text-center">Iniciar sesión</h1>
    <p className="mt-3 text-center text-lg text-texto-suave">Accede con tu correo y contraseña o continúa con Google.</p>
    <Tarjeta className="mt-6">
      {estado === 'cargando' && !googleActivo && <div className="mb-6"><Cargando detalle="Estamos comprobando tu sesión y tu perfil." /></div>}
      {estado === 'error' && <div ref={alerta} tabIndex={-1} role="alert" className="mb-6 rounded-xl bg-error-fondo p-4 text-error">
        <p>{error}</p>
        <p className="mt-2">No pudimos comprobar tu perfil. Reintenta la consulta para continuar.</p>
        <Button className="mt-3" onClick={() => void reintentar()} disabled={ocupado}>Reintentar</Button>
      </div>}
      {mensaje && <div ref={estado === 'error' ? undefined : alerta} tabIndex={-1} role="alert" className="mb-6 rounded-xl bg-error-fondo p-4 text-error">{mensaje}</div>}
      <form ref={formulario} noValidate onSubmit={enviar} aria-busy={enviando || correoActivo} className="mb-6 space-y-6">
        <CampoFormulario id="correo" etiqueta="Correo electrónico" type="email" autoComplete="email" required
          value={datos.correo} error={errores.correo} disabled={ocupado}
          onChange={e => dispatch({ tipo: 'editar', campo: 'correo', valor: e.target.value })} />
        <CampoFormulario id="password" etiqueta="Contraseña" type={visible ? 'text' : 'password'} autoComplete="current-password" required
          value={datos.password} error={errores.password} disabled={ocupado}
          onChange={e => dispatch({ tipo: 'editar', campo: 'password', valor: e.target.value })}>
          <button type="button" aria-controls="password" aria-pressed={visible} disabled={ocupado}
            onClick={() => setVisible(actual => !actual)} className="absolute inset-y-0 right-1 min-h-11 rounded-xl px-3 font-bold text-azul-texto">{visible ? 'Ocultar' : 'Mostrar'}</button>
        </CampoFormulario>
        {(enviando || correoActivo) && <Cargando detalle="Estamos iniciando sesión y comprobando tu perfil." />}
        <Button type="submit" className="w-full" disabled={ocupado || estado !== 'sin-sesion'}>Iniciar sesión</Button>
      </form>
      <BotonGoogle disabled={ocupado || estado === 'cargando'} />
      <p className="mt-6 text-texto-suave">¿Todavía no tienes cuenta?</p>
      <ButtonLink to="/registro" state={{ from: destino }} variante="secundario" className="mt-3">Crear cuenta</ButtonLink>
    </Tarjeta>
  </section>
}
