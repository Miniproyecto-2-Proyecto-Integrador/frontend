import test from 'node:test'
import assert from 'node:assert/strict'
import { ConsultaCanceladaError, crearConsultaCoordinada } from '../src/services/consultaCoordinada.ts'

function diferida() {
  return Promise.withResolvers()
}

test('observador y registro comparten una consulta simultánea de la misma cuenta', async () => {
  const gestor = crearConsultaCoordinada()
  const respuesta = diferida()
  let llamadas = 0
  const obtener = () => { llamadas += 1; return respuesta.promise }
  const observador = gestor.consultar('cuenta-A', obtener, () => true)
  const registro = gestor.consultar('cuenta-A', obtener, () => true)
  assert.equal(observador, registro)
  respuesta.resolve(null)
  assert.equal(await registro, null)
  assert.equal(llamadas, 1)
})

test('un fallo de consulta se propaga y un reintento recupera el perfil pendiente', async () => {
  const gestor = crearConsultaCoordinada()
  const fallo = new Error('API sin conexión')
  await assert.rejects(gestor.consultar('A', async () => { throw fallo }, () => true), error => error === fallo)
  assert.equal(await gestor.consultar('A', async () => null, () => true), null)
  assert.deepEqual(await gestor.consultar('A', async () => ({ username: 'creado' }), () => true), { username: 'creado' })
})

test('una respuesta tardía de la cuenta anterior no se acepta después de cambiar de cuenta', async () => {
  const gestor = crearConsultaCoordinada()
  const anterior = diferida()
  const consultaA = gestor.consultar('A', () => anterior.promise, () => true)
  const rechazada = assert.rejects(consultaA, ConsultaCanceladaError)
  await Promise.resolve()
  gestor.invalidar()
  const consultaB = gestor.consultar('B', async () => ({ username: 'cuenta-B' }), () => true)
  anterior.resolve({ username: 'cuenta-A' })
  await rechazada
  assert.deepEqual(await consultaB, { username: 'cuenta-B' })
})

test('un error tardío de una sesión invalidada tampoco modifica la sesión nueva', async () => {
  const gestor = crearConsultaCoordinada()
  const anterior = diferida()
  const consulta = gestor.consultar('A', () => anterior.promise, () => true)
  const rechazada = assert.rejects(consulta, ConsultaCanceladaError)
  await Promise.resolve()
  gestor.invalidar()
  anterior.reject(new Error('Fallo de la cuenta anterior'))
  await rechazada
})

test('descarta la consulta si Firebase cambia de usuario antes de notificar a React', async () => {
  const gestor = crearConsultaCoordinada()
  const respuesta = diferida()
  let uid = 'A'
  const consulta = gestor.consultar('A', () => respuesta.promise, () => uid === 'A')
  const rechazada = assert.rejects(consulta, ConsultaCanceladaError)
  await Promise.resolve()
  uid = 'B'
  respuesta.resolve(null)
  await rechazada
})
