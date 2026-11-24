import { estilosAvatar, personajes } from '../../services/avatares'

// Casilla común: sin marcas extra; la opción elegida se «ilumina» con borde, aro y sombra.
const casilla = 'flex aspect-square items-center justify-center overflow-hidden rounded-2xl border-2 border-borde transition-[translate,scale,box-shadow,border-color] duration-200 ease-(--ease-salida) motion-safe:peer-enabled:group-hover:-translate-y-0.5 motion-safe:peer-enabled:group-active:scale-[0.96] peer-enabled:group-hover:shadow-md motion-reduce:transition-none peer-checked:border-primario peer-checked:shadow-md peer-checked:ring-4 peer-checked:ring-primario peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primario-oscuro'
const leyenda = 'mt-2 block text-sm leading-tight transition-colors duration-200 peer-checked:font-bold peer-checked:text-primario motion-reduce:transition-none'

// Elegir uno de los avatares disponibles. El valor que se guarda es «avatarN».
export function SelectorAvatar({ valor, onChange, error, disabled }: {
  valor: string; onChange: (valor: string) => void; error?: string; disabled: boolean
}) {
  return <fieldset disabled={disabled} aria-describedby={error ? 'avatar-error' : undefined}>
    <legend className="mb-1 font-bold">Avatar</legend>
    <p className="mb-3 text-texto-suave">Elige uno de los avatares disponibles.</p>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {personajes.map((p, i) => <label key={p.id} className="group cursor-pointer text-center">
        <input className="peer sr-only" type="radio" name="avatar" value={p.id}
          checked={valor === p.id} onChange={e => onChange(e.target.value)} aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'avatar-error' : undefined} />
        <span className={`${casilla} bg-linear-to-br ${estilosAvatar[i]}`}>
          <img src={p.src} alt="" className={`size-full ${p.ajuste === 'cover' ? 'object-cover' : 'object-contain p-2'}`} />
        </span>
        <span className={leyenda}>{p.nombre}</span>
      </label>)}
    </div>
    {error && <p id="avatar-error" className="mt-2 font-bold text-error">{error}</p>}
  </fieldset>
}
