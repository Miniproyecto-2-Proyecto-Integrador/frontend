import { MessageSquare, Mic, MicOff, MonitorUp, PhoneOff, Video } from 'lucide-react'

function Participante({
  nombre,
  iniciales,
  fondo,
  presentando = false,
  silenciado = false,
}: {
  nombre: string
  iniciales: string
  fondo: string
  presentando?: boolean
  silenciado?: boolean
}) {
  return (
    <div
      className={`relative flex aspect-[4/3] items-center justify-center rounded-2xl border border-borde-tarjeta ${fondo}`}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-rosa-suave to-azul-suave text-sm font-bold text-azul-texto ring-4 ring-white/70">
        {iniciales}
      </span>
      <span className="absolute bottom-2 left-3 text-sm font-bold text-texto">{nombre}</span>
      {presentando && (
        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-azul-suave px-2 py-0.5 text-xs font-bold text-azul-texto">
          <MonitorUp size={14} /> Presentando
        </span>
      )}
      {silenciado && (
        <span className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full bg-rosa-suave text-acento">
          <MicOff size={14} />
        </span>
      )}
    </div>
  )
}

export function EscenaSala() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-xl">
      <div className="flotar rounded-[28px] border border-borde-tarjeta bg-white/85 p-4 shadow-xl shadow-acento/10 backdrop-blur-md">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-texto shadow-sm">
          <span className="size-2 rounded-full bg-acento" />
          Sala de cálculo
        </span>

        <div className="grid grid-cols-2 gap-3">
          <Participante nombre="Lucía" iniciales="LM" fondo="bg-rosa-suave" />
          <Participante nombre="Julián" iniciales="JU" fondo="bg-azul-suave" />
          <Participante nombre="Ana" iniciales="AM" fondo="bg-lila-suave" presentando />
          <Participante nombre="Tomás" iniciales="TS" fondo="bg-azul-claro" silenciado />
        </div>

        <div className="mt-4 flex justify-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-azul-suave text-azul-texto">
            <Mic size={20} />
          </span>
          <span className="flex size-11 items-center justify-center rounded-full bg-azul-suave text-azul-texto">
            <Video size={20} />
          </span>
          <span className="flex size-11 items-center justify-center rounded-full bg-primario text-white">
            <MonitorUp size={20} />
          </span>
          <span className="flex size-11 items-center justify-center rounded-full bg-rosa-suave text-acento">
            <PhoneOff size={20} />
          </span>
        </div>
      </div>

      <div className="flotar absolute -right-4 top-24 hidden w-56 rounded-2xl border border-borde-tarjeta bg-white p-3 shadow-lg sm:block">
        <p className="flex items-center gap-2 font-titulo text-sm font-bold">
          <MessageSquare size={16} className="text-acento" />
          Chat
        </p>
        <ul className="mt-2 divide-y divide-borde-tarjeta text-xs">
          <li className="py-2">
            <span className="font-bold">Lucía</span>
            <br />
            ¿Revisamos el ejercicio 4?
          </li>
          <li className="py-2">
            <span className="font-bold">Julián</span>
            <br />
            Sí, comparto mi pantalla.
          </li>
        </ul>
      </div>
    </div>
  )
}