import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { obtenerAuth } from './firebase'
import type { Perfil } from './api/usuarios'

export function esUsuarioGoogle(usuario: User | null) {
  return usuario?.providerData?.some(proveedor => proveedor.providerId === 'google.com') ?? false
}

// Se invoca desde el clic: no esperar consultas ni tareas antes de abrir la ventana.
export function autenticarConGoogle() {
  const proveedor = new GoogleAuthProvider()
  proveedor.setCustomParameters({ prompt: 'select_account' })
  return signInWithPopup(obtenerAuth(), proveedor)
}

export type AvisoGoogle = {
  tipo: 'cancelacion' | 'bloqueado' | 'configuracion' | 'red' | 'inesperado'
  mensaje: string
}

export function crearAccesoGoogle(
  abrirPopup: () => Promise<{ user: User }>,
  cargarPerfil: (usuario: User) => Promise<Perfil | null>,
  notificar: { iniciar: () => void; aviso: (aviso: AvisoGoogle) => void; finalizar: () => void },
) {
  let activo = false
  return async () => {
    if (activo) return
    activo = true
    notificar.iniciar()
    let autenticado = false
    try {
      const resultado = await abrirPopup()
      autenticado = true
      await cargarPerfil(resultado.user)
    } catch (e) {
      // Tras autenticar, el contexto gestiona los errores de consulta del perfil.
      if (!autenticado) notificar.aviso(describirErrorGoogle(e))
    } finally {
      activo = false
      notificar.finalizar()
    }
  }
}

export function describirErrorGoogle(error: unknown): AvisoGoogle {
  if (error instanceof Error && error.message.startsWith('Falta configurar Firebase')) {
    return { tipo: 'configuracion', mensaje: 'Falta configurar Firebase en este entorno. Contacta al equipo.' }
  }
  const codigo = error && typeof error === 'object' && 'code' in error ? error.code : ''
  switch (codigo) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return { tipo: 'cancelacion', mensaje: 'Se canceló el acceso con Google. Puedes intentarlo de nuevo.' }
    case 'auth/popup-blocked':
      return { tipo: 'bloqueado', mensaje: 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio y reintenta.' }
    case 'auth/unauthorized-domain':
    case 'auth/operation-not-allowed':
    case 'auth/invalid-api-key':
    case 'auth/auth-domain-config-required':
    case 'auth/app-not-authorized':
    case 'auth/invalid-oauth-client-id':
      return { tipo: 'configuracion', mensaje: 'Google no está disponible con la configuración actual. Contacta al equipo para revisar el proveedor y los dominios autorizados.' }
    case 'auth/network-request-failed':
      return { tipo: 'red', mensaje: 'No pudimos conectar con Google. Revisa tu conexión y reintenta.' }
    case 'auth/account-exists-with-different-credential':
      return { tipo: 'inesperado', mensaje: 'No pudimos acceder con Google. Usa el método con el que creaste tu cuenta. No se vinculó ningún proveedor.' }
    default:
      return { tipo: 'inesperado', mensaje: 'No pudimos completar el acceso con Google. Reintenta; si persiste, contacta al equipo.' }
  }
}
