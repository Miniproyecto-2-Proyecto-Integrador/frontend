import './soporte/cargarFuentes.mjs'
import test from 'node:test'
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
  const socket = socketFalso(); const estados = []; const llamadas = { eliminada: 0, nombres: [] }
  let direccion
  const conexion = conectarSala({
    idSala: ' Ab3_xY-9 ', obtenerToken: async () => 'token-de-prueba', url: 'https://realtime.invalid/',
    crearSocket: (url, opciones) => { direccion = url; socket.opciones = opciones; return socket },
    eventos: {
      alEstado: (estado, mensaje) => estados.push([estado, mensaje]),
      alEliminarSala: () => { llamadas.eliminada++ },
      alActualizarNombre: nombre => llamadas.nombres.push(nombre),
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
