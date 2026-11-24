import './soporte/cargarFuentes.mjs'
import test, { mock } from 'node:test'
import assert from 'node:assert/strict'
const { conectarSala } = await import('../src/services/realtime/salaTiempoReal.ts')

function socketFalso() {
  const manejadores = new Map()
  const socket = {
    connected: false, emitidos: [], desconectado: false, opciones: null,
    on(evento, manejador) { manejadores.set(evento, manejador) },
    emit(evento, ...argumentos) { socket.emitidos.push([evento, ...argumentos]) },
    disconnect() { socket.desconectado = true; socket.connected = false },
    recibir(evento, ...datos) { manejadores.get(evento)?.(...datos) },
  }
  return socket
}
function iniciar(extra = {}) {
  const socket = socketFalso(); const estados = []; const llamadas = { eliminada: 0, nombres: [], presencia: [], mensajes: [] }
  let direccion
  const conexion = conectarSala({
    idSala: ' Ab3_xY-9 ', obtenerToken: async () => 'token-de-prueba', url: 'https://realtime.invalid/',
    crearSocket: (url, opciones) => { direccion = url; socket.opciones = opciones; return socket },
    eventos: {
      alEstado: (estado, mensaje) => estados.push([estado, mensaje]),
      alEliminarSala: () => { llamadas.eliminada++ },
      alActualizarNombre: nombre => llamadas.nombres.push(nombre),
      alParticipantes: (lista, cambio) => llamadas.presencia.push([lista, cambio]),
      alMensaje: mensaje => llamadas.mensajes.push(mensaje),
    }, ...extra,
  })
  return { socket, estados, llamadas, conexion, direccion }
}

test('el handshake entrega un token vigente en cada conexión', async () => {
  const { socket, direccion } = iniciar()
  assert.equal(direccion, 'https://realtime.invalid')
  assert.deepEqual(await new Promise(entregar => socket.opciones.auth(entregar)), { token: 'token-de-prueba' })
})
test('al conectar entra a la sala con su ID limpio y confirma el acceso', () => {
  const { socket, estados } = iniciar()
  assert.deepEqual(estados[0], ['conectando', undefined])
  socket.connected = true; socket.recibir('connect')
  assert.deepEqual(socket.emitidos[0].slice(0, 2), ['sala:unir', 'Ab3_xY-9'])
  socket.emitidos[0][2]({ ok: true, data: {} })
  assert.equal(estados.at(-1)[0], 'conectada')
})
test('si el servidor rechaza la entrada se informa sin cerrar la página', () => {
  const { socket, estados } = iniciar()
  socket.recibir('connect'); socket.emitidos[0][2]({ ok: false, error: 'La sala no existe.' })
  assert.deepEqual(estados.at(-1), ['sin-conexion', 'La sala no existe.'])
})
test('sala eliminada: avisa solo si es esta sala', () => {
  const { socket, llamadas } = iniciar()
  socket.recibir('sala:eliminada', { id: 'Otra1234' }); socket.recibir('sala:eliminada', null)
  assert.equal(llamadas.eliminada, 0)
  socket.recibir('sala:eliminada', { id: 'Ab3_xY-9' })
  assert.equal(llamadas.eliminada, 1)
})
test('nombre actualizado: solo de esta sala y con un nombre válido', () => {
  const { socket, llamadas } = iniciar()
  socket.recibir('sala:actualizada', { id: 'Otra1234', nombre: 'No' })
  socket.recibir('sala:actualizada', { id: 'Ab3_xY-9', nombre: '   ' })
  socket.recibir('sala:actualizada', { id: 'Ab3_xY-9', nombre: 7 })
  socket.recibir('sala:actualizada', { id: 'Ab3_xY-9', nombre: 'Nuevo nombre' })
  assert.deepEqual(llamadas.nombres, ['Nuevo nombre'])
})
test('pérdida de conexión y errores del handshake se explican; el token inválido pide volver a ingresar', () => {
  const { socket, estados } = iniciar()
  socket.recibir('disconnect'); assert.match(estados.at(-1)[1], /intentando reconectar/)
  socket.recibir('connect_error', new Error('No autorizado: la sesión no es válida o expiró')); assert.match(estados.at(-1)[1], /iniciar sesión/)
  socket.recibir('connect_error', new Error('xhr poll error')); assert.match(estados.at(-1)[1], /reintentando/)
})
test('desconectar sale de la sala, cierra el socket y deja de escuchar', () => {
  const { socket, llamadas, conexion, estados } = iniciar()
  socket.connected = true
  conexion.desconectar()
  assert.deepEqual(socket.emitidos.at(-1), ['sala:salir', 'Ab3_xY-9'])
  assert.equal(socket.desconectado, true)
  const previos = estados.length
  socket.recibir('sala:eliminada', { id: 'Ab3_xY-9' }); socket.recibir('disconnect')
  assert.equal(llamadas.eliminada, 0); assert.equal(estados.length, previos)
  conexion.desconectar(); assert.equal(socket.emitidos.filter(e => e[0] === 'sala:salir').length, 1)
})
test('sin URL configurada o con ID inválido no se crea ningún socket', () => {
  for (const extra of [{ url: undefined }, { url: 'url_realtime_ejemplo' }, { idSala: 'corto' }]) {
    let creados = 0; const estados = []
    const conexion = conectarSala({ idSala: 'Ab3_xY-9', obtenerToken: async () => 't', url: 'https://realtime.invalid', crearSocket: () => { creados++ }, eventos: { alEstado: (e, m) => estados.push([e, m]) }, ...extra })
    assert.equal(creados, 0); assert.equal(estados[0][0], 'sin-conexion'); conexion.desconectar()
  }
})

