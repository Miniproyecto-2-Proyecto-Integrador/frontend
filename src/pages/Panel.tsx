import { useAuth } from '../context/auth'
import { RequierePerfil } from '../components/auth/RequierePerfil'
import { AvatarUsuario } from '../components/common/AvatarUsuario'
import { EstadoVacio } from '../components/common/Estados'

export function Panel() {
  const { perfil } = useAuth()
  return <RequierePerfil>
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1>Panel</h1>
      {perfil && <div className="mt-6 flex items-center gap-4">
        <AvatarUsuario valor={perfil.avatar} />
        <p className="min-w-0 break-words text-xl">Hola, {perfil.nombres}.</p>
      </div>}
      <div className="mt-6"><EstadoVacio mensaje="Todavía no tienes salas. Aquí las verás cuando las tengas" /></div>
    </section>
  </RequierePerfil>
}
