import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
const {
  confirmarPasoFinal, formularioInicial, pasoDelPrimerError, reducirFormulario, validarPaso,
} = await import('../src/services/asistenteRegistro.ts')

const datosValidos = {
  nombres: 'Lucía', apellidos: 'García', username: 'lucia_2026',
  avatar: 'avatar2', correo: 'lucia@example.com', password: 'Estudio8',
}

test('cada paso valida solo sus campos, sin errores futuros', () => {
  assert.deepEqual(Object.keys(validarPaso(formularioInicial.datos, 1, false)), ['nombres', 'apellidos', 'username', 'avatar'])
  assert.deepEqual(Object.keys(validarPaso(formularioInicial.datos, 2, false)), ['correo', 'password'])
  assert.deepEqual(validarPaso({ ...datosValidos, correo: '', password: '' }, 1, false), {})
  assert.deepEqual(validarPaso({ ...formularioInicial.datos, correo: datosValidos.correo, password: datosValidos.password }, 2, false), {})
})

test('entrar por primera vez en Acceso no valida ni muestra errores de credenciales', () => {
  const estado = reducirFormulario({
    ...formularioInicial, datos: { ...datosValidos, correo: '', password: '' },
  }, { tipo: 'siguiente', pendiente: false })
  assert.equal(estado.paso, 2)
  assert.deepEqual(estado.errores, {})
  assert.equal(estado.validados.correo, undefined)
  assert.equal(estado.validados.password, undefined)
})

test('editar credenciales antes de intentar enviar mantiene el estado neutral', () => {
  let estado = { ...formularioInicial, datos: { ...datosValidos, correo: '', password: '' }, paso: 2 }
  estado = reducirFormulario(estado, { tipo: 'editar', campo: 'correo', valor: 'incompleto' })
  estado = reducirFormulario(estado, { tipo: 'editar', campo: 'password', valor: 'abc' })
  assert.equal(estado.errores.correo, undefined)
  assert.equal(estado.errores.password, undefined)
})

test('un intento inválido muestra errores y cada corrección revalida únicamente ese campo', () => {
  let estado = reducirFormulario({
    ...formularioInicial, datos: { ...datosValidos, correo: '', password: '' }, paso: 2,
  }, { tipo: 'validar-envio', pendiente: false })
  assert.deepEqual(Object.keys(estado.errores), ['correo', 'password'])
  const errorPassword = estado.errores.password
  estado = reducirFormulario(estado, { tipo: 'editar', campo: 'correo', valor: 'a@' })
  assert.ok(estado.errores.correo)
  assert.equal(estado.errores.password, errorPassword)
  estado = reducirFormulario(estado, { tipo: 'editar', campo: 'correo', valor: datosValidos.correo })
  assert.equal(estado.errores.correo, undefined)
  estado = reducirFormulario(estado, { tipo: 'editar', campo: 'password', valor: 'corta' })
  assert.ok(estado.errores.password)
  estado = reducirFormulario(estado, { tipo: 'editar', campo: 'password', valor: datosValidos.password })
  assert.equal(estado.errores.password, undefined)
})

test('volver y avanzar conserva valores sin validar prematuramente Acceso', () => {
  let estado = {
    ...formularioInicial, datos: { ...datosValidos, correo: 'a@', password: 'corta' }, paso: 2,
  }
  estado = reducirFormulario(estado, { tipo: 'anterior', pasoActual: 2 })
  estado = reducirFormulario(estado, { tipo: 'siguiente', pendiente: false })
  assert.equal(estado.paso, 2)
  assert.equal(estado.datos.correo, 'a@')
  assert.equal(estado.datos.password, 'corta')
  assert.equal(estado.errores.correo, undefined)
  assert.equal(estado.errores.password, undefined)
})

test('Tu perfil también revalida progresivamente después del primer intento', () => {
  let estado = reducirFormulario(formularioInicial, { tipo: 'editar', campo: 'nombres', valor: ' ' })
  assert.equal(estado.errores.nombres, undefined)
  estado = reducirFormulario(estado, { tipo: 'siguiente', pendiente: false })
  assert.ok(estado.errores.nombres)
  estado = reducirFormulario(estado, { tipo: 'editar', campo: 'nombres', valor: '  ' })
  assert.ok(estado.errores.nombres)
  estado = reducirFormulario(estado, { tipo: 'editar', campo: 'nombres', valor: 'Lucía' })
  assert.equal(estado.errores.nombres, undefined)
  assert.ok(estado.errores.username)
})

test('validar recuperación no valida ni exige credenciales', () => {
  const estado = reducirFormulario({
    ...formularioInicial, datos: { ...datosValidos, correo: '', password: '' },
  }, { tipo: 'validar-envio', pendiente: true })
  assert.deepEqual(estado.errores, {})
  assert.equal(estado.validados.correo, undefined)
  assert.equal(estado.validados.password, undefined)
})

test('no permite avanzar con datos personales inválidos', () => {
  const estado = reducirFormulario(formularioInicial, { tipo: 'siguiente', pendiente: false })
  assert.equal(estado.paso, 1)
  assert.deepEqual(Object.keys(estado.errores), ['nombres', 'apellidos', 'username', 'avatar'])
})

