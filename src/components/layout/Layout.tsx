import { Book } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useReducer, useRef } from 'react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { Encabezado } from './Encabezado'
import { SkipLink } from './SkipLink'
import { useAuth } from '../../context/auth'
import { DialogoCerrarSesion } from '../auth/DialogoCerrarSesion'
import { MensajeExito } from '../common/Estados'
import { cierreInicial, reducirCierre } from '../../services/dialogoCierre'

const enlace =
  'inline-flex min-h-11 items-center text-base font-bold text-azul-texto underline underline-offset-4 hover:text-primario'

export function Layout() {
  useDocumentTitle()
  const { cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const location = useLocation()
  const [{ abierto: dialogoAbierto, cerrando, error }, dispatch] = useReducer(reducirCierre, cierreInicial)
  const bloqueo = useRef(false)
  const activador = useRef<HTMLButtonElement | null>(null)

  function cancelar() {
    if (bloqueo.current) return
    dispatch({ tipo: 'cancelar' })
    requestAnimationFrame(() => activador.current?.focus())
  }
  async function confirmar() {
    if (bloqueo.current) return
    bloqueo.current = true
    dispatch({ tipo: 'confirmar' })
    try {
      await cerrarSesion()
      dispatch({ tipo: 'cerrado' })
      navegar('/', { replace: true, state: { sesionCerrada: true } })
      requestAnimationFrame(() => document.getElementById('contenido')?.focus())
    } catch {
      dispatch({ tipo: 'fallo', mensaje: 'No pudimos cerrar tu sesión. Puedes intentarlo de nuevo o cancelar.' })
    } finally { bloqueo.current = false }
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col">
      <SkipLink />

      {/* Fondo «aurora»: solo decoración, nunca lleva texto encima */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 size-96 rounded-full bg-rosa-suave blur-3xl" />
        <div className="absolute -right-24 top-24 size-[28rem] rounded-full bg-azul-suave blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-lila-suave/70 blur-3xl" />
      </div>

      <Encabezado cerrando={cerrando} onCerrarSesion={boton => {
        activador.current = boton
        dispatch({ tipo: 'abrir' })
      }} />
      {dialogoAbierto && <DialogoCerrarSesion ocupado={cerrando} error={error} cancelar={cancelar} confirmar={() => void confirmar()} />}

      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        {location.state?.sesionCerrada === true && <div className="mx-auto mt-6 max-w-3xl px-4"><MensajeExito>Sesión cerrada correctamente.</MensajeExito></div>}
        <Outlet context={{ cierreEnCurso: cerrando }} />
      </main>

      <footer className="border-t border-borde-tarjeta bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <span className="inline-flex items-center gap-2 font-titulo font-bold text-azul-texto">
            <Book aria-hidden="true" size={18} />
            Salón de Estudio
          </span>
          <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6">
            <NavLink to="/accesibilidad" className={enlace}>
              Declaración de accesibilidad
            </NavLink>
            <NavLink to="/ayuda" className={enlace}>
              Ayuda
            </NavLink>
          </nav>
        </div>
      </footer>
    </div>
  )
}
