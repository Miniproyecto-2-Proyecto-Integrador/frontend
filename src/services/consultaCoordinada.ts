export class ConsultaCanceladaError extends Error {
  constructor() {
    super('La sesión cambió durante la consulta. Revisa la cuenta activa antes de continuar.')
    this.name = 'ConsultaCanceladaError'
  }
}

// Comparte consultas simultáneas de una cuenta y descarta resultados de sesiones anteriores.
export function crearConsultaCoordinada<T>() {
  let revision = 0
  let enCurso: { uid: string; promesa: Promise<T> } | null = null

  return {
    invalidar() {
      revision += 1
      enCurso = null
    },
    consultar(uid: string, obtener: () => Promise<T>, sigueVigente: () => boolean): Promise<T> {
      if (enCurso?.uid === uid) return enCurso.promesa
      const version = ++revision
      const vigente = () => version === revision && sigueVigente()
      const promesa = Promise.resolve().then(() => {
        if (!vigente()) throw new ConsultaCanceladaError()
        return obtener()
      }).then(
        datos => {
          if (!vigente()) throw new ConsultaCanceladaError()
          return datos
        },
        error => {
          if (!vigente()) throw new ConsultaCanceladaError()
          throw error
        },
      ).finally(() => {
        if (enCurso?.promesa === promesa) enCurso = null
      })
      enCurso = { uid, promesa }
      return promesa
    },
  }
}
