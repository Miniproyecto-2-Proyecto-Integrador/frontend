import { Suspense, useReducer, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { cierreInicial, reducirCierre } from '../../services/dialogoCierre'
import { DialogoCerrarSesion } from '../auth/DialogoCerrarSesion'
import { DialogoEliminarCuenta } from '../auth/DialogoEliminarCuenta'
import { Cargando, MensajeExito } from '../common/Estados'
import { LogoArbol } from '../common/LogoArbol'
import { Encabezado } from './Encabezado'
import { FondoNaturaleza } from './FondoNaturaleza'
import { SkipLink } from './SkipLink'

export function Layout() {
  useDocumentTitle()
  const { cerrarSesion, eliminarCuenta } = useAuth()
  const navegar = useNavigate()
  const location = useLocation()
  // La sala ocupa toda la pantalla (como una videollamada): sin encabezado, fondo decorativo ni pie.
  const enSala = /^\/salas\/[^/]+\/?$/.test(location.pathname)
  const [{ abierto: dialogoAbierto, cerrando, error }, dispatch] = useReducer(reducirCierre, cierreInicial)
  const bloqueo = useRef(false)
  const activador = useRef<HTMLButtonElement | null>(null)
  const [eliminacion, despacharEliminacion] = useReducer(reducirCierre, cierreInicial)
  const bloqueoEliminar = useRef(false)
  const activadorEliminar = useRef<HTMLButtonElement | null>(null)

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

  function cancelarEliminar() {
    if (bloqueoEliminar.current) return
    despacharEliminacion({ tipo: 'cancelar' })
    requestAnimationFrame(() => activadorEliminar.current?.focus())
  }
  async function confirmarEliminar() {
    if (bloqueoEliminar.current) return
    bloqueoEliminar.current = true
    despacharEliminacion({ tipo: 'confirmar' })
    try {
      await eliminarCuenta()
      despacharEliminacion({ tipo: 'cerrado' })
      navegar('/', { replace: true, state: { cuentaEliminada: true } })
      requestAnimationFrame(() => document.getElementById('contenido')?.focus())
    } catch {
      despacharEliminacion({ tipo: 'fallo', mensaje: 'No pudimos eliminar tu cuenta. Puedes intentarlo de nuevo o cancelar.' })
    } finally { bloqueoEliminar.current = false }
  }

  return (
    <div className="relative isolate flex min-h-screen flex-col">
      <SkipLink />

      {!enSala && <FondoNaturaleza />}

      {!enSala && <Encabezado cerrando={cerrando || eliminacion.cerrando} onCerrarSesion={boton => {
        activador.current = boton
        dispatch({ tipo: 'abrir' })
      }} />}
      {dialogoAbierto && <DialogoCerrarSesion ocupado={cerrando} error={error} cancelar={cancelar} confirmar={() => void confirmar()} />}

      {eliminacion.abierto && <DialogoEliminarCuenta ocupado={eliminacion.cerrando} error={eliminacion.error} cancelar={cancelarEliminar} confirmar={() => void confirmarEliminar()} />}

      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        {location.state?.sesionCerrada === true && <div className="mx-auto mt-6 max-w-3xl px-4"><MensajeExito>Sesión cerrada correctamente.</MensajeExito></div>}
        {location.state?.cuentaEliminada === true && <div className="mx-auto mt-6 max-w-3xl px-4"><MensajeExito>Tu cuenta se eliminó correctamente.</MensajeExito></div>}
        <Suspense fallback={<div className="mx-auto max-w-3xl px-4"><Cargando variante="pagina" /></div>}>
          <Outlet context={{
            cierreEnCurso: cerrando || eliminacion.cerrando,
            abrirEliminarCuenta: (boton: HTMLButtonElement) => {
              activadorEliminar.current = boton
              despacharEliminacion({ tipo: 'abrir' })
            },
          }} />
        </Suspense>
      </main>

      {!enSala && <footer className="mt-16 bg-corteza text-papel">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 font-titulo text-xl font-bold">
            <LogoArbol className="size-9 shrink-0" />
            TertuliApp
            <span className="font-texto text-base font-normal text-papel/90">Estudiar juntos, bajo el mismo árbol.</span>
          </p>
          <nav aria-label="Pie de página">
            <ul className="flex flex-wrap gap-x-6">
              <li><Link to="/ayuda" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4 decoration-1 transition-[text-decoration-thickness] hover:decoration-2 focus-visible:outline-papel">Ayuda</Link></li>
              <li><Link to="/accesibilidad" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4 decoration-1 transition-[text-decoration-thickness] hover:decoration-2 focus-visible:outline-papel">Accesibilidad</Link></li>
            </ul>
          </nav>
        </div>
      </footer>}
    </div>
  )
}