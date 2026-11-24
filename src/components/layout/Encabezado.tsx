import { Menu, X } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth'
import { Button, ButtonLink } from '../common/Button'
import { LogoArbol } from '../common/LogoArbol'

// Enlace de navegación: el subrayado «se dibuja» al pasar el cursor y queda fijo en la página actual.
const enlace =
  'relative inline-flex min-h-11 items-center text-base font-bold text-bosque transition-colors duration-200 hover:text-primario motion-reduce:transition-none after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-current after:transition-transform after:duration-300 after:ease-(--ease-salida) hover:after:scale-x-100 aria-[current=page]:after:scale-x-100 motion-reduce:after:transition-none'

export function Encabezado({ onCerrarSesion, cerrando = false }: {
  onCerrarSesion: (activador: HTMLButtonElement) => void; cerrando?: boolean
}) {
  const { estado, usuario, googleActivo, correoActivo, cerrandoSesion, modificandoCuenta } = useAuth()
  const autenticado = estado === 'completo' && !!usuario
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
    <header onKeyDown={alTeclear} className="border-b border-borde-tarjeta bg-fondo">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-4 lg:grid-cols-[1fr_auto_1fr]">
        <Link to={autenticado ? '/dashboard' : '/'} className="group/logo inline-flex min-h-11 items-center gap-2.5 font-titulo text-2xl font-bold text-texto sm:text-3xl">
          <LogoArbol className="size-10 shrink-0 transition-transform duration-300 ease-(--ease-salida) motion-safe:group-hover/logo:-rotate-6 motion-safe:group-hover/logo:scale-105" />
          TertuliApp
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center justify-center gap-6 lg:flex">
          {autenticado ? <>
            <NavLink to="/dashboard" className={enlace}>Salas</NavLink>
            <NavLink to="/perfil" className={enlace}>Mi perfil</NavLink>
            <NavLink to="/ayuda" className={enlace}>Ayuda</NavLink>
          </> : <>
            <NavLink to="/base-tecnica" className={enlace}>Base técnica</NavLink>
            <NavLink to="/ayuda" className={enlace}>Ayuda</NavLink>
          </>}
        </nav>

        <div className="hidden items-center justify-end gap-3 lg:flex">
          {autenticado ? (
            <Button variante="secundario" disabled={cerrando || cerrandoSesion || googleActivo || correoActivo || modificandoCuenta} onClick={e => onCerrarSesion(e.currentTarget)}>Cerrar sesión</Button>
          ) : <>
            <ButtonLink to="/ingresar" variante="secundario">Iniciar sesión</ButtonLink>
            <ButtonLink to="/registro" variante={enRegistro ? 'secundario' : 'primario'}>Crear cuenta</ButtonLink>
          </>}
        </div>

        <button
          ref={botonRef}
          type="button"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          onClick={() => setAbierto((a) => !a)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-primario bg-papel px-4 font-bold text-primario transition-[background-color,scale] duration-200 ease-(--ease-salida) hover:bg-hoja-claro motion-safe:active:scale-[0.96] motion-reduce:transition-none lg:hidden"
        >
          {abierto ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          Menú
        </button>
      </div>

      <nav
        id="menu-movil"
        aria-label="Navegación principal"
        className={abierto ? 'brotar border-t border-borde-tarjeta px-4 pb-4 lg:hidden' : 'hidden'}
      >
        <ul className="flex flex-col items-start gap-1 pt-2">
          {autenticado ? <>
            <li><NavLink to="/dashboard" onClick={cerrar} className={enlace}>Salas</NavLink></li>
            <li><NavLink to="/perfil" onClick={cerrar} className={enlace}>Mi perfil</NavLink></li>
            <li><NavLink to="/ayuda" onClick={cerrar} className={enlace}>Ayuda</NavLink></li>
            <li><Button variante="secundario" disabled={cerrando || cerrandoSesion || googleActivo || correoActivo || modificandoCuenta} onClick={e => onCerrarSesion(e.currentTarget)}>Cerrar sesión</Button></li>
          </> : <>
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
          </>}
        </ul>
      </nav>
    </header>
  )
}
