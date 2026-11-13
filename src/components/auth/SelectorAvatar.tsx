const estilos = [
  'from-rosa-suave to-lila-suave', 'from-azul-suave to-lila-suave',
  'from-rosa-suave to-azul-suave', 'from-lila-suave to-rosa-suave',
  'from-azul-claro to-azul-suave', 'from-lila-suave to-azul-claro',
]

export function SelectorAvatar({ valor, onChange, error, disabled }: {
  valor: string; onChange: (valor: string) => void; error?: string; disabled: boolean
}) {
  return <fieldset disabled={disabled} aria-describedby={error ? 'avatar-error' : undefined}>
    <legend className="mb-2 font-bold">Avatar</legend>
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {estilos.map((estilo, i) => <label key={i} className="cursor-pointer text-center">
        <input className="peer sr-only" type="radio" name="avatar" value={`avatar${i + 1}`}
          checked={valor === `avatar${i + 1}`} onChange={e => onChange(e.target.value)} aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'avatar-error' : undefined} />
        <span className={`flex min-h-14 items-center justify-center rounded-xl border-2 border-borde bg-linear-to-br ${estilo} peer-checked:border-primario peer-checked:ring-2 peer-checked:ring-primario peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primario`}>
          <span aria-hidden="true" className="text-2xl font-bold text-azul-texto">{i + 1}</span>
        </span>
        <span className="mt-2 block">Avatar {i + 1}{valor === `avatar${i + 1}` ? ' ✓' : ''}</span>
      </label>)}
    </div>
    {error && <p id="avatar-error" className="mt-2 font-bold text-error">{error}</p>}
  </fieldset>
}
