import type { FormEvent } from 'react'
import { useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { CampoFormulario } from '../components/auth/CampoFormulario'
import { SelectorAvatar } from '../components/auth/SelectorAvatar'
import { AvatarUsuario } from '../components/common/AvatarUsuario'
import { Button } from '../components/common/Button'
import { Cargando, MensajeExito } from '../components/common/Estados'
import { Tarjeta } from '../components/common/Tarjeta'
import { useAuth } from '../context/auth'
import { ApiError } from '../services/api/apiClient'
import type { Perfil as DatosGuardados, EdicionPerfil } from '../services/api/usuarios'
import { cambiosPerfil, validarPerfil } from '../services/validarPerfil'

export function Perfil() {
  const { perfil, usuario } = useAuth()
  return perfil && usuario ? <EditorPerfil key={usuario.uid} inicial={perfil} /> : null
}

function EditorPerfil({ inicial }: { inicial: DatosGuardados }) {
  const { perfil, guardarPerfil, modificandoCuenta, cerrandoSesion } = useAuth()
  const contexto = useOutletContext<{ cierreEnCurso?: boolean; abrirEliminarCuenta?: (boton: HTMLButtonElement) => void } | undefined>()
  const cierre = contexto?.cierreEnCurso
  const [editando, setEditando] = useState(false)
  const botonEditar = useRef<HTMLButtonElement>(null)
  const [datos, setDatos] = useState<EdicionPerfil>(inicial)
  const [errores, setErrores] = useState<Partial<Record<keyof EdicionPerfil, string>>>({})
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  const bloqueo = useRef(false)
  const formulario = useRef<HTMLFormElement>(null)
  const alerta = useRef<HTMLParagraphElement>(null)
  const navegar = useNavigate()
  const ocupado = modificandoCuenta || cerrandoSesion || !!cierre
  const campos = ['nombres', 'apellidos', 'username', 'correo'] as const
  function cambiar(campo: keyof EdicionPerfil, valor: string) {
    setDatos(anterior => ({ ...anterior, [campo]: valor }))
    setErrores(anterior => ({ ...anterior, [campo]: undefined })); setAviso(''); setError('')
  }
  function enfocarError(campos: Partial<Record<keyof EdicionPerfil, string>>) {
    const campo = Object.keys(campos)[0]
    requestAnimationFrame(() => campo ? formulario.current?.querySelector<HTMLInputElement>(`#perfil-${campo}`)?.focus() : alerta.current?.focus())
  }
  async function guardar(e: FormEvent) {
    e.preventDefault()
    if (bloqueo.current || ocupado || !editando) return
    const limpios: EdicionPerfil = { nombres: datos.nombres.trim(), apellidos: datos.apellidos.trim(), username: datos.username.trim(), avatar: datos.avatar, correo: datos.correo.trim().toLowerCase() }
    const nuevos = validarPerfil(limpios)
    setErrores(nuevos); setAviso(''); setError('')
    if (Object.keys(nuevos).length) { enfocarError(nuevos); return }
    if (perfil && !Object.keys(cambiosPerfil(perfil, limpios)).length) { setEditando(false); setAviso('No hay cambios por guardar.'); requestAnimationFrame(() => botonEditar.current?.focus()); return }
    bloqueo.current = true
    const cambiaCorreo = limpios.correo !== perfil?.correo.trim().toLowerCase()
    try {
      const guardado = await guardarPerfil(limpios)
      if (cambiaCorreo) { navegar('/ingresar', { replace: true, state: { correoActualizado: true } }); return }
      setDatos(guardado); setEditando(false); setAviso('Cambios guardados correctamente.'); requestAnimationFrame(() => botonEditar.current?.focus())
    }
    catch (e) {
      const campos = e instanceof ApiError ? Object.fromEntries(Object.entries(e.errores).filter(([k]) => ['nombres', 'apellidos', 'username', 'correo', 'avatar'].includes(k))) : {}
      setErrores(campos); setError(e instanceof Error ? e.message : 'No pudimos guardar los cambios. Intenta de nuevo.'); enfocarError(campos)
    } finally { bloqueo.current = false }
  }
  return <section className="mx-auto max-w-4xl space-y-6 px-4 py-10">
    <div className="entrada"><h1>Mi perfil</h1><p className="mt-2 text-texto-suave">Tus datos, a tu manera. Actualízalos cuando quieras.</p></div>
    {aviso && <MensajeExito>{aviso}</MensajeExito>}
    <Tarjeta>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4"><AvatarUsuario valor={datos.avatar} /><div className="min-w-0"><h2>Información personal</h2><p className="mt-1 break-words text-texto-suave">@{perfil?.username}</p></div></div>
        <Button ref={botonEditar} variante="secundario" disabled={ocupado || editando} aria-controls="formulario-perfil" aria-expanded={editando} onClick={() => {
          setEditando(true); setAviso(''); setError(''); setErrores({})
          requestAnimationFrame(() => formulario.current?.querySelector<HTMLInputElement>('#perfil-nombres')?.focus())
        }}>Editar perfil</Button>
      </div>
      <form id="formulario-perfil" ref={formulario} onSubmit={e => void guardar(e)} noValidate aria-busy={modificandoCuenta} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">{campos.map(campo => <CampoFormulario key={campo} id={`perfil-${campo}`} etiqueta={{ nombres: 'Nombres', apellidos: 'Apellidos', username: 'Nombre de usuario', correo: 'Correo electrónico' }[campo]} type={campo === 'correo' ? 'email' : 'text'} autoComplete={{ nombres: 'given-name', apellidos: 'family-name', username: 'username', correo: 'email' }[campo]} value={datos[campo]} onChange={e => cambiar(campo, e.target.value)} error={errores[campo]} maxLength={campo === 'username' ? 20 : campo === 'correo' ? 254 : 50} disabled={!editando || ocupado} required ayuda={campo === 'username' ? 'Entre 3 y 20 letras, números o guion bajo.' : campo === 'correo' ? 'Si cambias el correo, te pediremos iniciar sesión de nuevo.' : undefined} />)}</div>
        {editando && <SelectorAvatar valor={datos.avatar} onChange={valor => cambiar('avatar', valor)} disabled={ocupado} error={errores.avatar} />}
        {error && <p ref={alerta} tabIndex={-1} role="alert" className="rounded-xl bg-error-fondo p-4 text-error">{error}</p>}
        {modificandoCuenta && <Cargando variante="compacto" detalle="Estamos guardando tu perfil." />}
        {editando && <div className="flex flex-wrap gap-3"><Button type="submit" disabled={ocupado}>Guardar cambios</Button><Button variante="secundario" disabled={ocupado} onClick={() => {
          setDatos(perfil ?? inicial); setErrores({}); setError(''); setEditando(false); setAviso('Se descartaron los cambios sin guardar.')
          requestAnimationFrame(() => botonEditar.current?.focus())
        }}>Cancelar</Button></div>}
      </form>
    </Tarjeta>
    <Tarjeta>
      <h2>Eliminar cuenta</h2>
      <p className="mt-2 text-texto-suave">Si eliminas tu cuenta, perderás tu perfil y las salas que creaste. Esta acción no se puede deshacer.</p>
      <Button className="mt-4" variante="peligro" disabled={ocupado} onClick={e => contexto?.abrirEliminarCuenta?.(e.currentTarget)}>Eliminar cuenta</Button>
    </Tarjeta>
  </section>
}