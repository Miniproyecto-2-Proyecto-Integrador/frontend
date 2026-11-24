import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
const { obtenerMensajes, LIMITE_HISTORIAL } = await import('../src/services/api/mensajes.ts')
const usuario = { getIdToken: async () => 'token-de-prueba' }
const SALA = 'Ab3_xY-9'
const m = (id, creadoEn = '2026-11-23T15:00:00.000Z', extra = {}) => ({ id, salaId: SALA, autor: 'ana', texto: `texto ${id}`, creadoEn, esPropio: false, ...extra })
const responder = (t, cuerpo, status = 200) => t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(cuerpo), { status }))
const pagina = (extra = {}) => ({ success: true, data: { mensajes: [m('a'), m('b')], hayMas: false, siguienteCursor: null, ...extra } })

test('pide los últimos mensajes a GET /api/salas/:id/mensajes con el token y el límite', async t => {
  const fetch = responder(t, pagina())
  const resultado = await obtenerMensajes(usuario, '  Ab3_xY-9 ')
  const [url, opciones] = fetch.mock.calls[0].arguments
  assert.equal(url, `https://api.invalid/api/salas/${SALA}/mensajes?limite=${LIMITE_HISTORIAL}`)
  assert.equal(opciones.method, 'GET'); assert.equal(opciones.headers.Authorization, 'Bearer token-de-prueba')
  assert.deepEqual(resultado.mensajes.map(x => x.id), ['a', 'b']); assert.equal(resultado.hayMas, false)
})
test('para los anteriores envía el cursor que entregó la API', async t => {
  const fetch = responder(t, pagina({ hayMas: true, siguienteCursor: '1795000000_123000000_abc123' }))
  const resultado = await obtenerMensajes(usuario, SALA, { antes: '1795000000_000000000_zzz9' })
  assert.match(fetch.mock.calls[0].arguments[0], /\?limite=50&antes=1795000000_000000000_zzz9$/)
  assert.equal(resultado.hayMas, true); assert.equal(resultado.siguienteCursor, '1795000000_123000000_abc123')
})
test('ID o cursor inválidos no envían ninguna petición', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('No debe enviarse') })
  await assert.rejects(obtenerMensajes(usuario, '  '), e => e.status === 400 && /Escribe el ID/.test(e.message))
  await assert.rejects(obtenerMensajes(usuario, SALA, { antes: 'no es un cursor' }), e => e.status === 400)
  await assert.rejects(obtenerMensajes({ getIdToken: async () => ' ' }, SALA), /sesión/)
  assert.equal(fetch.mock.callCount(), 0)
})
test('los errores de la API llegan con su mensaje y código (404 sala, 401 sesión, 500)', async t => {
  responder(t, { success: false, message: 'No encontramos una sala con ese ID.' }, 404)
  await assert.rejects(obtenerMensajes(usuario, SALA), e => e.status === 404 && /No encontramos una sala/.test(e.message))
  t.mock.restoreAll(); responder(t, { success: false, message: 'Sesión inválida.' }, 401)
  await assert.rejects(obtenerMensajes(usuario, SALA), e => e.status === 401)
  t.mock.restoreAll(); t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('red') })
  await assert.rejects(obtenerMensajes(usuario, SALA), /No se pudo conectar/)
})
test('respuestas incompletas o de otra sala se rechazan', async t => {
  for (const data of [
    { mensajes: 'no', hayMas: false, siguienteCursor: null },
    { mensajes: [m('a', undefined, { salaId: 'Otra1234' })], hayMas: false, siguienteCursor: null },
    { mensajes: [{ id: 'x' }], hayMas: false, siguienteCursor: null },
    { mensajes: [m('a')], hayMas: 'si', siguienteCursor: null },
    { mensajes: [m('a')], hayMas: true, siguienteCursor: null },
    { mensajes: [m('a')], hayMas: true, siguienteCursor: 'raro' },
  ]) { t.mock.restoreAll(); responder(t, { success: true, data }); await assert.rejects(obtenerMensajes(usuario, SALA), /historial del chat/) }
  t.mock.restoreAll(); responder(t, { success: false }); await assert.rejects(obtenerMensajes(usuario, SALA), /historial del chat/)
})
