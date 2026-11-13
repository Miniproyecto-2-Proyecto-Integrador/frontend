import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
const { cerrarDesdePanel } = await import('../src/services/cerrarDesdePanel.ts')
const { AuthContext } = await import('../src/context/auth.ts')
const { Panel } = await import('../src/pages/Panel.tsx')
const { RequierePerfil } = await import('../src/components/auth/RequierePerfil.tsx')

test('Panel espera el cierre del contexto antes de navegar al registro', async () => {
  const respuesta = Promise.withResolvers()
  const eventos = []
  const bloqueo = { current: false }
  const proceso = cerrarDesdePanel(bloqueo, () => { eventos.push('contexto'); return respuesta.promise },
    (ruta, opciones) => { eventos.push({ ruta, opciones }) }, estado => eventos.push(estado))
  assert.deepEqual(eventos, ['cerrando', 'contexto'])
  assert.equal(bloqueo.current, true)
  respuesta.resolve()
  await proceso
  assert.deepEqual(eventos, ['cerrando', 'contexto', { ruta: '/registro', opciones: { replace: true } }])
  assert.equal(bloqueo.current, true)
})

test('clics duplicados durante el cierre ejecutan una sola llamada al contexto', async () => {
  const respuesta = Promise.withResolvers()
  const bloqueo = { current: false }
  let llamadas = 0
  let navegaciones = 0
  const cerrar = () => { llamadas += 1; return respuesta.promise }
  const navegar = () => { navegaciones += 1 }
  const primero = cerrarDesdePanel(bloqueo, cerrar, navegar, () => {})
  await cerrarDesdePanel(bloqueo, cerrar, navegar, () => {})
  assert.equal(llamadas, 1)
  respuesta.resolve()
  await primero
  assert.equal(navegaciones, 1)
})

test('un fallo permite reintentar sin navegar antes de confirmar el cierre', async () => {
  const bloqueo = { current: false }
  const estados = []
  const navegaciones = []
  await cerrarDesdePanel(bloqueo, async () => { throw new Error('Firebase falló') },
    ruta => navegaciones.push(ruta), estado => estados.push(estado))
  assert.deepEqual(estados, ['cerrando', 'error'])
  assert.deepEqual(navegaciones, [])
  assert.equal(bloqueo.current, false)
  await cerrarDesdePanel(bloqueo, async () => {}, ruta => navegaciones.push(ruta), estado => estados.push(estado))
  assert.deepEqual(navegaciones, ['/registro'])
})

function renderizar(elemento, estado = 'completo') {
  return renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(AuthContext.Provider, { value: {
      usuario: estado === 'sin-sesion' ? null : { uid: 'google-A', providerData: [{ providerId: 'google.com' }] },
      estado, perfil: null, error: 'Fallo de consulta',
      cerrarSesion: async () => {}, actualizarPerfil: async () => null,
    } }, elemento),
  ))
}

test('el Panel conserva su presentación provisional y ofrece cierre accesible solo con perfil confirmado', () => {
  const html = renderizar(createElement(Panel))
  assert.match(html, /<h1>Panel<\/h1>/)
  assert.match(html, /Esta pantalla se implementará/)
  assert.match(html, /<button[^>]*type="button"[^>]*>Cerrar sesión<\/button>/)
  for (const estado of ['sin-sesion', 'pendiente', 'cargando', 'error']) {
    assert.doesNotMatch(renderizar(createElement(Panel), estado), /<h1>Panel<\/h1>|>Cerrar sesión</)
  }
})

test('si el observador recibe sesión nula durante el cierre, la guarda espera sin exponer el Panel', () => {
  const html = renderizar(createElement(RequierePerfil, { cierreEnCurso: true }, 'Contenido privado'), 'sin-sesion')
  assert.match(html, /Estamos cerrando tu sesión/)
  assert.match(html, /role="status"/)
  assert.doesNotMatch(html, /Contenido privado/)
})
