import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
import type { Perfil } from '../services/api/usuarios'
import type { AvisoGoogle } from '../services/googleAuth'

export type EstadoSesion = 'cargando' | 'sin-sesion' | 'pendiente' | 'completo' | 'error'
export const AuthContext = createContext<{
  usuario: User | null; perfil: Perfil | null; estado: EstadoSesion; error: string
  actualizarPerfil: (usuarioEsperado?: User) => Promise<Perfil | null>
  cerrarSesion: () => Promise<void>
  ingresarConGoogle: () => Promise<void>
  googleActivo: boolean
  avisoGoogle: AvisoGoogle | null
} | null>(null)

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('Falta AuthProvider')
  return contexto
}
