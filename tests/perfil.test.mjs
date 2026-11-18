import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
const { cambiosPerfil, validarPerfil } = await import('../src/services/validarPerfil.ts')
const { consultarPerfil, editarPerfil } = await import('../src/services/api/usuarios.ts')
const { ApiError } = await import('../src/services/api/apiClient.ts')
const { AuthContext } = await import('../src/context/auth.ts')
const { Perfil } = await import('../src/pages/Perfil.tsx')
const perfil = { nombres: 'Lucía', apellidos: 'Pérez', username: 'lucia_1', correo: 'lucia@example.com', avatar: 'avatar2', creadoEn: null }
const usuario = { uid: 'usuario-A', getIdToken: async () => 'token-prueba' }

async function conFetch(respuesta, accion) {
  const original = globalThis.fetch
  const llamadas = []
  globalThis.fetch = async (url, opciones) => { llamadas.push({ url, ...opciones }); return respuesta() }
  try { await accion(llamadas) } finally { globalThis.fetch = original }
}

test('editar perfil valida todos los datos sin exigir contraseña y sin aceptar un avatar ajeno', () => {
  assert.deepEqual(validarPerfil(perfil), {})
  const errores = validarPerfil({ nombres: ' ', apellidos: 'a'.repeat(51), username: 'ab', correo: 'invalido', avatar: 'avatar7' })
  assert.deepEqual(Object.keys(errores).sort(), ['apellidos', 'avatar', 'correo', 'nombres', 'username'])
  assert.ok(validarPerfil({ ...perfil, correo: 'a'.repeat(255) + '@ejemplo.com' }).correo)
})

test('US-04 envía PATCH autenticado al perfil propio y conserva la respuesta del servidor', async () => {
  await conFetch(() => new Response(JSON.stringify({ success: true, data: perfil }), { status: 200 }), async llamadas => {
    assert.deepEqual(await editarPerfil(usuario, perfil), perfil)
    assert.equal(llamadas.length, 1)
    assert.equal(llamadas[0].method, 'PATCH')
    assert.equal(llamadas[0].headers.Authorization, 'Bearer token-prueba')
    assert.equal(llamadas[0].url, 'https://api.invalid/api/usuarios/yo')
    assert.equal(JSON.parse(llamadas[0].body).username, perfil.username)
  })
})

test('colisiones de username y correo conservan el error del campo y no reintentan escrituras', async () => {
  for (const campo of ['username', 'correo']) {
    await conFetch(() => new Response(JSON.stringify({ message: 'Ya está en uso.', errores: { [campo]: 'Prueba con otro.' } }), { status: 409 }), async llamadas => {
      await assert.rejects(editarPerfil(usuario, perfil), e => e instanceof ApiError && e.status === 409 && e.errores[campo] === 'Prueba con otro.')
      assert.equal(llamadas.length, 1)
    })
  }
})

function renderizar(elemento, cambios = {}, entrada = '/perfil') {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [entrada] }, createElement(AuthContext.Provider, { value: {
    usuario, perfil, estado: 'completo', error: '', modificandoCuenta: false,
    cerrandoSesion: false, googleActivo: false, correoActivo: false, avisoGoogle: null,
    guardarPerfil: async () => perfil, ...cambios,
  } }, elemento)))
}

test('perfil abre con datos desactivados y selector de avatares oculto hasta editar', () => {
  const html = renderizar(createElement(Perfil))
  assert.match(html, /value="lucia@example.com"/)
  for (const campo of ['nombres', 'apellidos', 'username', 'correo']) {
    const input = html.match(new RegExp('<input(?=[^>]*id="perfil-' + campo + '")[^>]*>'))?.[0]
    assert.match(input ?? '', /disabled=""/)
  }
  assert.doesNotMatch(html, /<fieldset|name="avatar"/)
  assert.match(html, /aria-controls="formulario-perfil" aria-expanded="false"/)
  assert.match(html, />Editar perfil<\/button>/)
  assert.doesNotMatch(html, /Guardar cambios|>Cancelar<|Eliminar mi cuenta|Crear sala/)
  assert.doesNotMatch(html, /Datos de ejemplo|samuel@/)
  const ocupado = renderizar(createElement(Perfil), { modificandoCuenta: true })
  assert.match(ocupado, /aria-busy="true"/)
  assert.match(ocupado, /<button[^>]*disabled=""[^>]*>Editar perfil/)
})

