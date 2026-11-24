// Forma de los mensajes y la presencia que entrega backend-realtime (chat:mensaje, sala:presencia)
// y backend-api (GET /api/salas/:id/mensajes). El frontend no inventa datos: solo los muestra.
export type Mensaje = { id: string; salaId: string; autor: string; texto: string; creadoEn: string; esPropio: boolean }
export type Participante = { nombre: string; esAnfitrion: boolean }
export type CambioPresencia = { tipo: 'entro' | 'salio'; nombre: string }
