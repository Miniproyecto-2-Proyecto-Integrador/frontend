import { Copy } from 'lucide-react'
import { useState } from 'react'
import { Button } from './Button'

// «normal»: bloque vertical (como antes). «compacto»: una sola fila (lista de salas).
// «barra»: una sola fila sobre la barra oscura de la sala.
export function CopiarIdSala({ id, variante = 'normal' }: { id: string; variante?: 'normal' | 'compacto' }) {
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  async function copiar() {
    setMensaje('')
    setError('')
    try {
      await navigator.clipboard.writeText(id)
      setMensaje('ID copiado.')
    } catch {
      setError('No pudimos copiar el ID. Puedes seleccionarlo y copiarlo manualmente.')
    }
  }
  if (variante === 'normal') return <div>
    <p className="break-all text-texto-suave">ID: <span className="select-all">{id}</span></p>
    <Button variante="secundario" className="mt-3" onClick={() => void copiar()} aria-label={`Copiar ID de sala ${id}`}>Copiar ID</Button>
    <p role="status" className="mt-2 text-sm text-bosque">{mensaje}</p>
    {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
  </div>

  return <div>
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="break-all text-texto-suave">ID: <span className="numeros select-all font-bold text-texto">{id}</span></p>
      <Button variante="secundario" onClick={() => void copiar()} aria-label={`Copiar ID de sala ${id}`}>
        <Copy aria-hidden="true" size={18} /> Copiar ID
      </Button>
      <p role="status" className="text-sm text-bosque">{mensaje}</p>
    </div>
    {error && <p role="alert" className="mt-1 text-sm text-error">{error}</p>}
  </div>
}
