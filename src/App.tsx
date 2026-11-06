import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { BaseTecnica } from './pages/BaseTecnica'
import { Inicio } from './pages/Inicio'
import { NoEncontrada } from './pages/NoEncontrada'
import {
  Accesibilidad,
  Ayuda,
  Ingreso,
  Panel,
  Perfil,
  Registro,
  Sala,
} from './pages/PaginasPendientes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="ingreso" element={<Ingreso />} />
          <Route path="registro" element={<Registro />} />
          <Route path="panel" element={<Panel />} />
          <Route path="perfil" element={<Perfil />} />
          <Route path="salas/:id" element={<Sala />} />
          <Route path="base-tecnica" element={<BaseTecnica />} />
          <Route path="ayuda" element={<Ayuda />} />
          <Route path="accesibilidad" element={<Accesibilidad />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}