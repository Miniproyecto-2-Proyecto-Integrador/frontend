import { useState } from 'react'
import { Button } from './Button'

export function CopiarIdSala({ id }: { id: string }) {
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
  return <div>
    <p className="break-all text-texto-suave">ID: <span className="select-all">{id}</span></p>
    <Button variante="secundario" className="mt-3" onClick={() => void copiar()} aria-label={`Copiar ID de sala ${id}`}>Copiar ID</Button>
    <p role="status" className="mt-2 text-sm text-bosque">{mensaje}</p>
    {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
  </div>
}
