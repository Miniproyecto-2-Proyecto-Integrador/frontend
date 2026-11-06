export interface Prueba {
  id: string
  mensaje: string
  nombre: string
  estado: string
}

export interface PruebasRespuesta {
  success: boolean
  data: Prueba[]
}