// ---------- US-10: chat y presencia ----------
const mensajeServidor = (extra = {}) => ({ id: 'm1', salaId: 'Ab3_xY-9', autor: 'ana', texto: 'hola', creadoEn: '2026-11-23T15:00:00.000Z', esPropio: false, ...extra })
function unida() {
  const contexto = iniciar()
  contexto.socket.connected = true; contexto.socket.recibir('connect')
  contexto.socket.emitidos[0][2]({ ok: true, data: { participantes: [{ nombre: 'ana', esAnfitrion: true }] } })
  return contexto
}
test('al entrar se recibe la lista inicial de participantes', () => {
  const { llamadas } = unida()
  assert.deepEqual(llamadas.presencia, [[[{ nombre: 'ana', esAnfitrion: true }], undefined]])
})
test('presencia: actualiza la lista, informa quién entró o salió y descarta datos de otra sala o rotos', () => {
  const { socket, llamadas } = unida(); llamadas.presencia.length = 0
  const lista = [{ nombre: 'ana', esAnfitrion: true }, { nombre: 'luis', esAnfitrion: false }]
  socket.recibir('sala:presencia', { id: 'Ab3_xY-9', cantidad: 2, participantes: lista, cambio: { tipo: 'entro', nombre: 'luis' } })
  socket.recibir('sala:presencia', { id: 'Ab3_xY-9', cantidad: 2, participantes: lista })
  socket.recibir('sala:presencia', { id: 'Otra1234', participantes: lista })
  socket.recibir('sala:presencia', { id: 'Ab3_xY-9', participantes: [{ nombre: 7 }] })
  socket.recibir('sala:presencia', null)
  assert.deepEqual(llamadas.presencia, [[lista, { tipo: 'entro', nombre: 'luis' }], [lista, undefined]])
})
test('chat: solo llegan mensajes bien formados de esta sala', () => {
  const { socket, llamadas } = unida()
  socket.recibir('chat:mensaje', mensajeServidor())
  socket.recibir('chat:mensaje', mensajeServidor({ id: 'm2', salaId: 'Otra1234' }))
  socket.recibir('chat:mensaje', mensajeServidor({ id: 'm3', texto: 5 }))
  socket.recibir('chat:mensaje', null)
  assert.deepEqual(llamadas.mensajes.map(x => x.id), ['m1'])
})
test('enviar: manda el texto limpio a chat:enviar y entrega el mensaje confirmado como propio', async () => {
  const { socket, conexion } = unida()
  const envio = conexion.enviarMensaje('  hola a todos  ')
  const [evento, entrada, confirmar] = socket.emitidos.at(-1)
  assert.equal(evento, 'chat:enviar'); assert.deepEqual(entrada, { id: 'Ab3_xY-9', texto: 'hola a todos' })
  confirmar({ ok: true, data: mensajeServidor({ id: 'p1', esPropio: true, texto: 'hola a todos' }) })
  const mensaje = await envio
  assert.equal(mensaje.id, 'p1'); assert.equal(mensaje.esPropio, true)
})
test('enviar: no manda mensajes vacíos ni demasiado largos y no toca la red', async () => {
  const { socket, conexion } = unida(); const previos = socket.emitidos.length
  await assert.rejects(conexion.enviarMensaje('   '), /Escribe un mensaje/)
  await assert.rejects(conexion.enviarMensaje('a'.repeat(2001)), /2000 caracteres/)
  assert.equal(socket.emitidos.length, previos)
})
test('enviar: sin estar dentro de la sala o sin conexión se explica y no se emite', async () => {
  const sinUnir = iniciar(); sinUnir.socket.connected = true
  await assert.rejects(sinUnir.conexion.enviarMensaje('hola'), /Todavía no estás conectado/)
  const { socket, conexion } = unida(); const previos = socket.emitidos.length
  socket.connected = false; socket.recibir('disconnect')
  await assert.rejects(conexion.enviarMensaje('hola'), /Todavía no estás conectado/)
  assert.equal(socket.emitidos.length, previos)
})
test('enviar: muestra el error del servidor y rechaza confirmaciones incompletas', async () => {
  const { socket, conexion } = unida()
  const rechazado = conexion.enviarMensaje('hola'); socket.emitidos.at(-1)[2]({ ok: false, error: 'La sala o el perfil ya no están disponibles.' })
  await assert.rejects(rechazado, /ya no están disponibles/)
  const incompleto = conexion.enviarMensaje('hola'); socket.emitidos.at(-1)[2]({ ok: true, data: { texto: 'sin id' } })
  await assert.rejects(incompleto, /No pudimos confirmar el mensaje/)
  const ajeno = conexion.enviarMensaje('hola'); socket.emitidos.at(-1)[2]({ ok: true, data: mensajeServidor({ salaId: 'Otra1234' }) })
  await assert.rejects(ajeno, /No pudimos confirmar el mensaje/)
})
test('enviar: si el servidor no confirma a tiempo se avisa sin duplicar ni quedar colgado', async () => {
  mock.timers.enable({ apis: ['setTimeout'] })
  try {
    const { socket, conexion } = unida()
    const envio = conexion.enviarMensaje('hola'); const confirmar = socket.emitidos.at(-1)[2]
    mock.timers.tick(10_000)
    await assert.rejects(envio, /No pudimos confirmar el envío/)
    assert.doesNotThrow(() => confirmar({ ok: true, data: mensajeServidor({ esPropio: true }) }))
  } finally { mock.timers.reset() }
})
test('al reconectar se vuelve a entrar a la sala y hasta entonces no se puede escribir', async () => {
  const { socket, conexion, estados } = unida()
  socket.recibir('disconnect'); socket.recibir('connect')
  assert.equal(socket.emitidos.filter(e => e[0] === 'sala:unir').length, 2)
  await assert.rejects(conexion.enviarMensaje('hola'), /Todavía no estás conectado/)
  socket.emitidos.at(-1)[2]({ ok: true, data: { participantes: [] } })
  assert.equal(estados.at(-1)[0], 'conectada')
  const envio = conexion.enviarMensaje('hola'); socket.emitidos.at(-1)[2]({ ok: true, data: mensajeServidor({ esPropio: true }) })
  await envio
})
