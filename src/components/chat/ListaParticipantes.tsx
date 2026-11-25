import { Users } from 'lucide-react'
import type { EstadoConexion } from '../../services/realtime/salaTiempoReal'
import type { Participante } from '../../types/chat'
import { AvatarUsuario } from '../common/AvatarUsuario'
import { Chip } from '../common/Chip'

// Una sola familia de cafés: el avatar (claro) y el nombre (papel) resaltan con contraste alto sobre todos.
const tonos = ['bg-cafe-medio', 'bg-acento', 'bg-corteza']
function tonoDe(nombre: string) {
  let h = 0
  for (const c of nombre) h = (h * 31 + (c.codePointAt(0) ?? 0)) >>> 0
  return tonos[h % tonos.length]
}

// US-10: quién está ahora en la sala. El servidor entrega la lista (sin duplicar pestañas) y la actualiza
// cuando alguien entra o sale; el anfitrión aparece primero.
// Diseño: «escenario» de recuadros que llenan la pantalla, como una videollamada (sin cámara: avatar o inicial + nombre).
// «compacto» (solo cuenta en pantallas chicas): con el chat abierto los recuadros pasan a una tira horizontal
// para que el chat y los participantes se vean a la vez, sin taparse.
export function ListaParticipantes({ participantes, estado, miNombre, miAvatar, compacto = false }: {
  participantes: Participante[]; estado: EstadoConexion; miNombre?: string; miAvatar?: string; compacto?: boolean
}) {
  const n = participantes.length
  const rejilla = n <= 1 ? 'grid-cols-1' : n === 2 ? 'grid-cols-1 sm:grid-cols-2' : n <= 4 ? 'grid-cols-2'
    : n <= 6 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  const c = compacto
  return <section className="flex min-h-full flex-col">
    <h2 id="titulo-participantes" className={`flex items-center gap-2 px-1 pb-3 text-lg text-papel ${c ? 'max-lg:pb-2 max-lg:text-base' : ''}`}>
      <Users aria-hidden="true" size={20} className="shrink-0" />
      Participantes <span className="numeros">({participantes.length})</span>
    </h2>
    {participantes.length === 0
      ? <p className="my-auto py-10 text-center text-papel">{estado === 'sin-conexion' ? 'No pudimos ver quién está en la sala. Cuando vuelva la conexión se actualizará.' : 'Buscando quién está en la sala…'}</p>
      : <ul aria-labelledby="titulo-participantes" tabIndex={c ? 0 : undefined}
        className={`grid min-h-0 flex-1 auto-rows-fr gap-3 ${rejilla} ${c ? 'max-lg:flex max-lg:flex-none max-lg:gap-2 max-lg:overflow-x-auto max-lg:pb-1' : ''}`}>
        {participantes.map(p => {
          const esYo = p.nombre === miNombre
          const avatar = p.avatar ?? (esYo ? miAvatar : undefined)
          const tamano = c ? 'size-12 lg:size-40' : 'size-20 sm:size-32 lg:size-40'
          return <li key={p.nombre} className={`relative flex min-h-40 min-w-0 items-center justify-center rounded-3xl px-2 pt-9 pb-11 lg:min-h-36 lg:p-0 ${p.esAnfitrion ? 'border-4 border-papel' : 'border-2 border-arena/70'} ${tonoDe(p.nombre)} ${c ? 'max-lg:h-28 max-lg:min-h-0 max-lg:w-36 max-lg:shrink-0 max-lg:rounded-2xl max-lg:pt-7 max-lg:pb-8' : ''}`}>
            {avatar
              ? <AvatarUsuario valor={avatar} tamano={tamano} redondo borde={c ? 'border-2 border-papel lg:border-4' : 'border-4 border-papel'} />
              : <span aria-hidden="true" className={`flex ${tamano} items-center justify-center rounded-full border-4 border-papel bg-arena font-titulo font-extrabold text-bosque ${c ? 'border-2 text-2xl lg:border-4 lg:text-6xl' : 'text-4xl sm:text-6xl'}`}>{p.nombre.slice(0, 1).toUpperCase()}</span>}
            {p.esAnfitrion && <span className={`absolute top-3 right-3 ${c ? 'max-lg:top-1 max-lg:right-1 max-lg:*:px-2 max-lg:*:py-0 max-lg:*:text-sm' : ''}`}><Chip color="cafe">Anfitrión</Chip></span>}
            <span className={`absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-xl bg-papel px-3 py-1.5 text-texto ${c ? 'max-lg:bottom-1 max-lg:left-1 max-lg:max-w-[calc(100%-0.5rem)] max-lg:px-2 max-lg:py-0.5 max-lg:text-sm' : ''}`}>
              <span className={`break-all font-bold ${c ? 'max-lg:block max-lg:truncate' : ''}`}>{p.nombre}{esYo && <span className="font-normal"> (tú)</span>}</span>
            </span>
          </li>
        })}
      </ul>}
    {estado === 'sin-conexion' && participantes.length > 0 && <p className="pt-2 text-sm text-papel">Sin conexión: la lista puede estar desactualizada.</p>}
  </section>
}
