import { ArrowRight, MessageSquare, MonitorUp, Video } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/common/Button'
import { Chip } from '../components/common/Chip'
import { EscenaSala } from '../components/home/EscenaSala'

const retraso = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

export function Inicio() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-6">
      <div>
        <h1 className="entrada text-[clamp(2.25rem,1.4rem+3.2vw,3.75rem)] leading-[1.08]">
          Estudien{' '}
          <span className="relative inline-block text-primario">
            juntos
            <svg aria-hidden="true" focusable="false" viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-1 h-2.5 w-full text-acento">
              <path className="trazo" pathLength="1" d="M3 9C40 3 80 12 120 6s60 3 77 2" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          , aunque estén <span className="text-acento">lejos</span>
        </h1>
        <p className="entrada mt-5 max-w-xl text-lg text-texto-suave" style={retraso(80)}>
          Crea una sala, comparte su ID y estudia con tus compañeros con chat, cámara, micrófono y
          pantalla compartida.
        </p>

        <div className="entrada mt-10 flex flex-wrap gap-3" style={retraso(160)}>
          <ButtonLink to="/registro">
            Crear cuenta
            <ArrowRight aria-hidden="true" size={18} className="transition-transform duration-200 ease-(--ease-salida) group-hover/boton:translate-x-1 motion-reduce:transition-none" />
          </ButtonLink>
          <ButtonLink to="/ingresar" variante="secundario">
            Iniciar sesión
          </ButtonLink>
        </div>

        <p className="entrada mt-5 text-texto-suave" style={retraso(220)}>
          ¿Ya tienes el ID de una sala?{' '}
          <Link to="/ingresar" className="font-bold text-bosque underline decoration-1 underline-offset-4 transition-[text-decoration-thickness,color] hover:text-primario hover:decoration-2">
            Inicia sesión para unirte.
          </Link>
        </p>

        <ul className="entrada mt-7 flex flex-wrap gap-2" style={retraso(280)}>
          <li>
            <Chip icono={<MessageSquare aria-hidden="true" size={16} />}>Chat</Chip>
          </li>
          <li>
            <Chip color="cafe" icono={<Video aria-hidden="true" size={16} />}>Cámara y micrófono</Chip>
          </li>
          <li>
            <Chip icono={<MonitorUp aria-hidden="true" size={16} />}>Compartir pantalla</Chip>
          </li>
        </ul>
      </div>

      <EscenaSala />
    </section>
  )
}
