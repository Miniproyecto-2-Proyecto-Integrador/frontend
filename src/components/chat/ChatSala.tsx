import { MessagesSquare } from 'lucide-react'
import type { EstadoConexion } from '../../services/realtime/salaTiempoReal'
import type { Mensaje } from '../../types/chat'
import { Chip } from '../common/Chip'
import { Tarjeta } from '../common/Tarjeta'
import { FormularioMensaje } from './FormularioMensaje'
import { ListaMensajes } from './ListaMensajes'

const estados: Record<EstadoConexion, string> = { conectando: 'Conectando…', conectada: 'Chat en vivo', 'sin-conexion': 'Sin conexión' }

// US-10: zona de chat de la sala (mensajes + campo para escribir). Los mensajes los entrega el servidor
// en tiempo real; aquí solo se muestran y se envían.
export function ChatSala({ mensajes, estado, enviar }: {
  mensajes: Mensaje[]; estado: EstadoConexion; enviar: (texto: string) => Promise<unknown>
}) {
  return <Tarjeta>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2"><MessagesSquare aria-hidden="true" size={26} className="shrink-0 text-primario" />Chat de la sala</h2>
      <Chip color={estado === 'conectada' ? 'hoja' : 'cafe'}>{estados[estado]}</Chip>
    </div>
    <ListaMensajes mensajes={mensajes} />
    <FormularioMensaje enviar={enviar} />
  </Tarjeta>
}
