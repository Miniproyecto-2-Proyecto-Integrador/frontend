import { Book } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { Encabezado } from './Encabezado'
import { SkipLink } from './SkipLink'

const enlace =
  'inline-flex min-h-11 items-center text-base font-bold text-azul-texto underline underline-offset-4 hover:text-primario'

export function Layout() {
  useDocumentTitle()

  return (
    <div className="relative isolate flex min-h-screen flex-col">
      <SkipLink />

      {/* Fondo «aurora»: solo decoración, nunca lleva texto encima */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 size-96 rounded-full bg-rosa-suave blur-3xl" />
        <div className="absolute -right-24 top-24 size-[28rem] rounded-full bg-azul-suave blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-lila-suave/70 blur-3xl" />
      </div>

      <Encabezado />

      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
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