import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
const { AuthContext } = await import('../src/context/auth.ts')
const { Encabezado } = await import('../src/components/layout/Encabezado.tsx')
const { Panel } = await import('../src/pages/Panel.tsx')
const { Ingreso } = await import('../src/pages/Ingreso.tsx')
const { DialogoCerrarSesion } = await import('../src/components/auth/DialogoCerrarSesion.tsx')
const { RequierePerfil } = await import('../src/components/auth/RequierePerfil.tsx')
const { Layout } = await import('../src/components/layout/Layout.tsx')
const { cierreInicial, reducirCierre } = await import('../src/services/dialogoCierre.ts')

function renderizar(elemento, cambios = {}, entrada = '/') {
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [entrada] },
    createElement(AuthContext.Provider, { value: {
      usuario: { uid: 'A' }, perfil: { nombres: 'Lucía', avatar: 'avatar3' }, estado: 'completo',
      error: '', googleActivo: false, correoActivo: false, cerrandoSesion: false,
      ingresarConGoogle: async () => {}, avisoGoogle: null, ...cambios,
    } }, elemento),
  ))
}

test('encabezado completo enlaza Panel y Mi perfil; conserva menú accesible', () => {
  const html = renderizar(createElement(Encabezado, { onCerrarSesion() {} }))
  assert.match(html, /href="\/dashboard"/)
  assert.match(html, /Mi perfil/)
  assert.match(html, /Cerrar sesión/)
  assert.doesNotMatch(html, /Crear cuenta|Iniciar sesión/)
  assert.match(html, /aria-expanded="false"/)
  assert.match(html, /aria-controls="menu-movil"/)
})

test('visitantes y perfiles inciertos no ven enlaces al Panel', () => {
  for (const estado of ['sin-sesion', 'cargando', 'pendiente', 'error']) {
    const html = renderizar(createElement(Encabezado, { onCerrarSesion() {} }), { estado })
    assert.doesNotMatch(html, /href="\/dashboard"|Mi perfil/)
    assert.match(html, /Iniciar sesión/)
  }
})

test('Panel usa nombre y avatar del perfil y el texto vacío exacto, sin cierre provisional', () => {
  const html = renderizar(createElement(Panel))
  assert.match(html, /Hola, Lucía\./)
  assert.match(html, /aria-label="Avatar 3"/)
  assert.match(html, /Todavía no tienes salas\. Aquí las verás cuando las tengas/)
  assert.doesNotMatch(html, /Esta pantalla se implementará|Cerrar sesión/)
})

test('Panel continúa protegido y oculta datos en todos los estados sin confirmar', () => {
  for (const estado of ['sin-sesion', 'cargando', 'pendiente', 'error']) {
    assert.doesNotMatch(renderizar(createElement(Panel), { estado }), /Hola, Lucía|Todavía no tienes salas/)
  }
  const html = renderizar(createElement(RequierePerfil, null, 'Privado'), { cerrandoSesion: true, estado: 'sin-sesion' })
  assert.match(html, /Estamos cerrando tu sesión/)
  assert.doesNotMatch(html, /Privado/)
})

test('formulario conserva Google y bloquea correo durante popup y viceversa', () => {
  const html = renderizar(createElement(Ingreso), { estado: 'sin-sesion', usuario: null })
  assert.match(html, /autoComplete="current-password"/)
  assert.match(html, /Continuar con Google/)
  assert.doesNotMatch(html, /aria-invalid/)
  const popup = renderizar(createElement(Ingreso), { estado: 'sin-sesion', usuario: null, googleActivo: true })
  assert.match(popup, /type="submit"[^>]*disabled=""/)
  const correo = renderizar(createElement(Ingreso), { estado: 'sin-sesion', usuario: null, correoActivo: true })
  assert.match(correo, /<button[^>]*disabled=""[^>]*><svg/)
})

test('diálogo identifica título y descripción y coloca Cancelar primero', () => {
  const html = renderToStaticMarkup(createElement(DialogoCerrarSesion, { ocupado: false, error: '', cancelar() {}, confirmar() {} }))
  assert.match(html, /<dialog[^>]*aria-labelledby="cerrar-sesion-titulo"/)
  assert.match(html, /aria-describedby="cerrar-sesion-detalle"/)
  assert.ok(html.indexOf('>Cancelar</button>') < html.indexOf('>Cerrar sesión</button>'))
})

test('diálogo en cierre impide repetir acciones; el fallo se anuncia y permite reintentar', () => {
  const cerrar = renderToStaticMarkup(createElement(DialogoCerrarSesion, { ocupado: true, error: '', cancelar() {}, confirmar() {} }))
  assert.equal((cerrar.match(/disabled=""/g) ?? []).length, 2)
  assert.match(cerrar, /role="status"/)
  const fallo = renderToStaticMarkup(createElement(DialogoCerrarSesion, { ocupado: false, error: 'Reintenta el cierre.', cancelar() {}, confirmar() {} }))
  assert.match(fallo, /role="alert"/)
  assert.doesNotMatch(fallo, /disabled=""/)
})

test('cancelar un diálogo abierto vuelve al estado inicial; durante el cierre no se cancela', () => {
  const abierto = reducirCierre(cierreInicial, { tipo: 'abrir' })
  assert.equal(abierto.abierto, true)
  assert.deepEqual(reducirCierre(abierto, { tipo: 'cancelar' }), cierreInicial)
  const ocupado = reducirCierre(abierto, { tipo: 'confirmar' })
  assert.equal(ocupado.cerrando, true)
  assert.equal(reducirCierre(ocupado, { tipo: 'cancelar' }), ocupado)
})

test('un fallo mantiene el diálogo y permite confirmar otra vez; el éxito lo limpia', () => {
  const fallo = reducirCierre({ abierto: true, cerrando: true, error: '' }, { tipo: 'fallo', mensaje: 'Reintenta' })
  assert.equal(fallo.abierto, true)
  assert.equal(fallo.cerrando, false)
  assert.equal(reducirCierre(fallo, { tipo: 'confirmar' }).error, '')
  assert.deepEqual(reducirCierre(fallo, { tipo: 'cerrado' }), cierreInicial)
})

test('Inicio anuncia el cierre exitoso y muestra navegación pública', () => {
  const html = renderizar(createElement(Layout), { estado: 'sin-sesion', usuario: null, perfil: null }, {
    pathname: '/', state: { sesionCerrada: true },
  })
  assert.match(html, /Sesión cerrada correctamente/)
  assert.match(html, /role="status"/)
  assert.match(html, /Iniciar sesión/)
  assert.doesNotMatch(html, /Mi perfil/)
})
