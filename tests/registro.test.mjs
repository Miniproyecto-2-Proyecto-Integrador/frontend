import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
// Las fuentes se cargan después de registrar la compilación TSX en memoria.
const { AuthContext } = await import('../src/context/auth.ts')
const { Registro, ContadorPaso, BotonSiguiente } = await import('../src/pages/Registro.tsx')
const { formularioInicial, reducirFormulario } = await import('../src/services/asistenteRegistro.ts')
const { SelectorAvatar } = await import('../src/components/auth/SelectorAvatar.tsx')
const { CampoFormulario } = await import('../src/components/auth/CampoFormulario.tsx')
const { consultarPerfil } = await import('../src/services/api/usuarios.ts')
const { ApiError } = await import('../src/services/api/apiClient.ts')
const { confirmarCierreSesion } = await import('../src/services/confirmarCierreSesion.ts')

function pantalla(estado, usuario = { uid: 'A', email: 'activa@example.com' }) {
  return renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(AuthContext.Provider, {
      value: { estado, usuario, perfil: null, error: 'API sin conexión', actualizarPerfil: async () => null, cerrarSesion: async () => {} },
    }, createElement(Registro)),
  ))
}

test('error de consulta bloquea el envío y mantiene un reintento y el correo accesibles', () => {
  const html = pantalla('error')
  assert.match(html, /<button[^>]*type="submit"[^>]*disabled=""[^>]*>Completar registro<\/button>/)
  assert.match(html, /<button[^>]*>Reintentar<\/button>/)
  assert.match(html, /activa@example.com/)
  assert.match(html, /Cambiar de cuenta/)
  assert.match(html, /id="nombres"/)
  assert.match(html, /registro está bloqueado/)
})

test('el registro completo ofrece Cerrar sesión junto a Ir al Panel', () => {
  const html = pantalla('completo')
  assert.match(html, /Tu cuenta y tu perfil están listos/)
  assert.match(html, /href="\/dashboard"[^>]*>Ir al Panel/)
  assert.match(html, /<button[^>]*type="button"[^>]*>Cerrar sesión<\/button>/)
  assert.doesNotMatch(html, /<form/)
})

test('tras el cierre confirmado y reinicio vuelve el formulario vacío del paso 1', async () => {
  let usuario = { uid: 'A', email: 'anterior@example.com' }
  let estado = 'completo'
  let formulario = {
    ...formularioInicial, paso: 2,
    datos: { nombres: 'Anterior', apellidos: 'Persona', username: 'anterior', avatar: 'avatar1', correo: usuario.email, password: 'Anterior8' },
  }
  await confirmarCierreSesion(
    async () => { usuario = null },
    () => usuario !== null,
    () => { estado = 'sin-sesion' },
  )
  formulario = reducirFormulario(formulario, { tipo: 'reiniciar' })
  assert.deepEqual(formulario, formularioInicial)
  const html = pantalla(estado, usuario)
  assert.match(html, /Paso 1 de 2/)
  assert.match(html, /id="nombres"/)
  assert.match(html, /Siguiente/)
  assert.doesNotMatch(html, /anterior@example.com|Anterior8|Tu cuenta y tu perfil están listos/)
})

test('la consulta en curso conserva el formulario visible y bloquea el envío', () => {
  const html = pantalla('cargando', null)
  assert.match(html, /<form/)
  assert.match(html, /id="nombres"/)
  assert.match(html, /<button[^>]*type="button"[^>]*disabled=""[^>]*>Siguiente<\/button>/)
})

test('perfil pendiente permite completar datos sin volver a pedir credenciales', () => {
  const html = pantalla('pendiente')
  assert.match(html, /Completar perfil/)
  assert.doesNotMatch(html, /Paso 1 de 1|id="correo"|id="password"|>Siguiente<|>Anterior</)
  assert.match(html, /Tu perfil aún no existe/)
  assert.doesNotMatch(html, /id="password"/)
  assert.match(html, /Completar registro/)
  assert.match(html, /id="nombres"/)
  assert.match(html, /id="apellidos"/)
  assert.match(html, /id="username"/)
  assert.equal((html.match(/type="radio"/g) ?? []).length, 6)
  assert.doesNotMatch(html, /Acceso<\/span>/)
})

test('Tu perfil muestra sus cuatro campos y el contador de dos pasos, sin credenciales', () => {
  const html = pantalla('sin-sesion', null)
  assert.match(html, /Paso 1 de 2/)
  assert.doesNotMatch(html, /<ol|aria-current="step"/)
  assert.match(html, /id="nombres"/)
  assert.match(html, /id="apellidos"/)
  assert.match(html, /id="username"/)
  assert.equal((html.match(/type="radio"/g) ?? []).length, 6)
  assert.doesNotMatch(html, /id="correo"|id="password"/)
  assert.doesNotMatch(html, /type="submit"/)
  assert.match(html, /Tu perfil/)
  assert.doesNotMatch(html, />Identidad<|>Acceso</)
})

