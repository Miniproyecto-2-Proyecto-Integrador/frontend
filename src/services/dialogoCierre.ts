export const cierreInicial = { abierto: false, cerrando: false, error: '' }
type EstadoCierre = typeof cierreInicial
export function reducirCierre(estado: EstadoCierre, accion:
  | { tipo: 'abrir' | 'cancelar' | 'confirmar' | 'cerrado' }
  | { tipo: 'fallo'; mensaje: string }): EstadoCierre {
  switch (accion.tipo) {
    case 'abrir': return estado.cerrando ? estado : { ...cierreInicial, abierto: true }
    case 'cancelar': return estado.cerrando ? estado : { ...cierreInicial }
    case 'confirmar': return estado.abierto ? { ...estado, cerrando: true, error: '' } : estado
    case 'fallo': return { abierto: true, cerrando: false, error: accion.mensaje }
    case 'cerrado': return { ...cierreInicial }
  }
}
