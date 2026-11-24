import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const { ListaMensajes } = await import('../src/components/chat/ListaMensajes.tsx')
const m = (id, creadoEn = '2026-11-23T15:00:00.000Z', extra = {}) => ({ id, salaId: 'Ab3_xY-9', autor: 'ana', texto: `texto ${id}`, creadoEn, esPropio: false, ...extra })

const base = { estado: 'listo', error: '', hayMas: false, cargandoMas: false, errorMas: '', aviso: '', reintentar() {}, cargarAnteriores: async () => ({ hayMas: false }) }
const lista = (mensajes, historial = {}) => renderToStaticMarkup(createElement(ListaMensajes, { mensajes, historial: { ...base, ...historial } }))

test('cargando el historial: estado de carga y sin mensaje de sala vacía', () => {
  const html = lista([], { estado: 'cargando' })
  assert.match(html, /Cargando…/); assert.match(html, /Estamos trayendo los mensajes/); assert.doesNotMatch(html, /Aún no hay mensajes/)
})
test('historial vacío: mensaje amable', () => assert.match(lista([]), /Aún no hay mensajes en esta sala/))
test('error al cargar: mensaje con reintento y la sala sigue usable', () => {
  const html = lista([], { estado: 'error', error: 'No pudimos cargar los mensajes. Intenta de nuevo.' })
  assert.match(html, /role="alert"/); assert.match(html, /No pudimos cargar los mensajes/); assert.match(html, /Reintentar/)
})
test('historial con mensajes: orden recibido y botón para cargar anteriores solo si hay más', () => {
  const mensajes = [m('a'), m('b', '2026-11-23T15:05:00.000Z', { texto: 'segundo' })]
  const sin = lista(mensajes); assert.doesNotMatch(sin, /Cargar mensajes anteriores/)
  const con = lista(mensajes, { hayMas: true })
  assert.match(con, /Cargar mensajes anteriores/); assert.ok(con.indexOf('texto a') < con.indexOf('segundo'))
})
test('cargando anteriores: el botón lo indica y queda aria-disabled; errores y avisos se anuncian', () => {
  assert.match(lista([m('a')], { hayMas: true, cargandoMas: true }), /aria-disabled="true"[^>]*>.*Cargando…/)
  assert.match(lista([m('a')], { hayMas: true, errorMas: 'No pudimos cargar los mensajes.' }), /role="alert"[^>]*>No pudimos cargar los mensajes\./)
  assert.match(lista([m('a')], { aviso: 'Se cargaron 50 mensajes anteriores.' }), /role="status" class="sr-only">Se cargaron 50 mensajes anteriores\./)
})
