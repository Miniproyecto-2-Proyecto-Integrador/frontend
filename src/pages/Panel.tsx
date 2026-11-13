import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { RequierePerfil } from '../components/auth/RequierePerfil'
import { PaginaPendiente } from '../components/common/PaginaPendiente'
import { Button } from '../components/common/Button'
import { cerrarDesdePanel } from '../services/cerrarDesdePanel'

export function Panel() {
  const { usuario, cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const [cerrando, setCerrando] = useState(false)
  const [error, setError] = useState('')
  const bloqueo = useRef(false)
  const alerta = useRef<HTMLDivElement>(null)

  function cerrar() {
    if (!usuario) return
    void cerrarDesdePanel(bloqueo, cerrarSesion, navegar, estado => {
      setCerrando(estado === 'cerrando')
      setError(estado === 'error' ? 'No pudimos cerrar la sesión. Vuelve a pulsar Cerrar sesión para reintentar.' : '')
      if (estado === 'error') requestAnimationFrame(() => alerta.current?.focus())
    })
  }

  return <RequierePerfil cierreEnCurso={cerrando}>
    <PaginaPendiente titulo="Panel" />
    {usuario && <div className="mx-auto max-w-3xl px-4 pb-12">
      {error && <div ref={alerta} tabIndex={-1} role="alert" className="mb-4 rounded-xl bg-error-fondo p-4 text-error">{error}</div>}
      <Button variante="secundario" onClick={cerrar} disabled={cerrando}>Cerrar sesión</Button>
    </div>}
  </RequierePerfil>
}
