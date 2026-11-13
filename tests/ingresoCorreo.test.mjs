import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
const { validarIngreso, ingresoInicial, reducirIngreso, errorIngreso, accederConCorreo } = await import('../src/services/ingresoCorreo.ts')
const { crearExclusionAuth } = await import('../src/services/operacionAuth.ts')
const { destinoSeguro, destinoDelEstado } = await import('../src/services/destinoSeguro.ts')

test('login exige correo válido y contraseña no vacía, sin reglas de creación ni trim de contraseña', () => {
  assert.deepEqual(Object.keys(validarIngreso({ correo: '', password: '' })), ['correo', 'password'])
  for (const password of ['x', '123', '  x  ', ' ']) {
    assert.deepEqual(validarIngreso({ correo: ' a@example.com ', password }), {})
  }
  assert.ok(validarIngreso({ correo: 'a@', password: 'x' }).correo)
})

test('validación progresiva: neutral al editar, errores tras enviar, corrección individual', () => {
  let estado = reducirIngreso(ingresoInicial, { tipo: 'editar', campo: 'correo', valor: 'a@' })
  assert.equal(estado.errores.correo, undefined)
  estado = reducirIngreso(estado, { tipo: 'intentar' })
  assert.ok(estado.errores.correo)
  assert.ok(estado.errores.password)
  estado = reducirIngreso(estado, { tipo: 'editar', campo: 'correo', valor: 'a@example.com' })
  assert.equal(estado.errores.correo, undefined)
  assert.ok(estado.errores.password)
  estado = reducirIngreso(estado, { tipo: 'editar', campo: 'password', valor: ' x ' })
  assert.equal(estado.datos.password, ' x ')
  assert.equal(estado.errores.password, undefined)
  assert.equal(reducirIngreso(estado, { tipo: 'limpiar-password' }).datos.password, '')
})

test('acceso correcto pasa la contraseña intacta a Firebase y consulta el mismo usuario', async () => {
  const usuario = { uid: 'A' }
  const resultado = await accederConCorreo(' a@example.com ', ' x ',
    async (correo, password) => { assert.equal(correo, 'a@example.com'); assert.equal(password, ' x '); return { user: usuario } },
    async actual => { assert.equal(actual, usuario); return { username: 'perfil' } })
  assert.deepEqual(resultado, { username: 'perfil' })
})

test('credenciales inválidas no consultan perfil y no revelan existencia de cuentas', async () => {
  await assert.rejects(accederConCorreo('a@example.com', 'x',
    async () => { throw new Error('credenciales') },
    async () => assert.fail('No debe consultar')), /credenciales/)
  for (const code of ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/user-disabled']) {
    assert.equal(errorIngreso({ code }), errorIngreso({ code: 'auth/invalid-credential' }))
  }
  assert.match(errorIngreso({ code: 'auth/network-request-failed' }), /conexión/)
})

test('404 o error del perfil se resuelven después del acceso sin repetir credenciales', async () => {
  let accesos = 0
  const autenticar = async () => { accesos += 1; return { user: { uid: 'A' } } }
  assert.equal(await accederConCorreo('a@example.com', 'x', autenticar, async () => null), null)
  await assert.rejects(accederConCorreo('a@example.com', 'x', autenticar, async () => { throw new Error('API falló') }), /API falló/)
  assert.equal(accesos, 2)
})

test('un único bloqueo evita doble envío y excluye Google, correo y cierre', async () => {
  const excluir = crearExclusionAuth()
  const respuesta = Promise.withResolvers()
  let llamadas = 0
  const primero = excluir(async () => { llamadas += 1; return respuesta.promise })
  for (const operacion of ['correo', 'Google', 'cierre']) {
    await assert.rejects(excluir(async () => { assert.fail(operacion) }), /Espera/)
  }
  respuesta.resolve()
  await primero
  assert.equal(llamadas, 1)
  await assert.rejects(excluir(async () => { throw new Error('fallo') }), /fallo/)
  assert.equal(await excluir(async () => 'reintento'), 'reintento')
})

test('destinos privados internos conservan ruta, consulta y fragmento', () => {
  for (const ruta of ['/dashboard', '/perfil', '/salas/sala_12', '/perfil?tab=datos#nombre']) {
    assert.equal(destinoSeguro(ruta), ruta)
    assert.equal(destinoDelEstado({ from: ruta }), ruta)
  }
})

test('destinos externos, malformados, normalizados o no permitidos vuelven al Panel', () => {
  for (const ruta of [
    undefined, null, {}, 'https://evil.invalid', '//evil.invalid', '/ingresar', '/registro',
    '/ayuda', '/foo/../perfil', '/%2e%2e/perfil', '/salas/a%2fb', '/perfil%0a',
    '/perfil?x=%0a', '/perfil%', '/salas/', '/perfil/extra', String.raw`/\evil.invalid`,
  ]) assert.equal(destinoSeguro(ruta), '/dashboard')
})
