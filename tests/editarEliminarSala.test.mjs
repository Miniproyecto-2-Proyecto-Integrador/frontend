import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
const { actualizarSala, eliminarSala } = await import('../src/services/api/salas.ts')
const usuario = { getIdToken: async () => 'token-de-prueba' }
const sala = { id: 'Ab3_xY-9', nombre: 'Estudio nuevo', rol: 'administrador' }
const responder = (t, cuerpo, status = 200) =>
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(cuerpo), { status }))

test('editar envía PATCH /api/salas/:id con el nombre recortado y el token', async t => {
  const fetch = responder(t, { success: true, data: sala })
  assert.deepEqual(await actualizarSala(usuario, ' Ab3_xY-9 ', '  Estudio nuevo  '), sala)
  const [url, opciones] = fetch.mock.calls[0].arguments
  assert.equal(url, 'https://api.invalid/api/salas/Ab3_xY-9')
  assert.equal(opciones.method, 'PATCH')
  assert.equal(opciones.headers.Authorization, 'Bearer token-de-prueba')
  assert.deepEqual(JSON.parse(opciones.body), { nombre: 'Estudio nuevo' })
})
test('editar: nombre vacío, demasiado largo o ID inválido no envían petición', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('No debe enviarse') })
  await assert.rejects(actualizarSala(usuario, sala.id, '   '), error => error.status === 400 && /1 a 80/.test(error.message))
  await assert.rejects(actualizarSala(usuario, sala.id, 'a'.repeat(81)), /1 a 80/)
  await assert.rejects(actualizarSala(usuario, 'corto', 'Nombre'), error => error.status === 400)
  assert.equal(fetch.mock.callCount(), 0)
})
test('editar: 80 caracteres Unicode es válido, igual que en el servidor', async t => {
  responder(t, { success: true, data: { ...sala, nombre: '😀'.repeat(80) } })
  assert.equal((await actualizarSala(usuario, sala.id, '😀'.repeat(80))).nombre, '😀'.repeat(80))
})
test('editar: un 403 de quien no es anfitrión conserva el mensaje y el código del servidor', async t => {
  responder(t, { success: false, message: 'Solo el anfitrión puede editar o eliminar esta sala.' }, 403)
  await assert.rejects(actualizarSala(usuario, sala.id, 'Otro'),
    error => error.status === 403 && /Solo el anfitrión/.test(error.message) && error.respuestaApi === true)
})
test('editar: 404 y respuestas incompletas o de otro ID no se aceptan como cambio guardado', async t => {
  responder(t, { success: false, message: 'No encontramos una sala con ese ID.' }, 404)
  await assert.rejects(actualizarSala(usuario, sala.id, 'Otro'), error => error.status === 404)
  for (const data of [null, { id: sala.id }, { ...sala, id: 'Otro_ID-1' }, { ...sala, rol: 'participante' }, { ...sala, nombre: '' }]) {
    const fetch = responder(t, { success: true, data })
    await assert.rejects(actualizarSala(usuario, sala.id, 'Otro'), /confirmar el cambio/)
    fetch.mock.restore()
  }
})
test('eliminar envía DELETE /api/salas/:id con el token', async t => {
  const fetch = responder(t, { success: true, message: 'Sala eliminada.' })
  await eliminarSala(usuario, '  Ab3_xY-9 ')
  const [url, opciones] = fetch.mock.calls[0].arguments
  assert.equal(url, 'https://api.invalid/api/salas/Ab3_xY-9')
  assert.equal(opciones.method, 'DELETE')
  assert.equal(opciones.headers.Authorization, 'Bearer token-de-prueba')
})
test('eliminar: ID inválido o token vacío no envían petición; 403 y fallo de red se distinguen', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('No debe enviarse') })
  await assert.rejects(eliminarSala(usuario, ''), error => error.status === 400)
  await assert.rejects(eliminarSala({ getIdToken: async () => ' ' }, sala.id), /sesión/)
  assert.equal(fetch.mock.callCount(), 0)
  responder(t, { success: false, message: 'Solo el anfitrión puede editar o eliminar esta sala.' }, 403)
  await assert.rejects(eliminarSala(usuario, sala.id), error => error.status === 403)
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fallo de red') })
  await assert.rejects(eliminarSala(usuario, sala.id), error => error.status === undefined && /No se pudo conectar/.test(error.message))
})
