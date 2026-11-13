import test from 'node:test'
import assert from 'node:assert/strict'
import { validarRegistro } from '../src/services/validarRegistro.ts'

const valido = {
  nombres: 'Lucía', apellidos: 'García', username: 'lucia_2026',
  avatar: 'avatar1', correo: 'lucia@example.com', password: 'Estudio8',
}

test('acepta los seis avatares y los límites válidos del contrato', () => {
  for (let i = 1; i <= 6; i++) {
    assert.deepEqual(validarRegistro({
      ...valido, nombres: 'a'.repeat(50), apellidos: 'b'.repeat(50),
      username: 'a'.repeat(20), avatar: `avatar${i}`,
    }, false), {})
  }
  assert.deepEqual(validarRegistro({ ...valido, username: 'a_1' }, false), {})
})

test('rechaza campos vacíos, largos y nombres de usuario incompatibles', () => {
  for (const username of ['ab', 'a'.repeat(21), 'lucía', 'con espacio', 'con-guion']) {
    assert.ok(validarRegistro({ ...valido, username }, false).username)
  }
  const errores = validarRegistro({
    nombres: ' ', apellidos: 'b'.repeat(51), username: '', avatar: '',
    correo: '', password: '',
  }, false)
  assert.equal(Object.keys(errores).length, 6)
  assert.ok(validarRegistro({ ...valido, avatar: 'avatar7' }, false).avatar)
})

test('exige correo válido y contraseña de ocho caracteres con letra y número', () => {
  for (const correo of ['sin-arroba', 'a@', 'a b@example.com']) {
    assert.ok(validarRegistro({ ...valido, correo }, false).correo)
  }
  for (const password of ['abc1234', 'abcdefgh', '12345678', '        ']) {
    assert.ok(validarRegistro({ ...valido, password }, false).password)
  }
})

test('el perfil pendiente no vuelve a exigir credenciales, pero sí datos de perfil', () => {
  assert.deepEqual(validarRegistro({ ...valido, correo: '', password: '' }, true), {})
  assert.ok(validarRegistro({ ...valido, username: '', password: '' }, true).username)
})
