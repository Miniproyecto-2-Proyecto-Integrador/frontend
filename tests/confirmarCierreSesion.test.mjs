import test from 'node:test'
import assert from 'node:assert/strict'
import { confirmarCierreSesion } from '../src/services/confirmarCierreSesion.ts'

test('espera la confirmación de Firebase antes de sincronizar React', async () => {
  const respuesta = Promise.withResolvers()
  let autenticado = true
  let sincronizaciones = 0
  const cierre = confirmarCierreSesion(
    () => respuesta.promise,
    () => autenticado,
    () => { sincronizaciones += 1 },
  )
  assert.equal(sincronizaciones, 0)
  autenticado = false
  respuesta.resolve()
  await cierre
  assert.equal(sincronizaciones, 1)
})

test('un rechazo de Firebase conserva el estado y permite reintentar', async () => {
  let autenticado = true
  let sincronizaciones = 0
  const sincronizar = () => { sincronizaciones += 1 }
  await assert.rejects(confirmarCierreSesion(
    async () => { throw new Error('Fallo de conexión') },
    () => autenticado,
    sincronizar,
  ), /Fallo de conexión/)
  assert.equal(sincronizaciones, 0)
  await confirmarCierreSesion(async () => { autenticado = false }, () => autenticado, sincronizar)
  assert.equal(sincronizaciones, 1)
})

test('no anuncia cierre ni limpia datos si Firebase todavía conserva un usuario', async () => {
  let sincronizado = false
  await assert.rejects(confirmarCierreSesion(
    async () => {},
    () => true,
    () => { sincronizado = true },
  ), /sesión sigue activa/)
  assert.equal(sincronizado, false)
})
