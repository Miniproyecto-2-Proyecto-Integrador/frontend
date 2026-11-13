import type { ReactNode } from 'react'
import { Navigate, useLocation, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { Cargando, MensajeError } from '../common/Estados'
import { esUsuarioGoogle } from '../../services/googleAuth'
import { destinoSeguro } from '../../services/destinoSeguro'

// US-01: el destino del registro exige un perfil confirmado por la API.
// US-03 ampliará esta protección al resto de rutas privadas.
export function RequierePerfil({ children, cierreEnCurso = false }: { children: ReactNode; cierreEnCurso?: boolean }) {
  const { estado, usuario, error, actualizarPerfil, cerrandoSesion } = useAuth()
  const location = useLocation()
  const cierreGlobal = useOutletContext<{ cierreEnCurso?: boolean } | undefined>()?.cierreEnCurso
  const destino = destinoSeguro(location.pathname + location.search + location.hash)
  // Solo carga: no mostrar contenido privado ni redirigir mientras el Panel espera signOut.
  if (cierreEnCurso || cerrandoSesion || cierreGlobal) return <Cargando detalle="Estamos cerrando tu sesión." />
  if (estado === 'cargando') return <Cargando detalle="Estamos comprobando tu sesión y tu perfil." />
  if (estado === 'error') return <MensajeError mensaje={error} onReintentar={() => {
    if (usuario) void actualizarPerfil().catch(() => {})
    else window.location.reload()
  }} />
  if (estado === 'sin-sesion') return <Navigate to="/ingresar" state={{ from: destino }} replace />
  if (estado === 'pendiente') return <Navigate to={esUsuarioGoogle(usuario) ? '/registro/usuario' : '/registro'} state={{ from: destino }} replace />
  return children
}
