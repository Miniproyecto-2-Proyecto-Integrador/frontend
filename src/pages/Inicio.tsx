import { ArrowRight, MessageSquare, MonitorUp, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/common/Button'
import { Chip } from '../components/common/Chip'
import { EscenaSala } from '../components/home/EscenaSala'

export function Inicio() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:py-16 lg:grid-cols-2">
      <div>
        <h1 className="mt-4 text-4xl leading-[1.15] tracking-tight sm:text-5xl">
          Estudien <span className="text-[#1D4ED8]">juntos</span>, aunque estén{' '}
          <span className="text-black">lejos</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-texto-suave">
          Crea una sala, comparte su ID y estudia con tus compañeros con chat, cámara, micrófono y
          pantalla compartida.
        </p>

        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink to="/registro">
            Crear cuenta
            <ArrowRight aria-hidden="true" size={18} />
          </ButtonLink>
          <ButtonLink to="/ingresar" variante="secundario">
            Iniciar sesión
          </ButtonLink>
        </div>

        <p className="mt-4 text-texto-suave">
          ¿Ya tienes el ID de una sala?{' '}
          <Link to="/ingresar" className="font-bold text-azul-texto underline underline-offset-4">
            Inicia sesión para unirte.
          </Link>
        </p>

        <ul className="mt-6 flex flex-wrap gap-2">
          <li>
            <Chip icono={<MessageSquare aria-hidden="true" size={16} />}>Chat</Chip>
          </li>
          <li>
            <Chip icono={<Video aria-hidden="true" size={16} />}>Cámara y micrófono</Chip>
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