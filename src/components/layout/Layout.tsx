import { useReducer, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { cierreInicial, reducirCierre } from '../../services/dialogoCierre'
import { DialogoCerrarSesion } from '../auth/DialogoCerrarSesion'
import { DialogoEliminarCuenta } from '../auth/DialogoEliminarCuenta'
import { MensajeExito } from '../common/Estados'
import { Encabezado } from './Encabezado'
import { SkipLink } from './SkipLink'

export function Layout() {
  useDocumentTitle()
  const { cerrarSesion, eliminarCuenta } = useAuth()
  const navegar = useNavigate()
  const location = useLocation()
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

      {/* Fondo «aurora»: solo decoración, nunca lleva texto encima */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 size-96 rounded-full bg-rosa-suave blur-3xl" />
        <div className="absolute -right-24 top-24 size-[28rem] rounded-full bg-azul-suave blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-lila-suave/70 blur-3xl" />
      </div>

      <Encabezado cerrando={cerrando || eliminacion.cerrando} onCerrarSesion={boton => {
        activador.current = boton
        dispatch({ tipo: 'abrir' })
      }} />
      {dialogoAbierto && <DialogoCerrarSesion ocupado={cerrando} error={error} cancelar={cancelar} confirmar={() => void confirmar()} />}

      {eliminacion.abierto && <DialogoEliminarCuenta ocupado={eliminacion.cerrando} error={eliminacion.error} cancelar={cancelarEliminar} confirmar={() => void confirmarEliminar()} />}

      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        {location.state?.sesionCerrada === true && <div className="mx-auto mt-6 max-w-3xl px-4"><MensajeExito>Sesión cerrada correctamente.</MensajeExito></div>}
        {location.state?.cuentaEliminada === true && <div className="mx-auto mt-6 max-w-3xl px-4"><MensajeExito>Tu cuenta se eliminó correctamente.</MensajeExito></div>}
        <Outlet context={{
          cierreEnCurso: cerrando || eliminacion.cerrando,
          abrirEliminarCuenta: (boton: HTMLButtonElement) => {
            activadorEliminar.current = boton
            despacharEliminacion({ tipo: 'abrir' })
          },
        }} />
      </main>


    </div>
  )
}