test('cambiar solo nickname no envía correo, UID, fechas ni otros datos a PATCH', async () => {
  const cambios = cambiosPerfil(perfil, { ...perfil, username: 'nuevo_nickname' })
  assert.deepEqual(cambios, { username: 'nuevo_nickname' })
  await conFetch(() => new Response(JSON.stringify({ success: true, data: { ...perfil, ...cambios } })), async llamadas => {
    const nuevo = await editarPerfil(usuario, cambios)
    assert.equal(nuevo.username, 'nuevo_nickname')
    assert.deepEqual(JSON.parse(llamadas[0].body), { username: 'nuevo_nickname' })
  })
  assert.deepEqual(cambiosPerfil(perfil, { ...perfil, correo: ' LUCIA@example.com ' }), {})
  assert.deepEqual(cambiosPerfil(perfil, { ...perfil, correo: 'otro@example.com' }), { correo: 'otro@example.com' })
})

test('edición filtra campos ajenos al contrato y no envía peticiones vacías', async () => {
  await conFetch(() => new Response(JSON.stringify({ success: true, data: perfil })), async llamadas => {
    await editarPerfil(usuario, { ...perfil, uid: 'otro-usuario', rol: 'admin' })
    const cuerpo = JSON.parse(llamadas[0].body)
    assert.equal(cuerpo.uid, undefined)
    assert.equal(cuerpo.rol, undefined)
    assert.equal(cuerpo.creadoEn, undefined)
  })
  await conFetch(() => { throw new Error('No debe llamar a la API') }, async llamadas => {
    await assert.rejects(editarPerfil(usuario, {}), /No hay cambios/)
    assert.equal(llamadas.length, 0)
  })
})

test('404 HTML de la ruta no provoca registro ni se confunde con perfil inexistente', async () => {
  await conFetch(() => new Response('<pre>Cannot GET /api/usuarios/yo</pre>', { status: 404, headers: { 'Content-Type': 'text/html' } }), async () => {
    await assert.rejects(consultarPerfil(usuario), e => e instanceof ApiError && e.status === 404 && !e.respuestaApi)
  })
  await conFetch(() => new Response('<pre>Cannot PATCH /api/usuarios/yo</pre>', { status: 404 }), async () => {
    await assert.rejects(editarPerfil(usuario, { username: 'nuevo' }), e => e.status === 404 && /edición del perfil no está disponible/.test(e.message))
  })
  await conFetch(() => new Response(JSON.stringify({ success: false, message: 'Este usuario aún no tiene perfil.' }), { status: 404 }), async () => {
    assert.equal(await consultarPerfil(usuario), null)
    await assert.rejects(editarPerfil(usuario, { username: 'nuevo' }), /Este usuario aún no tiene perfil/)
  })
})

test('una respuesta de guardado incompleta nunca reemplaza el perfil de la sesión', async () => {
  for (const data of [{}, { nombres: 'Lucía' }, null]) {
    await conFetch(() => new Response(JSON.stringify({ success: true, data })), async () => {
      await assert.rejects(editarPerfil(usuario, { username: 'nuevo' }), /No pudimos confirmar/)
    })
  }
})

test('GET de perfil espera el token y realiza una sola petición con Authorization', async () => {
  let entregar;
  const token = new Promise(resolve => { entregar = resolve })
  await conFetch(() => new Response(JSON.stringify({ success: true, data: perfil })), async llamadas => {
    const promesa = consultarPerfil({ getIdToken: () => token })
    await Promise.resolve()
    assert.equal(llamadas.length, 0)
    entregar('token-firebase')
    assert.deepEqual(await promesa, perfil)
    assert.equal(llamadas.length, 1)
    assert.equal(llamadas[0].method, 'GET')
    assert.equal(llamadas[0].headers.Authorization, 'Bearer token-firebase')
  })
})

test('ninguna operación de usuarios puede enviarse sin token aunque otro llamador omita autorización', async () => {
  const { apiGet, apiPost, apiPatch } = await import('../src/services/api/apiClient.ts')
  await conFetch(() => { throw new Error('No debe enviar peticiones anónimas') }, async llamadas => {
    await assert.rejects(apiGet('/api/usuarios/yo'), /No pudimos obtener tu sesión/)
    await assert.rejects(apiPost('/api/usuarios', {}, ''), /No pudimos obtener tu sesión/)
    await assert.rejects(apiPatch('/api/usuarios/yo', { username: 'nuevo' }, ' '), /No pudimos obtener tu sesión/)
    assert.equal(llamadas.length, 0)
  })
})

test('un rechazo del servidor conserva referencia y revisión para correlacionarlo sin guardar tokens', async () => {
  const id = '12345678-1234-4234-8234-123456789abc'
  await conFetch(() => new Response(JSON.stringify({ success: false, message: 'No autorizado: debes iniciar sesión', code: 'AUTH_HEADER_MISSING', requestId: id }), { status: 401, headers: { 'X-Request-Id': id, 'X-App-Revision': '26cf490' } }), async () => {
    await assert.rejects(consultarPerfil(usuario), e => e.status === 401 && e.requestId === id && e.revision === '26cf490' && !JSON.stringify(e).includes('token-prueba'))
  })
})
