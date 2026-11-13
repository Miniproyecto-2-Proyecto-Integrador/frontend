import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
const { finalizarPerfil } = await import('../src/services/finalizarPerfil.ts')
const { consultarPerfil } = await import('../src/services/api/usuarios.ts')
const { ApiError } = await import('../src/services/api/apiClient.ts')
const { ConsultaCanceladaError } = await import('../src/services/consultaCoordinada.ts')

const usuario = { uid: 'google-A', getIdToken: async () => 'id-token-prueba' }
const datos = { nombres: 'Lucía', apellidos: 'García', username: 'lucia_2026', avatar: 'avatar1' }
const perfil = { ...datos, correo: 'lucia@example.com', creadoEn: null }
const respuesta = (status, body = {}) => new Response(JSON.stringify(body), { status })

test('Google nuevo: GET 404, POST autenticado sin correo/contraseña, GET de confirmación', async t => {
  const peticiones = []
  const cola = [respuesta(404), respuesta(201, { success: true }), respuesta(200, { success: true, data: perfil })]
  t.mock.method(globalThis, 'fetch', async (url, opciones) => {
    peticiones.push({ url, opciones })
    assert.equal(opciones.headers.Authorization, 'Bearer id-token-prueba')
    return cola.shift()
  })
  assert.deepEqual(await finalizarPerfil(usuario, datos, consultarPerfil, () => usuario), perfil)
  assert.deepEqual(peticiones.map(p => p.opciones.method), ['GET', 'POST', 'GET'])
  assert.deepEqual(JSON.parse(peticiones[1].opciones.body), datos)
  assert.equal(peticiones[0].url, 'https://api.invalid/api/usuarios/yo')
  assert.equal(peticiones[1].url, 'https://api.invalid/api/usuarios')
})

test('perfil existente no se vuelve a crear', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => respuesta(200, { success: true, data: perfil }))
  assert.deepEqual(await finalizarPerfil(usuario, datos, consultarPerfil, () => usuario), perfil)
  assert.equal(fetch.mock.callCount(), 1)
})

test('401, 500 y red al consultar no se interpretan como perfil inexistente', async t => {
  for (const status of [401, 500, null]) {
    const fetch = t.mock.method(globalThis, 'fetch', async () => {
      if (status === null) throw new Error('Sin conexión')
      return respuesta(status)
    })
    await assert.rejects(finalizarPerfil(usuario, datos, consultarPerfil, () => usuario), ApiError)
    assert.equal(fetch.mock.callCount(), 1)
    fetch.mock.restore()
  }
})

test('400, 401 y 500 al guardar conservan el error y no confirman acceso al Panel', async t => {
  for (const status of [400, 401, 500]) {
    const cola = [respuesta(404), respuesta(status, { message: 'Revisa los datos', errores: { nombres: 'Revisa tus nombres' } })]
    const fetch = t.mock.method(globalThis, 'fetch', async () => cola.shift())
    await assert.rejects(finalizarPerfil(usuario, datos, consultarPerfil, () => usuario), error =>
      error instanceof ApiError && error.status === status && error.errores.nombres === 'Revisa tus nombres')
    assert.equal(fetch.mock.callCount(), 2)
    fetch.mock.restore()
  }
})

test('409 distingue nombre ocupado de perfil ya creado mediante otra consulta', async t => {
  for (const existe of [false, true]) {
    const cola = [
      respuesta(404), respuesta(409, { message: 'Conflicto', errores: { username: 'Ocupado' } }),
      existe ? respuesta(200, { success: true, data: perfil }) : respuesta(404),
    ]
    const fetch = t.mock.method(globalThis, 'fetch', async () => cola.shift())
    const proceso = finalizarPerfil(usuario, datos, consultarPerfil, () => usuario)
    if (existe) assert.deepEqual(await proceso, perfil)
    else await assert.rejects(proceso, error => error.status === 409 && error.errores.username === 'Ocupado')
    assert.equal(fetch.mock.callCount(), 3)
    fetch.mock.restore()
  }
})

test('un perfil mal formado o no confirmado nunca permite finalizar', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => respuesta(200, { success: true, data: { username: 'incompleto' } }))
  await assert.rejects(finalizarPerfil(usuario, datos, consultarPerfil, () => usuario), /perfil incompleto/)
  fetch.mock.mockImplementation(async () => respuesta(201, { success: true }))
  let lecturas = 0
  await assert.rejects(finalizarPerfil(usuario, datos, async () => { lecturas += 1; return null }, () => usuario), /confirmar tu perfil/)
  assert.equal(lecturas, 2)
})

test('cambio de cuenta durante la consulta impide guardar datos en otra cuenta', async t => {
  let actual = usuario
  const fetch = t.mock.method(globalThis, 'fetch', async () => { assert.fail('No debe guardar') })
  await assert.rejects(finalizarPerfil(usuario, datos, async () => {
    actual = { uid: 'google-B' }; return null
  }, () => actual), ConsultaCanceladaError)
  assert.equal(fetch.mock.callCount(), 0)
})

test('si se perdió la respuesta del POST, el reintento reconoce el perfil y no repite creación', async t => {
  let intento = 0
  const metodos = []
  t.mock.method(globalThis, 'fetch', async (url, opciones) => {
    metodos.push(opciones.method)
    intento += 1
    if (intento === 1) return respuesta(404)
    if (intento === 2) throw new Error('Respuesta perdida')
    return respuesta(200, { success: true, data: perfil })
  })
  await assert.rejects(finalizarPerfil(usuario, datos, consultarPerfil, () => usuario), ApiError)
  assert.deepEqual(await finalizarPerfil(usuario, datos, consultarPerfil, () => usuario), perfil)
  assert.deepEqual(metodos, ['GET', 'POST', 'GET'])
})
