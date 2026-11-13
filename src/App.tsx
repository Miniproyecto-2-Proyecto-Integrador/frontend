import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { BaseTecnica } from './pages/BaseTecnica'
import { Inicio } from './pages/Inicio'
import { NoEncontrada } from './pages/NoEncontrada'
import { Registro } from './pages/Registro'
import { AuthProvider } from './context/AuthProvider'
import { RequierePerfil } from './components/auth/RequierePerfil'
import {
  Accesibilidad,
  Ayuda,
  ElegirUsuario,
  Ingreso,
  Panel,
  Perfil,
  Sala,
} from './pages/PaginasPendientes'

export default function App() {
  return (
    <AuthProvider><BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="ingresar" element={<Ingreso />} />
          <Route path="registro" element={<Registro />} />
          <Route path="registro/usuario" element={<ElegirUsuario />} />
          <Route path="dashboard" element={<RequierePerfil><Panel /></RequierePerfil>} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="salas/:id" element={<Sala />} />
          <Route path="base-tecnica" element={<BaseTecnica />} />
          <Route path="ayuda" element={<Ayuda />} />
          <Route path="accesibilidad" element={<Accesibilidad />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
    </BrowserRouter></AuthProvider>
  )
}
