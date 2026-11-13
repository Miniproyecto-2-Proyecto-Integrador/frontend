// No limpiar React ni el formulario hasta que Firebase haya confirmado el cierre.
export async function confirmarCierreSesion(
  cerrarEnFirebase: () => Promise<void>,
  sigueAutenticado: () => boolean,
  sincronizar: () => void,
) {
  await cerrarEnFirebase()
  if (sigueAutenticado()) {
    throw new Error('La sesión sigue activa. Vuelve a pulsar Cerrar sesión para reintentar.')
  }
  sincronizar()
}
