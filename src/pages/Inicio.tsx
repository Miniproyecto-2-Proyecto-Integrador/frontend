import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/common/Button'

const funciones = ['Chat', 'Cámara y micrófono', 'Compartir pantalla']

export function Inicio() {
  return (
    <div className="bg-linear-to-br from-pink-50 via-white to-blue-50">
      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="mb-4 inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-acento shadow-sm">
          Estudio en tiempo real
        </p>
        <h1 className="max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
          Estudien juntos, aunque estén lejos
        </h1>
        <p className="mt-4 max-w-xl text-lg text-texto-suave">
          Crea una sala, comparte su ID y estudia con tus compañeros con chat, cámara, micrófono y
          pantalla compartida.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink to="/registro">Crear cuenta</ButtonLink>
          <ButtonLink to="/ingreso" variante="secundario">
            Iniciar sesión
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm text-texto-suave">
          ¿Ya tienes el ID de una sala?{' '}
          <Link to="/ingreso" className="font-semibold underline">
            Inicia sesión para unirte.
          </Link>
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {funciones.map((f) => (
            <li key={f} className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm">
              {f}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}