import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { Cargando, MensajeError } from '../common/Estados'
import { esUsuarioGoogle } from '../../services/googleAuth'

// US-01: el destino del registro exige un perfil confirmado por la API.
// US-03 ampliará esta protección al resto de rutas privadas.
export function RequierePerfil({ children, cierreEnCurso = false }: { children: ReactNode; cierreEnCurso?: boolean }) {
  const { estado, usuario, error, actualizarPerfil } = useAuth()
  const location = useLocation()
  // Solo carga: no mostrar contenido privado ni redirigir mientras el Panel espera signOut.
  if (cierreEnCurso) return <Cargando detalle="Estamos cerrando tu sesión." />
  if (estado === 'cargando') return <Cargando detalle="Estamos comprobando tu sesión y tu perfil." />
  if (estado === 'error') return <MensajeError mensaje={error} onReintentar={() => {
    if (usuario) void actualizarPerfil().catch(() => {})
    else window.location.reload()
  }} />
  if (estado === 'sin-sesion') return <Navigate to="/ingresar" state={{ from: location.pathname }} replace />
  if (estado === 'pendiente') return <Navigate to={esUsuarioGoogle(usuario) ? '/registro/usuario' : '/registro'} replace />
  return children
}
