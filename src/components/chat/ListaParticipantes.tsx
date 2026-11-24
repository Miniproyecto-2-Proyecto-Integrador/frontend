import { Users } from 'lucide-react'
import type { EstadoConexion } from '../../services/realtime/salaTiempoReal'
import type { Participante } from '../../types/chat'
import { Chip } from '../common/Chip'
import { Tarjeta } from '../common/Tarjeta'

// US-10: quién está ahora en la sala. El servidor entrega la lista (sin duplicar pestañas) y la actualiza
// cuando alguien entra o sale; el anfitrión aparece primero.
export function ListaParticipantes({ participantes, estado, miNombre }: {
  participantes: Participante[]; estado: EstadoConexion; miNombre?: string
}) {
  return <Tarjeta>
    <h2 id="titulo-participantes" className="flex items-center gap-2">
      <Users aria-hidden="true" size={24} className="shrink-0 text-primario" />
      Participantes <span className="numeros text-texto-suave">({participantes.length})</span>
    </h2>
    {participantes.length === 0
      ? <p className="mt-4 text-texto-suave">{estado === 'sin-conexion' ? 'No pudimos ver quién está en la sala. Cuando vuelva la conexión se actualizará.' : 'Buscando quién está en la sala…'}</p>
      : <ul aria-labelledby="titulo-participantes" className="mt-4 space-y-3">
        {participantes.map(p => <li key={p.nombre} className="flex flex-wrap items-center gap-2">
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-hoja-suave font-bold text-bosque">{p.nombre.slice(0, 1).toUpperCase()}</span>
          <span className="break-all font-bold">{p.nombre}{p.nombre === miNombre && <span className="font-normal text-texto-suave"> (tú)</span>}</span>
          {p.esAnfitrion && <Chip color="cafe">Anfitrión</Chip>}
        </li>)}
      </ul>}
    {estado === 'sin-conexion' && participantes.length > 0 && <p className="mt-4 text-sm text-texto-suave">Sin conexión: la lista puede estar desactualizada.</p>}
  </Tarjeta>
}
