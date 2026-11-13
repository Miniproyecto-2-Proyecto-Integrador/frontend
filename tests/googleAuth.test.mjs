import './soporte/cargarFuentes.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
const { crearAccesoGoogle, describirErrorGoogle, esUsuarioGoogle } = await import('../src/services/googleAuth.ts')
const { crearConsultaCoordinada, ConsultaCanceladaError } = await import('../src/services/consultaCoordinada.ts')

const usuario = { uid: 'google-A', providerData: [{ providerId: 'google.com' }] }

test('clasifica cancelación, bloqueo, configuración, red y fallos inesperados', () => {
  for (const [code, tipo] of [
    ['auth/popup-closed-by-user', 'cancelacion'], ['auth/cancelled-popup-request', 'cancelacion'],
    ['auth/popup-blocked', 'bloqueado'], ['auth/unauthorized-domain', 'configuracion'],
    ['auth/operation-not-allowed', 'configuracion'], ['auth/network-request-failed', 'red'],
    ['auth/account-exists-with-different-credential', 'inesperado'], ['otro', 'inesperado'],
  ]) assert.equal(describirErrorGoogle({ code }).tipo, tipo)
  assert.equal(describirErrorGoogle(new Error('Falta configurar Firebase.')).tipo, 'configuracion')
})

test('distingue Google de cuentas manuales y sesiones ausentes', () => {
  assert.equal(esUsuarioGoogle(usuario), true)
  assert.equal(esUsuarioGoogle({ providerData: [{ providerId: 'password' }] }), false)
  assert.equal(esUsuarioGoogle(null), false)
})

test('abre el popup inmediatamente y bloquea solicitudes duplicadas hasta resolver el perfil', async () => {
  const popup = Promise.withResolvers()
  const perfil = Promise.withResolvers()
  const eventos = []
  const acceder = crearAccesoGoogle(
    () => { eventos.push('popup'); return popup.promise },
    async actual => { assert.equal(actual, usuario); eventos.push('perfil'); return perfil.promise },
    { iniciar() { eventos.push('inicio') }, aviso() { assert.fail('No se esperaba aviso') }, finalizar() { eventos.push('fin') } },
  )
  const primera = acceder()
  assert.deepEqual(eventos, ['inicio', 'popup'])
  await acceder()
  assert.equal(eventos.filter(evento => evento === 'popup').length, 1)
  popup.resolve({ user: usuario })
  await Promise.resolve()
  await acceder()
  assert.equal(eventos.filter(evento => evento === 'popup').length, 1)
  perfil.resolve(null)
  await primera
  assert.deepEqual(eventos, ['inicio', 'popup', 'perfil', 'fin'])
})

test('Google nuevo o existente consulta el perfil con la identidad autenticada', async () => {
  for (const resultado of [null, { username: 'existente' }]) {
    let consultado = false
    const acceder = crearAccesoGoogle(async () => ({ user: usuario }), async actual => {
      assert.equal(actual.uid, usuario.uid); consultado = true; return resultado
    }, { iniciar() {}, finalizar() {}, aviso() { assert.fail() } })
    await acceder()
    assert.equal(consultado, true)
  }
})

test('cancelar o bloquear el popup no consulta perfiles y permite reintentar', async () => {
  for (const code of ['auth/popup-closed-by-user', 'auth/popup-blocked']) {
    const avisos = []
    let llamadas = 0
    const acceder = crearAccesoGoogle(async () => { llamadas += 1; throw { code } },
      async () => { assert.fail('No debe consultar el perfil') },
      { iniciar() {}, finalizar() {}, aviso(aviso) { avisos.push(aviso) } })
    await acceder(); await acceder()
    assert.equal(llamadas, 2)
    assert.equal(avisos.length, 2)
    assert.equal(avisos[0].tipo, code.includes('blocked') ? 'bloqueado' : 'cancelacion')
  }
})

test('un error de API tras autenticar queda a cargo del contexto, sin repetir el popup', async () => {
  let popups = 0
  let finales = 0
  const acceder = crearAccesoGoogle(async () => { popups += 1; return { user: usuario } },
    async () => { throw new Error('Error de consulta del contexto') },
    { iniciar() {}, finalizar() { finales += 1 }, aviso() { assert.fail('No confundir API con popup') } })
  await acceder()
  assert.equal(popups, 1)
  assert.equal(finales, 1)
})

test('el observador y el acceso Google comparten consulta y descartan una cuenta anterior', async () => {
  const gestor = crearConsultaCoordinada()
  const respuesta = Promise.withResolvers()
  let actual = usuario.uid
  let lecturas = 0
  const cargar = () => gestor.consultar(usuario.uid, () => { lecturas += 1; return respuesta.promise }, () => actual === usuario.uid)
  const observador = cargar()
  const rechazado = assert.rejects(observador, ConsultaCanceladaError)
  const acceder = crearAccesoGoogle(async () => ({ user: usuario }), cargar,
    { iniciar() {}, finalizar() {}, aviso() { assert.fail() } })
  const proceso = acceder()
  await Promise.resolve()
  actual = 'otra-cuenta'
  gestor.invalidar()
  respuesta.resolve(null)
  await rechazado
  await proceso
  assert.equal(lecturas, 1)
})