test('el contador acompaña los dos pasos y muestra Completar perfil en recuperación', () => {
  for (const pendiente of [false, true]) {
    const total = pendiente ? 1 : 2
    let estado = {
      ...formularioInicial,
      datos: { nombres: 'Lucía', apellidos: 'García', username: 'lucia_2026', avatar: 'avatar1', correo: '', password: '' },
    }
    const comprobar = () => {
      const html = renderToStaticMarkup(createElement(ContadorPaso, { actual: estado.paso, total }))
      assert.match(html, total === 1 ? />Completar perfil<\/p>/ : new RegExp(`>Paso ${estado.paso} de ${total}</p>`))
      assert.doesNotMatch(html, /Paso 1 de 1|de 3/)
      assert.doesNotMatch(html, /aria-hidden|<ol|<li/)
    }
    comprobar()
    while (estado.paso < total) {
      estado = reducirFormulario(estado, { tipo: 'siguiente', pendiente })
      comprobar()
    }
    while (estado.paso > 1) {
      estado = reducirFormulario(estado, { tipo: 'anterior', pasoActual: estado.paso })
      comprobar()
    }
  }
})

test('Siguiente cancela la acción predeterminada antes de abrir Acceso', () => {
  let estado = {
    ...formularioInicial,
    datos: { nombres: 'Lucía', apellidos: 'García', username: 'lucia_2026', avatar: 'avatar1', correo: '', password: '' },
  }
  let cancelado = false
  const boton = BotonSiguiente({ disabled: false, avanzar() {
    assert.equal(cancelado, true)
    estado = reducirFormulario(estado, { tipo: 'siguiente', pendiente: false })
  } })
  assert.equal(boton.props.type, 'button')
  boton.props.onClick({ preventDefault() { cancelado = true } })
  assert.equal(estado.paso, 2)
  assert.deepEqual(estado.errores, {})
})

test('Acceso conserva ayudas y semántica neutral hasta un intento inválido', () => {
  let estado = reducirFormulario({
    ...formularioInicial,
    datos: { nombres: 'Lucía', apellidos: 'García', username: 'lucia_2026', avatar: 'avatar1', correo: '', password: '' },
  }, { tipo: 'siguiente', pendiente: false })
  const campo = id => renderToStaticMarkup(createElement(CampoFormulario, {
    id, etiqueta: id === 'correo' ? 'Correo electrónico' : 'Contraseña',
    error: estado.errores[id], value: estado.datos[id], onChange() {},
    ayuda: id === 'password' ? 'Al menos ocho caracteres, una letra y un número.' : undefined,
  }))
  assert.doesNotMatch(campo('correo'), /aria-invalid|border-error|correo-error/)
  assert.doesNotMatch(campo('password'), /aria-invalid|border-error|password-error/)
  assert.match(campo('password'), /aria-describedby="password-ayuda"/)
  estado = reducirFormulario(estado, { tipo: 'validar-envio', pendiente: false })
  assert.match(campo('correo'), /aria-invalid="true"/)
  assert.match(campo('correo'), /aria-describedby="correo-error"/)
  assert.match(campo('password'), /aria-invalid="true"/)
  assert.match(campo('password'), /aria-describedby="password-ayuda password-error"/)
})

test('los errores de campo y avatar se asocian a sus controles', () => {
  const campo = renderToStaticMarkup(createElement(CampoFormulario, {
    id: 'nombres', etiqueta: 'Nombres', error: 'Escribe tus nombres.', ayuda: 'Máximo 50 caracteres.',
  }))
  assert.match(campo, /for="nombres"/)
  assert.match(campo, /aria-describedby="nombres-ayuda nombres-error"/)
  assert.match(campo, /aria-invalid="true"/)
  const avatar = renderToStaticMarkup(createElement(SelectorAvatar, {
    valor: 'avatar2', onChange() {}, error: 'Elige un avatar.', disabled: false,
  }))
  assert.equal((avatar.match(/type="radio"/g) ?? []).length, 6)
  assert.equal((avatar.match(/aria-describedby="avatar-error"/g) ?? []).length, 7)
  assert.match(avatar, /checked="" value="avatar2"/)
})

test('solo 404 significa perfil inexistente; errores de consulta se propagan', async t => {
  const usuario = { getIdToken: async () => 'token-de-prueba-local' }
  const fetchMock = t.mock.method(globalThis, 'fetch')
  fetchMock.mock.mockImplementation(async () => new Response('{}', { status: 404 }))
  assert.equal(await consultarPerfil(usuario), null)
  for (const status of [401, 500]) {
    fetchMock.mock.mockImplementation(async () => new Response('{}', { status }))
    await assert.rejects(consultarPerfil(usuario), error => error instanceof ApiError && error.status === status)
  }
  fetchMock.mock.mockImplementation(async () => { throw new Error('Sin conexión') })
  await assert.rejects(consultarPerfil(usuario), error => error instanceof ApiError && error.status === undefined)
})
