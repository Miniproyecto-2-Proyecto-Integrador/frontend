export function crearExclusionAuth() {
  let activa = false
  return async function ejecutar<T>(operacion: () => Promise<T>): Promise<T> {
    if (activa) throw new Error('Espera a que termine la operación de autenticación actual.')
    activa = true
    try { return await operacion() } finally { activa = false }
  }
}
