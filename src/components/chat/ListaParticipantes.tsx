import { Users } from 'lucide-react'
import type { EstadoConexion } from '../../services/realtime/salaTiempoReal'
import type { Participante } from '../../types/chat'
import { AvatarUsuario } from '../common/AvatarUsuario'
import { Chip } from '../common/Chip'

// Fondos oscuros de la paleta: el avatar (claro) y el nombre (papel) resaltan con contraste alto.
const tonos = ['bg-primario', 'bg-acento', 'bg-bosque', 'bg-corteza']
function tonoDe(nombre: string) {
  let h = 0
  for (const c of nombre) h = (h * 31 + (c.codePointAt(0) ?? 0)) >>> 0
  return tonos[h % tonos.length]
}

// US-10: quién está ahora en la sala. El servidor entrega la lista (sin duplicar pestañas) y la actualiza
// cuando alguien entra o sale; el anfitrión aparece primero.
// Diseño: «escenario» de recuadros que llenan la pantalla, como una videollamada (sin cámara: avatar o inicial + nombre).
export function ListaParticipantes({ participantes, estado, miNombre, miAvatar }: {
  participantes: Participante[]; estado: EstadoConexion; miNombre?: string; miAvatar?: string
}) {
  const n = participantes.length
  const rejilla = n <= 1 ? 'grid-cols-1' : n === 2 ? 'grid-cols-1 sm:grid-cols-2' : n <= 4 ? 'grid-cols-2'
    : n <= 6 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  return <section className="flex min-h-full flex-col">
    <h2 id="titulo-participantes" className="flex items-center gap-2 px-1 pb-3 text-lg text-papel">
      <Users aria-hidden="true" size={20} className="shrink-0" />
      Participantes <span className="numeros">({participantes.length})</span>
    </h2>
    {participantes.length === 0
      ? <p className="my-auto py-10 text-center text-papel">{estado === 'sin-conexion' ? 'No pudimos ver quién está en la sala. Cuando vuelva la conexión se actualizará.' : 'Buscando quién está en la sala…'}</p>
      : <ul aria-labelledby="titulo-participantes" className={`grid min-h-0 flex-1 auto-rows-fr gap-3 ${rejilla}`}>
        {participantes.map(p => {
          const esYo = p.nombre === miNombre
          const avatar = p.avatar ?? (esYo ? miAvatar : undefined)
          return <li key={p.nombre} className={`relative flex min-h-36 min-w-0 items-center justify-center rounded-3xl border-2 ${esYo ? 'border-miel ring-4 ring-miel' : 'border-arena'} ${tonoDe(p.nombre)}`}>
            {avatar
              ? <AvatarUsuario valor={avatar} tamano="size-24 sm:size-32 lg:size-40" redondo borde="border-4 border-papel" />
              : <span aria-hidden="true" className="flex size-24 items-center justify-center rounded-full border-4 border-papel bg-arena font-titulo text-5xl font-extrabold text-bosque sm:size-32 sm:text-6xl lg:size-40">{p.nombre.slice(0, 1).toUpperCase()}</span>}
            {p.esAnfitrion && <span className="absolute top-3 right-3"><Chip color="cafe">Anfitrión</Chip></span>}
            <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-xl bg-papel px-3 py-1.5 text-texto">
              <span className="break-all font-bold">{p.nombre}{esYo && <span className="font-normal"> (tú)</span>}</span>
            </span>
          </li>
        })}
      </ul>}
    {estado === 'sin-conexion' && participantes.length > 0 && <p className="pt-2 text-sm text-papel">Sin conexión: la lista puede estar desactualizada.</p>}
  </section>
}
