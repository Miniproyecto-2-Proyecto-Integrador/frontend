import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const { ChatSala } = await import('../src/components/chat/ChatSala.tsx')
const { ListaParticipantes } = await import('../src/components/chat/ListaParticipantes.tsx')
const { AnunciosSala } = await import('../src/components/chat/AnunciosSala.tsx')

const mensajes = [
  { id: 'a', salaId: 'Ab3_xY-9', autor: 'luis', texto: 'Hola, ¿empezamos?', creadoEn: '2026-11-23T15:00:00.000Z', esPropio: false },
  { id: 'b', salaId: 'Ab3_xY-9', autor: 'ana', texto: 'Sí, vamos', creadoEn: '2026-11-23T15:01:00.000Z', esPropio: true },
]
const chat = (extra = {}) => renderToStaticMarkup(createElement(ChatSala, { mensajes, estado: 'conectada', enviar: async () => {}, ...extra }))

test('el chat muestra autor, hora y texto de cada mensaje y distingue los propios sin depender del color', () => {
  const html = chat()
  assert.match(html, /<strong[^>]*>luis<\/strong><time dateTime="2026-11-23T15:00:00.000Z"/)
  assert.match(html, /<strong[^>]*>Tú<\/strong>/)
  assert.match(html, /Hola, ¿empezamos\?/)
  assert.ok(html.indexOf('luis') < html.indexOf('Tú'), 'orden cronológico')
})
test('la región de mensajes se puede recorrer con teclado y tiene nombre', () => {
  assert.match(chat(), /role="region" aria-label="Mensajes de la sala" tabindex="0"/)
})
test('sala sin mensajes muestra un estado vacío amable', () => {
  assert.match(chat({ mensajes: [] }), /Aún no hay mensajes en esta sala/)
})
test('el campo de mensaje tiene etiqueta, ayuda de teclado y alerta para errores', () => {
  const html = chat()
  assert.match(html, /<label for="mensaje-chat"[^>]*>Escribe un mensaje<\/label>/)
  assert.match(html, /aria-describedby="mensaje-chat-ayuda"/)
  assert.match(html, /Enter envía el mensaje\. Mayús \+ Enter agrega una línea nueva\./)
  assert.match(html, /id="mensaje-chat-error" role="alert"/)
  assert.match(html, /type="submit"[^>]*>.*Enviar/)
})
test('el estado de la conexión se ve con texto', () => {
  assert.match(chat(), /Chat en vivo/)
  assert.match(chat({ estado: 'conectando' }), /Conectando…/)
  assert.match(chat({ estado: 'sin-conexion' }), /Sin conexión/)
})
test('participantes: cantidad, anfitrión primero con etiqueta y «tú» en la propia cuenta', () => {
  const html = renderToStaticMarkup(createElement(ListaParticipantes, {
    participantes: [{ nombre: 'luis', esAnfitrion: true }, { nombre: 'ana', esAnfitrion: false }], estado: 'conectada', miNombre: 'ana',
  }))
  assert.match(html, /Participantes <span[^>]*>\(2\)/)
  assert.match(html, /<ul aria-labelledby="titulo-participantes"/)
  assert.ok(html.indexOf('luis') < html.indexOf('ana'))
  assert.match(html, /Anfitrión/); assert.match(html, /\(tú\)/)
})
test('participantes: carga y pérdida de conexión se explican', () => {
  const sin = estado => renderToStaticMarkup(createElement(ListaParticipantes, { participantes: [], estado }))
  assert.match(sin('conectando'), /Buscando quién está en la sala/)
  assert.match(sin('sin-conexion'), /No pudimos ver quién está en la sala/)
})
test('los anuncios van en una región de estado educada y oculta a la vista', () => {
  const html = renderToStaticMarkup(createElement(AnunciosSala, { anuncios: [{ clave: 1, texto: 'luis entró a la sala.' }, { clave: 2, texto: 'luis escribió: hola' }] }))
  assert.match(html, /role="status" aria-live="polite"[^>]*class="sr-only"/)
  assert.match(html, /<p>luis entró a la sala\.<\/p><p>luis escribió: hola<\/p>/)
})
