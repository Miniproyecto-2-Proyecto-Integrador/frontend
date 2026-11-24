import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
const { MAX_MENSAJE, esMensaje, fusionarMensajes, formatearMomento, textoPresencia, textoAnuncioMensaje, validarTextoMensaje } = await import('../src/services/chat.ts')

const m = (id, creadoEn, extra = {}) => ({ id, salaId: 'Ab3_xY-9', autor: 'ana', texto: 'hola', creadoEn, esPropio: false, ...extra })

test('un mensaje vacío, solo con espacios o demasiado largo no se envía', () => {
  assert.match(validarTextoMensaje(''), /Escribe un mensaje/)
  assert.match(validarTextoMensaje(' \n\t '), /Escribe un mensaje/)
  assert.match(validarTextoMensaje('a'.repeat(MAX_MENSAJE + 1)), /2000 caracteres/)
  assert.equal(validarTextoMensaje('a'.repeat(MAX_MENSAJE)), '')
  assert.equal(validarTextoMensaje('  hola  '), '')
})
test('solo se aceptan mensajes bien formados', () => {
  assert.equal(esMensaje(m('1', '2026-11-23T15:00:00.000Z')), true)
  for (const roto of [null, 'x', {}, m('', '2026-11-23T15:00:00.000Z'), m('1', 'no-es-fecha'), m('1', '2026-11-23T15:00:00.000Z', { texto: 7 }), m('1', '2026-11-23T15:00:00.000Z', { esPropio: 'si' })]) {
    assert.equal(esMensaje(roto), false)
  }
})
test('fusionar ordena cronológicamente, desempata por id y no duplica', () => {
  const a = m('b', '2026-11-23T15:00:00.000Z'); const b = m('a', '2026-11-23T15:00:00.000Z'); const c = m('c', '2026-11-23T14:59:00.000Z')
  assert.deepEqual(fusionarMensajes([a], [b, c]).map(x => x.id), ['c', 'a', 'b'])
  assert.deepEqual(fusionarMensajes([a, b], [a]).map(x => x.id), ['a', 'b'])
  const actuales = [a]
  assert.equal(fusionarMensajes(actuales, []), actuales)
  assert.equal(fusionarMensajes([a], [{ ...a, esPropio: true }])[0].esPropio, true)
})
test('la hora es legible y el día solo aparece si no es hoy', () => {
  const ahora = new Date(2026, 10, 23, 12, 0)
  assert.match(formatearMomento(new Date(2026, 10, 23, 9, 5).toISOString(), ahora), /^\d{1,2}:05/)
  assert.doesNotMatch(formatearMomento(new Date(2026, 10, 23, 9, 5).toISOString(), ahora), /nov/)
  assert.match(formatearMomento(new Date(2026, 10, 20, 9, 5).toISOString(), ahora), /^20 (de )?nov.*, \d{1,2}:05/)
  assert.equal(formatearMomento('no-es-fecha'), '')
})
test('los anuncios para el lector de pantalla son claros y acotados', () => {
  assert.equal(textoPresencia({ tipo: 'entro', nombre: 'ana' }), 'ana entró a la sala.')
  assert.equal(textoPresencia({ tipo: 'salio', nombre: 'ana' }), 'ana salió de la sala.')
  assert.equal(textoAnuncioMensaje(m('1', '2026-11-23T15:00:00.000Z')), 'ana escribió: hola')
  assert.ok(textoAnuncioMensaje(m('1', '2026-11-23T15:00:00.000Z', { texto: 'x'.repeat(500) })).length < 330)
})
