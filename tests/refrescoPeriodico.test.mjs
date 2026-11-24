import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
const { iniciarRefresco } = await import('../src/services/refrescoPeriodico.ts')
const { mismasSalas } = await import('../src/hooks/useSalasPropias.ts')

function entorno() {
  const escuchas = new Map()
  const objetivo = () => ({
    addEventListener: (tipo, f) => escuchas.set(tipo, f),
    removeEventListener: tipo => escuchas.delete(tipo),
  })
  return { escuchas, documento: { ...objetivo(), visibilityState: 'visible' }, ventana: objetivo() }
}
const esperar = () => new Promise(resolver => setImmediate(resolver))

test('refresca cada intervalo mientras la pestaña está visible y deja de hacerlo al detener', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] })
  const { documento, ventana, escuchas } = entorno(); let llamadas = 0
  const detener = iniciarRefresco({ refrescar: async () => { llamadas++ }, intervaloMs: 1000, documento, ventana })
  t.mock.timers.tick(1000); await esperar(); t.mock.timers.tick(1000); await esperar()
  assert.equal(llamadas, 2)
  detener(); t.mock.timers.tick(5000); await esperar()
  assert.equal(llamadas, 2); assert.equal(escuchas.size, 0)
})
test('no consulta con la pestaña oculta y vuelve a consultar al recuperar el foco', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] })
  const { documento, ventana, escuchas } = entorno(); let llamadas = 0
  iniciarRefresco({ refrescar: async () => { llamadas++ }, intervaloMs: 1000, documento, ventana })
  documento.visibilityState = 'hidden'; t.mock.timers.tick(3000); await esperar()
  assert.equal(llamadas, 0)
  documento.visibilityState = 'visible'; escuchas.get('visibilitychange')(); await esperar()
  assert.equal(llamadas, 1)
  escuchas.get('focus')(); await esperar(); assert.equal(llamadas, 2)
})
test('no solapa peticiones y un fallo no detiene los siguientes refrescos', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] })
  const { documento, ventana } = entorno(); let llamadas = 0; let liberar
  iniciarRefresco({
    intervaloMs: 1000, documento, ventana,
    refrescar: () => { llamadas++; return llamadas === 1 ? new Promise(resolver => { liberar = resolver }) : Promise.reject(new Error('red')) },
  })
  t.mock.timers.tick(1000); t.mock.timers.tick(1000); await esperar()
  assert.equal(llamadas, 1)
  liberar(); await esperar(); t.mock.timers.tick(1000); await esperar()
  assert.equal(llamadas, 2); t.mock.timers.tick(1000); await esperar()
  assert.equal(llamadas, 3)
})
test('mismasSalas detecta altas, bajas y cambios de nombre', () => {
  const a = { id: 'Ab3_xY-9', nombre: 'Uno', rol: 'administrador' }
  assert.equal(mismasSalas([a], [{ ...a }]), true)
  assert.equal(mismasSalas([a], []), false)
  assert.equal(mismasSalas([a], [{ ...a, nombre: 'Dos' }]), false)
  assert.equal(mismasSalas([a], [{ ...a, id: 'Zz9_zZ-0' }]), false)
})
