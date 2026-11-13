import { useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { BotonGoogle } from '../components/auth/BotonGoogle'
import { Button, ButtonLink } from '../components/common/Button'
import { Cargando } from '../components/common/Estados'
import { Tarjeta } from '../components/common/Tarjeta'
import { esUsuarioGoogle } from '../services/googleAuth'

export function Ingreso() {
  const { usuario, estado, error, actualizarPerfil, googleActivo } = useAuth()
  const [reintentando, setReintentando] = useState(false)
  const bloqueo = useRef(false)
  const titulo = useRef<HTMLHeadingElement>(null)
  const alerta = useRef<HTMLDivElement>(null)

  async function reintentar() {
    if (bloqueo.current || googleActivo) return
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

  if (!googleActivo && !reintentando) {
    if (estado === 'completo') return <Navigate to="/dashboard" replace />
    if (estado === 'pendiente') return <Navigate to={esUsuarioGoogle(usuario) ? '/registro/usuario' : '/registro'} replace />
  }

  return <section className="mx-auto max-w-xl px-4 py-12">
    <h1 ref={titulo} tabIndex={-1}>Iniciar sesión</h1>
    <p className="mt-3 text-lg text-texto-suave">Continúa con tu cuenta de Google para acceder a tu espacio de estudio.</p>
    <Tarjeta className="mt-6">
      {estado === 'cargando' && !googleActivo && <div className="mb-6"><Cargando detalle="Estamos comprobando tu sesión y tu perfil." /></div>}
      {estado === 'error' && <div ref={alerta} tabIndex={-1} role="alert" className="mb-6 rounded-xl bg-error-fondo p-4 text-error">
        <p>{error}</p>
        <p className="mt-2">No pudimos comprobar tu perfil. Reintenta la consulta para continuar.</p>
        <Button className="mt-3" onClick={() => void reintentar()} disabled={reintentando || googleActivo}>Reintentar</Button>
      </div>}
      <BotonGoogle disabled={reintentando || estado === 'cargando'} />
      <p className="mt-6 text-texto-suave">¿Todavía no tienes cuenta?</p>
      <ButtonLink to="/registro" variante="secundario" className="mt-3">Crear cuenta</ButtonLink>
    </Tarjeta>
  </section>
}
