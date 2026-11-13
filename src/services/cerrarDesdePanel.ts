// Orquesta la interfaz; Firebase y la limpieza de sesión siguen en AuthProvider.
export async function cerrarDesdePanel(
  bloqueo: { current: boolean },
  cerrarSesion: () => Promise<void>,
  navegar: (destino: string, opciones: { replace: boolean }) => void,
  mostrarEstado: (estado: 'cerrando' | 'error') => void,
) {
  if (bloqueo.current) return
  bloqueo.current = true
  mostrarEstado('cerrando')
  try {
    await cerrarSesion()
    navegar('/registro', { replace: true })
    // Mantener el bloqueo y la carga hasta que se desmonte el Panel.
  } catch {
    bloqueo.current = false
    mostrarEstado('error')
  }
}
