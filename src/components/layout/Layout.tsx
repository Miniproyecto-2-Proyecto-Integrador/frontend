import { Link, NavLink, Outlet } from 'react-router-dom'
import { ButtonLink } from '../common/Button'

const enlace = 'text-sm font-medium text-texto underline-offset-4 hover:underline'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-texto">
      <header className="border-b border-borde bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="text-base font-bold">
            Salón de Estudio
          </Link>
          <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-3">
            <NavLink to="/base-tecnica" className={enlace}>
              Base técnica
            </NavLink>
            <NavLink to="/ayuda" className={enlace}>
              Ayuda
            </NavLink>
            <ButtonLink to="/ingreso" variante="secundario">
              Iniciar sesión
            </ButtonLink>
            <ButtonLink to="/registro">Crear cuenta</ButtonLink>
          </nav>
        </div>
      </header>

      <main id="contenido" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-borde bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm">
          <span className="font-semibold">Salón de Estudio</span>
          <nav aria-label="Pie de página" className="flex gap-4">
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