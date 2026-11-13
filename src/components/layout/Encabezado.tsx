import { Book, Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ButtonLink } from '../common/Button'

const enlace =
  'inline-flex min-h-11 items-center text-base font-bold text-azul-texto underline underline-offset-4 hover:text-primario'

export function Encabezado() {
  const enRegistro = useLocation().pathname === '/registro'
  const [abierto, setAbierto] = useState(false)
  const botonRef = useRef<HTMLButtonElement>(null)

  const cerrar = () => setAbierto(false)

  function alTeclear(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Escape' && abierto) {
      setAbierto(false)
      botonRef.current?.focus()
    }
  }

  return (
    <header onKeyDown={alTeclear} className="border-b border-borde-tarjeta bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 font-titulo font-bold text-texto">
          <span className="flex size-9 items-center justify-center rounded-full bg-azul-suave text-azul-texto">
            <Book aria-hidden="true" size={20} />
          </span>
          Salón de Estudio
        </Link>

        <nav aria-label="Navegación principal" className="hidden flex-wrap items-center gap-4 sm:flex">
          <NavLink to="/base-tecnica" className={enlace}>
            Base técnica
          </NavLink>
          <NavLink to="/ayuda" className={enlace}>
            Ayuda
          </NavLink>
          <ButtonLink to="/ingresar" variante="secundario">
            Iniciar sesión
          </ButtonLink>
          <ButtonLink to="/registro" variante={enRegistro ? 'secundario' : 'primario'}>Crear cuenta</ButtonLink>
        </nav>

        <button
          ref={botonRef}
          type="button"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          onClick={() => setAbierto((a) => !a)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-primario bg-white px-4 font-bold text-primario sm:hidden"
        >
          {abierto ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          Menú
        </button>
      </div>

      <nav
        id="menu-movil"
        aria-label="Navegación principal"
        className={abierto ? 'border-t border-borde-tarjeta px-4 pb-4 sm:hidden' : 'hidden'}
      >
        <ul className="flex flex-col items-start gap-1 pt-2">
          <li>
            <NavLink to="/base-tecnica" onClick={cerrar} className={enlace}>
              Base técnica
            </NavLink>
          </li>
          <li>
            <NavLink to="/ayuda" onClick={cerrar} className={enlace}>
              Ayuda
            </NavLink>
          </li>
          <li className="flex w-full">
            <ButtonLink to="/ingresar" variante="secundario" className="w-full" onClick={cerrar}>
              Iniciar sesión
            </ButtonLink>
          </li>
          <li className="flex w-full">
            <ButtonLink to="/registro" variante={enRegistro ? 'secundario' : 'primario'} className="w-full" onClick={cerrar}>
              Crear cuenta
            </ButtonLink>
          </li>
        </ul>
      </nav>
    </header>
  )
}
