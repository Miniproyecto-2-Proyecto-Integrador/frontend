import { useAuth } from '../../context/auth'
import { Button } from '../common/Button'
import { Cargando } from '../common/Estados'

export function BotonGoogle({ disabled = false }: { disabled?: boolean }) {
  const { ingresarConGoogle, googleActivo, avisoGoogle, correoActivo, cerrandoSesion } = useAuth()
  return <div className="space-y-3">
    <Button type="button" variante="secundario" className="w-full" disabled={disabled || googleActivo || correoActivo || cerrandoSesion}
      onClick={() => void ingresarConGoogle()}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" className="shrink-0">
        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.36Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z" />
        <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5L18.7 4.6A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z" />
      </svg>
      {googleActivo ? 'Conectando con Google…' : 'Continuar con Google'}
    </Button>
    {googleActivo && <Cargando detalle="Completa el acceso en Google; después comprobaremos tu perfil." />}
    {avisoGoogle && <p role={avisoGoogle.tipo === 'cancelacion' ? 'status' : 'alert'}
      className={avisoGoogle.tipo === 'cancelacion' ? 'text-texto-suave' : 'rounded-xl bg-error-fondo p-4 text-error'}>
      {avisoGoogle.mensaje}
    </p>}
  </div>
}
