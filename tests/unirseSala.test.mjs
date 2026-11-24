import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
const { normalizarIdSala, obtenerSala, validarIdSala } = await import('../src/services/api/salas.ts')
const usuario = { getIdToken: async () => 'token-de-prueba' }
const sala = { id: 'Ab3_xY-9', nombre: 'Estudio', rol: 'participante' }
const responder = (t, cuerpo, status = 200) =>
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(cuerpo), { status }))

test('ID de sala: vacío, espacios y formato inválido se explican antes de llamar a la API', () => {
  assert.match(validarIdSala(''), /Escribe el ID/)
  assert.match(validarIdSala('   '), /Escribe el ID/)
  for (const id of ['1234567', '123456789', 'Ab3/xY-9', 'Ab3 xY-9', 'Ab3_xY-9 x', '_'.repeat(20)]) {
    assert.match(validarIdSala(id), /ID de sala válido/, id)
  }
})
test('ID de sala: acepta 8 caracteres URL-safe, IDs anteriores de 20 y recorta los espacios', () => {
  for (const id of ['Ab3_xY-9', 'AbCdEf0123456789GhIj', '  Ab3_xY-9  ', '\tAb3_xY-9\n']) assert.equal(validarIdSala(id), '', id)
  assert.equal(normalizarIdSala('  Ab3_xY-9 '), 'Ab3_xY-9')
})
test('unirse con un ID válido consulta GET /api/salas/:id con el token y respeta el contrato', async t => {
  const fetch = responder(t, { success: true, data: sala })
  assert.deepEqual(await obtenerSala(usuario, '  Ab3_xY-9  '), sala)
  const [url, opciones] = fetch.mock.calls[0].arguments
  assert.equal(url, 'https://api.invalid/api/salas/Ab3_xY-9')
  assert.equal(opciones.method, 'GET')
  assert.equal(opciones.headers.Authorization, 'Bearer token-de-prueba')
})
test('el anfitrión también entra por ID y conserva su rol', async t => {
  responder(t, { success: true, data: { ...sala, rol: 'administrador' } })
  assert.equal((await obtenerSala(usuario, sala.id)).rol, 'administrador')
})
test('un ID vacío o inválido no envía ninguna petición', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('No debe enviarse') })
  await assert.rejects(obtenerSala(usuario, '  '), error => error.status === 400 && /Escribe el ID/.test(error.message))
  await assert.rejects(obtenerSala(usuario, 'corto'), error => error.status === 400)
  await assert.rejects(obtenerSala({ getIdToken: async () => ' ' }, sala.id), /sesión/)
  assert.equal(fetch.mock.callCount(), 0)
})
test('ID inexistente: se muestra el mensaje del servidor con su código 404', async t => {
  responder(t, { success: false, message: 'No encontramos una sala con ese ID. Revisa que esté bien escrito.' }, 404)
  await assert.rejects(obtenerSala(usuario, 'Zz9_zZ-0'),
    error => error.status === 404 && /No encontramos una sala/.test(error.message) && error.respuestaApi === true)
})
test('sin sesión (401) y fallo de red no se confunden con sala inexistente', async t => {
  responder(t, { success: false, message: 'Sesión expirada' }, 401)
  await assert.rejects(obtenerSala(usuario, sala.id), error => error.status === 401)
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fallo de red') })
  await assert.rejects(obtenerSala(usuario, sala.id), error => error.status === undefined && /No se pudo conectar/.test(error.message))
})
test('respuestas incompletas, con otro ID o con rol desconocido no se aceptan como sala', async t => {
  for (const data of [null, { id: sala.id }, { ...sala, id: 'Otro_ID-1' }, { ...sala, rol: 'invitado' }, { ...sala, nombre: '' }]) {
    const fetch = responder(t, { success: true, data })
    await assert.rejects(obtenerSala(usuario, sala.id), /confirmar la sala/)
    fetch.mock.restore()
  }
})
