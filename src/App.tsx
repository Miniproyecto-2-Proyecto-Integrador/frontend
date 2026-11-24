import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
const BaseTecnica = lazy(() => import('./pages/BaseTecnica').then(m => ({ default: m.BaseTecnica })))
import { Inicio } from './pages/Inicio'
const NoEncontrada = lazy(() => import('./pages/NoEncontrada').then(m => ({ default: m.NoEncontrada })))
const Registro = lazy(() => import('./pages/Registro').then(m => ({ default: m.Registro })))
const Ingreso = lazy(() => import('./pages/Ingreso').then(m => ({ default: m.Ingreso })))
const ElegirUsuario = lazy(() => import('./pages/ElegirUsuario').then(m => ({ default: m.ElegirUsuario })))
import { AuthProvider } from './context/AuthProvider'
const Panel = lazy(() => import('./pages/Panel').then(m => ({ default: m.Panel })))
const Sala = lazy(() => import('./pages/Sala').then(m => ({ default: m.Sala })))
const Perfil = lazy(() => import('./pages/Perfil').then(m => ({ default: m.Perfil })))
import { RequierePerfil } from './components/auth/RequierePerfil'
const Accesibilidad = lazy(() => import('./pages/PaginasPendientes').then(m => ({ default: m.Accesibilidad })))
const Ayuda = lazy(() => import('./pages/PaginasPendientes').then(m => ({ default: m.Ayuda })))

export default function App() {
  return (
    <AuthProvider><BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="ingresar" element={<Ingreso />} />
          <Route path="registro" element={<Registro />} />
          <Route path="registro/usuario" element={<ElegirUsuario />} />
          <Route path="dashboard" element={<Panel />} />
          <Route path="perfil" element={<RequierePerfil><Perfil /></RequierePerfil>} />
          <Route path="salas/:id" element={<RequierePerfil><Sala /></RequierePerfil>} />
          <Route path="base-tecnica" element={<BaseTecnica />} />
          <Route path="ayuda" element={<Ayuda />} />
          <Route path="accesibilidad" element={<Accesibilidad />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
    </BrowserRouter></AuthProvider>
  )
}
