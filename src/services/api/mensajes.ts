import type { User } from 'firebase/auth'
import type { Mensaje } from '../../types/chat'
import { esMensaje } from '../chat'
import { ApiError, apiGet } from './apiClient'
import { normalizarIdSala, validarIdSala } from './salas'

// US-11: historial del chat. La API entrega los mensajes en orden cronológico y por partes
// (GET /api/salas/:id/mensajes). Sin «antes» trae los más recientes; con «antes» (el cursor que la API
// devolvió) trae los anteriores. El frontend no calcula cursores ni consulta Firestore.
export const LIMITE_HISTORIAL = 50
export type PaginaMensajes = { mensajes: Mensaje[]; hayMas: boolean; siguienteCursor: string | null }
const formatoCursor = /^\d{1,12}_\d{1,9}_[A-Za-z0-9]{1,40}$/

export async function obtenerMensajes(usuario: User, idSala: string, opciones: { antes?: string | null; limite?: number } = {}): Promise<PaginaMensajes> {
  const errorId = validarIdSala(idSala)
  if (errorId) throw new ApiError(errorId, 400)
  const { antes, limite = LIMITE_HISTORIAL } = opciones
  if (antes && !formatoCursor.test(antes)) throw new ApiError('No pudimos cargar los mensajes anteriores. Recarga la sala e intenta de nuevo.', 400)
  const valor = (await usuario.getIdToken()).trim()
  if (!valor) throw new ApiError('No pudimos obtener tu sesión. Vuelve a iniciar sesión.', 401)
  const consulta = new URLSearchParams({ limite: String(limite) })
  if (antes) consulta.set('antes', antes)
  const id = normalizarIdSala(idSala)
  const respuesta = await apiGet<{ success: boolean; data: unknown }>(`/api/salas/${encodeURIComponent(id)}/mensajes?${consulta}`, valor)
  const datos = respuesta.data as { mensajes?: unknown; hayMas?: unknown; siguienteCursor?: unknown } | null
  const cursor = datos?.siguienteCursor
  // Se descarta todo lo que no sea de esta sala o no tenga la forma esperada.
  if (!respuesta.success || !datos || !Array.isArray(datos.mensajes) || !datos.mensajes.every(m => esMensaje(m) && m.salaId === id)
    || typeof datos.hayMas !== 'boolean' || !(cursor === null || (typeof cursor === 'string' && formatoCursor.test(cursor)))
    || (datos.hayMas && cursor === null)) {
    throw new ApiError('No pudimos leer el historial del chat. Intenta de nuevo.')
  }
  return { mensajes: datos.mensajes, hayMas: datos.hayMas, siguienteCursor: cursor }
}
