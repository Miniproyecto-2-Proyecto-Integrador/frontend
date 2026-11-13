import { estilosAvatar } from '../../services/avatares'

export function AvatarUsuario({ valor }: { valor: string }) {
  const numero = /^avatar([1-6])$/.exec(valor)?.[1]
  const indice = numero ? Number(numero) - 1 : 0
  return <span role="img" aria-label={numero ? `Avatar ${numero}` : 'Avatar del usuario'}
    className={`inline-flex size-16 shrink-0 items-center justify-center rounded-xl border-2 border-primario bg-linear-to-br text-2xl font-bold text-azul-texto ${estilosAvatar[indice]}`}>
    <span aria-hidden="true">{numero ?? '?'}</span>
  </span>
}
