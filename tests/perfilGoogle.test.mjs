import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
const { AuthContext } = await import('../src/context/auth.ts')
const { ElegirUsuario } = await import('../src/pages/ElegirUsuario.tsx')
const { Registro } = await import('../src/pages/Registro.tsx')
const { Ingreso } = await import('../src/pages/Ingreso.tsx')
const { BotonGoogle } = await import('../src/components/auth/BotonGoogle.tsx')
const { RequierePerfil } = await import('../src/components/auth/RequierePerfil.tsx')
const { validarRegistro } = await import('../src/services/validarRegistro.ts')
const { confirmarCierreSesion } = await import('../src/services/confirmarCierreSesion.ts')

const google = {
  uid: 'google-A', displayName: 'Nombre sin dividir', email: 'google@example.com',
  providerData: [{ providerId: 'google.com' }],
}
function renderizar(componente, cambios = {}) {
  const contexto = {
    usuario: google, perfil: null, estado: 'pendiente', error: '',
    actualizarPerfil: async () => null, cerrarSesion: async () => {},
    ingresarConGoogle: async () => { assert.fail('No debe abrir un popup al montar') },
    googleActivo: false, avisoGoogle: null, ...cambios,
  }
  return renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(AuthContext.Provider, { value: contexto }, componente),
  ))
}

test('Google pendiente muestra cuatro campos, seis avatares y la identidad solo como referencia', () => {
  const html = renderizar(createElement(ElegirUsuario))
  for (const campo of ['nombres', 'apellidos', 'username']) assert.match(html, new RegExp(`id="${campo}"`))
  assert.equal((html.match(/type="radio"/g) ?? []).length, 6)
  assert.match(html, /Nombre sin dividir/)
  assert.match(html, /google@example.com/)
  assert.doesNotMatch(html, /id="correo"|id="password"|autoComplete="new-password"/)
  assert.match(html, /Cambiar de cuenta/)
  assert.match(html, /id="nombres"[^>]*value=""/)
})

test('restaurar sesión pendiente no repite Google; carga inicial y errores no habilitan guardar', () => {
  const restaurando = renderizar(createElement(ElegirUsuario), { estado: 'cargando', usuario: null })
  assert.match(restaurando, /restaurando tu sesión/)
  assert.doesNotMatch(restaurando, /<form/)
  const consultando = renderizar(createElement(ElegirUsuario), { estado: 'cargando' })
  assert.match(consultando, /<form/)
  assert.match(consultando, /type="submit"[^>]*disabled=""/)
  const fallo = renderizar(createElement(ElegirUsuario), { estado: 'error', error: 'No se pudo consultar la API' })
  assert.match(fallo, /Reintentar/)
  assert.match(fallo, /Cambiar de cuenta/)
  assert.match(fallo, /type="submit"[^>]*disabled=""/)
})

test('Google sin correo muestra explicación y permite cambiar de cuenta', () => {
  const html = renderizar(createElement(ElegirUsuario), { usuario: { ...google, email: null } })
  assert.match(html, /sin un correo/)
  assert.match(html, /type="submit"[^>]*disabled=""/)
  assert.match(html, /Cambiar de cuenta/)
})

test('un perfil completo no muestra un formulario para crear otro', () => {
  assert.doesNotMatch(renderizar(createElement(ElegirUsuario), { estado: 'completo' }), /<form/)
  const registro = renderizar(createElement(Registro), { estado: 'completo' })
  // Navigate no genera HTML en SSR: Google confirmado deja de mostrar la confirmación manual.
  assert.equal(registro, '')
})

test('Google existente solo sale del registro después de terminar la consulta y la operación', () => {
  assert.equal(renderizar(createElement(Registro), { estado: 'completo' }), '')
  assert.equal(renderizar(createElement(Registro), { estado: 'pendiente' }), '')
  assert.notEqual(renderizar(createElement(Registro), { estado: 'completo', googleActivo: true }), '')
  assert.notEqual(renderizar(createElement(Registro), { estado: 'cargando', googleActivo: true }), '')
  assert.notEqual(renderizar(createElement(Registro), { estado: 'cargando' }), '')
})

test('un fallo de consulta en registro permite reintentar sin redirigir como perfil confirmado', () => {
  const html = renderizar(createElement(Registro), { estado: 'error', error: 'Error de consulta de perfil' })
  assert.match(html, /Error de consulta de perfil/)
  assert.match(html, /Reintentar/)
  assert.match(html, /registro está bloqueado/)
  assert.doesNotMatch(html, /Tu cuenta y tu perfil están listos/)
})

