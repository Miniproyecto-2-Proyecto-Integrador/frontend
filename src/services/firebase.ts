import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export function obtenerAuth() {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  if (Object.values(config).some(valor => !valor)) {
    throw new Error('Falta configurar Firebase. Consulta las variables públicas de .env.example.')
  }
  return getAuth(getApps().length ? getApp() : initializeApp(config))
}
