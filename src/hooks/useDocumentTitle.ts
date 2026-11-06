import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const titulos: Record<string, string> = {
  '/': 'Inicio',
  '/ingresar': 'Iniciar sesión',
  '/registro': 'Crear cuenta',
  '/registro/usuario': 'Elegir nombre de usuario',
  '/dashboard': 'Panel',
  '/perfil': 'Mi perfil',
  '/base-tecnica': 'Base técnica',
  '/ayuda': 'Ayuda',
  '/accesibilidad': 'Declaración de accesibilidad',
}

export function useDocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    const nombre = pathname.startsWith('/salas/')
      ? 'Sala'
      : (titulos[pathname] ?? 'Página no encontrada')
    document.title = `${nombre} · Salón de Estudio`
  }, [pathname])
}