import { MessagesSquare } from 'lucide-react'
import type { HistorialChat } from '../../hooks/useHistorialChat'
import type { EstadoConexion } from '../../services/realtime/salaTiempoReal'
import type { Mensaje } from '../../types/chat'
import { Chip } from '../common/Chip'
import { FormularioMensaje } from './FormularioMensaje'
import { ListaMensajes } from './ListaMensajes'

const estados: Record<EstadoConexion, string> = { conectando: 'Conectando…', conectada: 'Chat en vivo', 'sin-conexion': 'Sin conexión' }

// US-10: zona de chat de la sala (mensajes + campo para escribir). Los mensajes los entrega el servidor
// en tiempo real; aquí solo se muestran y se envían. US-11: el historial viene de la API.
// Diseño: panel lateral a toda la altura (como el chat de una videollamada); en pantallas chicas va debajo.
export function ChatSala({ mensajes, estado, enviar, historial }: {
  mensajes: Mensaje[]; estado: EstadoConexion; enviar: (texto: string) => Promise<unknown>; historial: HistorialChat
}) {
  return <section aria-labelledby="titulo-chat" className="aparecer flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-borde-tarjeta bg-papel text-texto shadow-papel">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borde-tarjeta px-5 py-4">
      <h2 id="titulo-chat" className="flex items-center gap-2 text-xl"><MessagesSquare aria-hidden="true" size={22} className="shrink-0 text-primario" />Chat de la sala</h2>
      <Chip color={estado === 'conectada' ? 'hoja' : 'cafe'}>{estados[estado]}</Chip>
    </div>
    <ListaMensajes mensajes={mensajes} historial={historial} />
    <FormularioMensaje enviar={enviar} />
  </section>
}