test('no permite avanzar con nombre de usuario incompatible o avatar ausente', () => {
  for (const username of ['ab', 'a'.repeat(21), 'lucía', 'con-guion']) {
    const estado = reducirFormulario({
      ...formularioInicial,
      datos: { ...datosValidos, username, avatar: '' }, paso: 1, errores: {},
    }, { tipo: 'siguiente', pendiente: false })
    assert.equal(estado.paso, 1)
    assert.deepEqual(Object.keys(estado.errores), ['username', 'avatar'])
  }
})

test('retroceder y avanzar conserva todos los datos, incluida contraseña solo en memoria', () => {
  let estado = { ...formularioInicial, datos: { ...datosValidos }, paso: 2, errores: {} }
  estado = reducirFormulario(estado, { tipo: 'anterior', pasoActual: 2 })
  assert.equal(estado.paso, 1)
  estado = reducirFormulario(estado, { tipo: 'siguiente', pendiente: false })
  assert.equal(estado.paso, 2)
  assert.deepEqual(estado.datos, datosValidos)
})

test('la recuperación permite completar Tu perfil en una sola pantalla sin credenciales', () => {
  let estado = { ...formularioInicial, datos: { ...datosValidos, correo: '', password: '' }, paso: 1, errores: {} }
  estado = reducirFormulario(estado, { tipo: 'siguiente', pendiente: true })
  assert.equal(estado.paso, 1)
  assert.deepEqual(validarPaso(estado.datos, 1, true), {})
  estado = reducirFormulario(estado, { tipo: 'siguiente', pendiente: true })
  assert.equal(estado.paso, 1)
  assert.equal(reducirFormulario({ ...estado, paso: 2 }, { tipo: 'siguiente', pendiente: true }).paso, 1)
})

test('un error del backend abre el paso que permite corregirlo', () => {
  const identidad = reducirFormulario({
    ...formularioInicial,
    datos: { ...datosValidos, password: '' }, paso: 2, errores: {},
  }, { tipo: 'errores', errores: { username: 'Ese nombre de usuario está ocupado.' } })
  assert.equal(identidad.paso, 1)
  assert.equal(identidad.datos.username, datosValidos.username)
  assert.equal(pasoDelPrimerError({ avatar: 'Elige otro.', nombres: 'Revisa tus nombres.' }), 1)
  const corregido = reducirFormulario(identidad, { tipo: 'editar', campo: 'username', valor: 'otro_2026' })
  assert.equal(corregido.errores.username, undefined)
})

test('limpiar credenciales y cambiar de cuenta conservan los datos del perfil', () => {
  let estado = { ...formularioInicial, datos: { ...datosValidos }, paso: 2, errores: {} }
  estado = reducirFormulario(estado, { tipo: 'limpiar-password' })
  assert.deepEqual(estado.datos, { ...datosValidos, password: '' })
  estado = reducirFormulario(estado, { tipo: 'cambiar-cuenta' })
  assert.equal(estado.paso, 2)
  assert.deepEqual(estado.datos, { ...datosValidos, password: '' })
})

test('el reinicio tras cerrar una sesión completa borra todos los datos y vuelve al paso 1', () => {
  const estado = reducirFormulario({
    ...formularioInicial, datos: { ...datosValidos }, paso: 2,
    errores: { correo: 'Error anterior' }, validados: { correo: true, password: true },
  }, { tipo: 'reiniciar' })
  assert.deepEqual(estado, formularioInicial)
  assert.equal(estado.paso, 1)
  assert.ok(Object.values(estado.datos).every(valor => valor === ''))
})

test('la operación de registro únicamente se ejecuta al confirmar el último paso', async () => {
  const bloqueo = { current: false }
  let operaciones = 0
  const registrar = async () => { operaciones += 1 }
  assert.equal(await confirmarPasoFinal(1, 2, bloqueo, registrar), false)
  assert.equal(operaciones, 0)
  assert.equal(await confirmarPasoFinal(2, 2, bloqueo, registrar), true)
  assert.equal(operaciones, 1)
})

test('dos confirmaciones simultáneas ejecutan una sola operación', async () => {
  const bloqueo = { current: false }
  const respuesta = Promise.withResolvers()
  let operaciones = 0
  const registrar = async () => { operaciones += 1; await respuesta.promise }
  const primero = confirmarPasoFinal(2, 2, bloqueo, registrar)
  assert.equal(bloqueo.current, true)
  assert.equal(await confirmarPasoFinal(2, 2, bloqueo, registrar), false)
  respuesta.resolve()
  assert.equal(await primero, true)
  assert.equal(operaciones, 1)
  assert.equal(bloqueo.current, false)
})

test('un fallo libera el bloqueo para completar el perfil en el último paso de recuperación', async () => {
  const bloqueo = { current: false }
  await assert.rejects(confirmarPasoFinal(1, 1, bloqueo, async () => { throw new Error('API sin conexión') }))
  assert.equal(bloqueo.current, false)
  let completado = false
  assert.equal(await confirmarPasoFinal(1, 1, bloqueo, async () => { completado = true }), true)
  assert.equal(completado, true)
})
