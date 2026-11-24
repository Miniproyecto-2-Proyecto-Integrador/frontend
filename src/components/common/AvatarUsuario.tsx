import { estilosAvatar, personajes } from '../../services/avatares'

// Muestra el avatar elegido o, en perfiles antiguos (avatar5 y avatar6), el degradado con su número.
// «tamano» y «redondo» permiten usarlo grande (recuadros de la sala) sin cambiar su comportamiento.
export function AvatarUsuario({ valor, tamano = 'size-16', redondo = false, borde = 'border-2 border-primario' }: { valor: string; tamano?: string; redondo?: boolean; borde?: string }) {
  const numero = /^avatar([1-6])$/.exec(valor)?.[1]
  const indice = numero ? Number(numero) - 1 : 0
  const personaje = personajes.find(p => p.id === valor)
  return <span role="img" aria-label={numero ? `Avatar ${numero}` : 'Avatar del usuario'}
    className={`inline-flex ${tamano} shrink-0 items-center justify-center overflow-hidden ${borde} bg-linear-to-br text-2xl font-bold text-bosque ${redondo ? 'rounded-full' : 'rounded-2xl'} ${estilosAvatar[indice]}`}>
    {personaje ? <img src={personaje.src} alt="" className={`size-full ${personaje.ajuste === 'cover' ? 'object-cover' : 'object-contain p-1'}`} />
      : <span aria-hidden="true">{numero ?? '?'}</span>}
  </span>
}