test('US-01 conserva el mensaje y los botones de confirmación para una cuenta manual', () => {
  const html = renderizar(createElement(Registro), {
    estado: 'completo', usuario: { ...google, providerData: [{ providerId: 'password' }] },
  })
  assert.match(html, /Tu cuenta y tu perfil están listos/)
  assert.match(html, /Ir al Panel/)
  assert.match(html, /Cerrar sesión/)
})

test('el dashboard oculta su contenido durante carga, error, ausencia de sesión y perfil pendiente', () => {
  const panel = createElement(RequierePerfil, null, createElement('p', null, 'Panel privado'))
  for (const estado of ['cargando', 'error', 'sin-sesion', 'pendiente']) {
    assert.doesNotMatch(renderizar(panel, { estado }), /Panel privado/)
  }
  assert.match(renderizar(panel, { estado: 'completo' }), /Panel privado/)
})

test('el botón Google aparece solo en ingresar y anuncia cancelación o bloqueo correctamente', () => {
  assert.match(renderizar(createElement(Ingreso), { estado: 'sin-sesion', usuario: null }), /Continuar con Google/)
  assert.doesNotMatch(renderizar(createElement(Registro), { estado: 'sin-sesion', usuario: null }), /Continuar con Google/)
  const cargando = renderizar(createElement(BotonGoogle), { googleActivo: true })
  assert.match(cargando, /disabled=""/)
  assert.match(cargando, /Conectando con Google/)
  assert.match(renderizar(createElement(BotonGoogle), {
    avisoGoogle: { tipo: 'cancelacion', mensaje: 'Cancelado' },
  }), /role="status"[^>]*>Cancelado/)
  assert.match(renderizar(createElement(BotonGoogle), {
    avisoGoogle: { tipo: 'bloqueado', mensaje: 'Popup bloqueado' },
  }), /role="alert"[^>]*>Popup bloqueado/)
})

test('el logotipo Google es local y decorativo y el botón conserva su etiqueta', () => {
  const html = renderizar(createElement(BotonGoogle))
  assert.match(html, /<svg aria-hidden="true" focusable="false"/)
  for (const color of ['#4285F4', '#34A853', '#FBBC05', '#EA4335']) assert.ok(html.includes(color))
  assert.match(html, /Continuar con Google/)
  assert.doesNotMatch(html, /<img|<image|<title/)
})

test('ingresar es mínimo para Google, conserva acceso a registro y no solicita credenciales', () => {
  const html = renderizar(createElement(Ingreso), { estado: 'sin-sesion', usuario: null })
  assert.match(html, /Iniciar sesión/)
  assert.match(html, /href="\/registro"/)
  assert.match(html, /Crear cuenta/)
  assert.doesNotMatch(html, /<input|<form/)
})

test('ingresar espera restauración y popup y solo resuelve destino con estado confirmado', () => {
  assert.notEqual(renderizar(createElement(Ingreso), { estado: 'cargando', usuario: null }), '')
  assert.notEqual(renderizar(createElement(Ingreso), { estado: 'cargando' }), '')
  assert.notEqual(renderizar(createElement(Ingreso), { estado: 'completo', googleActivo: true }), '')
  assert.equal(renderizar(createElement(Ingreso), { estado: 'completo' }), '')
  assert.equal(renderizar(createElement(Ingreso), { estado: 'pendiente' }), '')
  assert.equal(renderizar(createElement(Ingreso), {
    estado: 'pendiente', usuario: { ...google, providerData: [{ providerId: 'password' }] },
  }), '')
})

test('ingresar permite reintentar errores de consulta sin anunciar perfil inexistente', () => {
  const html = renderizar(createElement(Ingreso), { estado: 'error', error: 'Error de consulta API' })
  assert.match(html, /Error de consulta API/)
  assert.match(html, /Reintentar/)
  assert.doesNotMatch(html, /Tu perfil aún no existe|Tu cuenta y tu perfil están listos/)
})

test('las validaciones de perfil no exigen credenciales y mantienen los límites y avatar', () => {
  const datos = { nombres: '', apellidos: '', username: 'ál', avatar: '', correo: '', password: '' }
  assert.deepEqual(Object.keys(validarRegistro(datos, true)), ['nombres', 'apellidos', 'username', 'avatar'])
})

test('el cierre confirmado permite abandonar la finalización sin volver a pedir popup', async () => {
  let usuario = google
  let estado = 'pendiente'
  await confirmarCierreSesion(async () => { usuario = null }, () => !!usuario, () => { estado = 'sin-sesion' })
  const html = renderizar(createElement(ElegirUsuario), { usuario, estado })
  assert.doesNotMatch(html, /<form|google@example.com/)
})
