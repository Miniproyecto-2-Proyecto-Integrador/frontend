import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
const { crearSala, listarSalas, validarNombreSala } = await import('../src/services/api/salas.ts')
const sala = { id: 'AbCdEf0123456789GhIj', nombre: 'Cálculo', rol: 'administrador' }
const usuario = { getIdToken: async () => 'token-de-prueba' }

test('nombre de sala: vacío, espacios, límite y caracteres Unicode coinciden con el servidor', () => {
  for (const nombre of ['', '  ', 'a'.repeat(81)]) assert.ok(validarNombreSala(nombre))
  for (const nombre of [' Cálculo ', 'a'.repeat(80), '😀'.repeat(80)]) assert.equal(validarNombreSala(nombre), '')
})
test('crear y listar salas envían el token y respetan el contrato real de la API', async () => {
  const original = globalThis.fetch
  const solicitudes = []
  globalThis.fetch = async (url, opciones) => {
    solicitudes.push({ url, ...opciones })
    return new Response(JSON.stringify({ success: true, data: opciones.method === 'POST' ? sala : [sala] }), { status: opciones.method === 'POST' ? 201 : 200 })
  }
  try {
    assert.deepEqual(await crearSala(usuario, '  Cálculo  '), sala)
    assert.deepEqual(await listarSalas(usuario), [sala])
    assert.equal(solicitudes[0].url, 'https://api.invalid/api/salas')
    assert.equal(solicitudes[0].method, 'POST')
    assert.deepEqual(JSON.parse(solicitudes[0].body), { nombre: 'Cálculo' })
    assert.equal(solicitudes[1].method, 'GET')
    assert.ok(solicitudes.every(s => s.headers.Authorization === 'Bearer token-de-prueba'))
  } finally { globalThis.fetch = original }
})
test('nombre inválido y token vacío no envían peticiones', async () => {
  const original = globalThis.fetch
  let peticiones = 0
  globalThis.fetch = async () => { peticiones++; throw new Error('No debe enviarse') }
  try {
    await assert.rejects(crearSala(usuario, '  '), /1 a 80/)
    await assert.rejects(listarSalas({ getIdToken: async () => ' ' }), /sesión/)
    assert.equal(peticiones, 0)
  } finally { globalThis.fetch = original }
})
test('una lista vacía es válida; respuestas incompletas o no autorizadas no se presentan como salas vacías', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: [] }))
    assert.deepEqual(await listarSalas(usuario), [])
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: [{ ...sala, rol: 'participante' }] }))
    await assert.rejects(listarSalas(usuario), /leer tus salas/)
    globalThis.fetch = async () => new Response(JSON.stringify({ success: false, message: 'Sesión expirada' }), { status: 401 })
    await assert.rejects(listarSalas(usuario), error => error.status === 401 && error.message === 'Sesión expirada')
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, data: { id: sala.id } }))
    await assert.rejects(crearSala(usuario, 'Cálculo'), /confirmar la sala creada/)
  } finally { globalThis.fetch = original }
})
