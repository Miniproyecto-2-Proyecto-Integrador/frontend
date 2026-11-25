import { MessagesSquare, Phone, Settings } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnunciosSala } from '../components/chat/AnunciosSala'
import { ChatSala } from '../components/chat/ChatSala'
import { ListaParticipantes } from '../components/chat/ListaParticipantes'
import { Button, ButtonLink } from '../components/common/Button'
import { CopiarIdSala } from '../components/common/CopiarIdSala'
import { Cargando, MensajeAviso, MensajeError } from '../components/common/Estados'
import { FondoSala } from '../components/layout/FondoSala'
import { AdministrarSala } from '../components/salas/AdministrarSala'
import { useAuth } from '../context/auth'
import { useHistorialChat } from '../hooks/useHistorialChat'
import { useSala } from '../hooks/useSala'
import { useSalaEnVivo } from '../hooks/useSalaEnVivo'

// US-08: la sala se consulta por ID a la API, sea propia o de otra persona. El rol lo decide el servidor.
// US-10: dentro de la sala hay tres zonas: chat, participantes y acciones (compartir ID y, para el anfitrión, administrar).
// Diseño: pantalla completa, como una videollamada: recuadros al centro, barra de controles abajo y chat al costado.
// Paleta de la sala: fondo verde cafesito con doodles, paneles en cafés y superficies crema.
export function Sala() {
  const { id } = useParams()
  // Con «key» el estado de la sala (salida, nombre en vivo) no se arrastra al abrir otra sala.
  return <SalaAbierta key={id} id={id} />
}

function SalaAbierta({ id }: { id: string | undefined }) {
  const { sala, error, status, cargando, reintentar } = useSala(id)
  const { perfil } = useAuth()
  // 400 (ID inválido) y 404 (no existe) no mejoran al reintentar: se explican y se ofrece volver.
  const sinReintento = status === 400 || status === 404
  const navegar = useNavigate()
  // Solo para pantallas chicas: el chat se abre desde la barra inferior y comparte la pantalla con los participantes (en pantallas grandes siempre se ve).
  const [chatAbierto, setChatAbierto] = useState(false)
  const [cambio, setCambio] = useState<{ id: string; nombre: string } | null>(null)
  const esAnfitrion = sala?.rol === 'administrador'
  const nombre = sala && cambio?.id === sala.id ? cambio.nombre : sala?.nombre ?? ''
  const salio = useRef(false)
  // Elimina quien es anfitrión (respuesta de la API) o lo avisa el servidor en tiempo real a quienes están dentro.
  function volverAlPanelPorEliminacion() {
    if (salio.current) return
    salio.current = true
    navegar('/dashboard', { replace: true, state: { avisoSala: { tipo: esAnfitrion ? 'eliminada-propia' : 'eliminada-por-anfitrion', nombre } } })
  }
  const { estado: conexion, mensaje: mensajeConexion, participantes, mensajes, anuncios, enviarMensaje, incorporarMensajes } = useSalaEnVivo(sala?.id, {
    alEliminarSala: volverAlPanelPorEliminacion,
    alActualizarNombre: nuevo => { if (sala) setCambio({ id: sala.id, nombre: nuevo }) },
  })
  const historial = useHistorialChat(sala?.id, conexion, incorporarMensajes)
  const volverAMisSalas = <ButtonLink to="/dashboard" variante="secundario">Volver a mis salas</ButtonLink>
  if (cargando || error || !sala) {
    return <section className="mx-auto max-w-3xl px-4 py-10">
      {volverAMisSalas}
      {cargando ? <><h1 className="mt-8 text-center">Abriendo la sala</h1><Cargando variante="pagina" detalle="Estamos abriendo la sala." /></>
        : <><h1 className="mt-8">{sinReintento ? 'Sala no disponible' : 'No pudimos abrir la sala'}</h1><div className="mt-6">{sinReintento
          ? <div role="alert" className="rounded-2xl bg-error-fondo p-4 text-error">{error}</div>
          : <MensajeError mensaje={error} onReintentar={reintentar} />}</div></>}
    </section>
  }
  // Celular: la sala se reparte en cuatro franjas que nunca se tapan entre sí (encabezado, participantes, chat y controles).
  // Con el chat cerrado los participantes llenan la pantalla; con el chat abierto pasan a una tira arriba y el chat ocupa el resto.
  return <section className="zona-oscura relative isolate flex h-dvh flex-col gap-2 overflow-hidden bg-cafesito p-2 text-papel sm:gap-3 sm:p-4">
    <FondoSala />
    <header className="zona-clara flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl bg-papel px-3 py-2 text-texto shadow-papel sm:px-4 sm:py-3">
      <div className="min-w-0">
        <h1 className="entrada break-words text-[clamp(1.2rem,1.05rem+0.9vw,1.9rem)]">{nombre}</h1>
        <p className="text-sm text-texto-suave sm:text-base [@media(max-height:34rem)]:hidden">{esAnfitrion ? 'Eres administrador de esta sala.' : 'Estás en esta sala como participante.'}</p>
      </div>
      <div className={`min-w-0 ${chatAbierto ? 'max-lg:hidden' : ''}`}>
        <h2 className="text-base max-sm:sr-only">{esAnfitrion ? 'Comparte tu sala' : 'ID de la sala'}</h2>
        <p className="sr-only">{esAnfitrion ? 'Copia el ID para compartirlo con tus compañeros.' : 'Puedes copiar el ID para invitar a otras personas.'}</p>
        <CopiarIdSala id={sala.id} variante="compacto" />
      </div>
    </header>
    {conexion === 'sin-conexion' && <MensajeAviso>{mensajeConexion} Si te pierdes un cambio de la sala, recarga la página.</MensajeAviso>}
    <AnunciosSala anuncios={anuncios} />
    <div className={`grid min-h-0 flex-1 gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem] ${chatAbierto ? 'max-lg:grid-rows-[auto_minmax(0,1fr)]' : 'max-lg:grid-rows-[minmax(0,1fr)]'}`}>
      <div className={`min-h-0 overflow-y-auto rounded-3xl border border-papel/15 bg-cafe-oscuro p-3 shadow-papel sm:p-4 ${chatAbierto ? 'max-lg:p-2' : ''}`}>
        <ListaParticipantes participantes={participantes} estado={conexion} miNombre={perfil?.username} miAvatar={perfil?.avatar} compacto={chatAbierto} />
      </div>
      <div id="panel-chat" className={`zona-clara min-h-0 ${chatAbierto ? '' : 'max-lg:hidden'}`}>
        <ChatSala mensajes={mensajes} estado={conexion} enviar={enviarMensaje} historial={historial} />
      </div>
    </div>
    <div role="group" aria-label="Controles de la sala" className="zona-clara mx-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-papel p-2 text-texto shadow-papel sm:w-fit sm:gap-3">
      <Button variante="secundario" className="min-w-0 flex-1 px-3 aria-expanded:bg-hoja-claro sm:flex-none sm:px-6 lg:hidden" aria-expanded={chatAbierto} aria-controls="panel-chat" onClick={() => setChatAbierto(abierto => !abierto)}>
        <MessagesSquare aria-hidden="true" size={20} className="shrink-0" /><span className="max-sm:sr-only">{chatAbierto ? 'Ocultar ' : 'Mostrar '}</span><span className="max-sm:first-letter:uppercase">chat</span>
      </Button>
      {esAnfitrion && <details className="relative min-w-0 flex-1 sm:flex-none">
        <summary className="flex min-h-11 w-full cursor-pointer list-none items-center justify-center gap-2 rounded-xl border-2 border-primario bg-papel px-3 py-2 text-base font-bold text-primario transition-[background-color] duration-200 hover:bg-hoja-claro motion-reduce:transition-none sm:inline-flex sm:w-auto sm:px-6 [&::-webkit-details-marker]:hidden">
          <Settings aria-hidden="true" size={18} className="shrink-0" />Administrar<span className="max-sm:sr-only"> sala</span>
        </summary>
        <div className="zona-clara z-40 text-texto max-lg:fixed max-lg:inset-x-3 max-lg:bottom-24 max-lg:max-h-[calc(100dvh-8rem)] max-lg:overflow-y-auto lg:absolute lg:bottom-full lg:left-1/2 lg:mb-3 lg:w-[24rem] lg:-translate-x-1/2">
          <AdministrarSala id={sala.id} nombre={nombre}
            alActualizar={nuevo => setCambio({ id: sala.id, nombre: nuevo })}
            alEliminar={volverAlPanelPorEliminacion} />
        </div>
      </details>}
      <Link to="/dashboard" aria-label="Salir de la sala" title="Salir de la sala"
        className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-error text-white shadow-boton transition-[background-color,scale] duration-200 ease-(--ease-salida) hover:bg-red-800 motion-safe:active:scale-[0.96] motion-reduce:transition-none">
        <Phone aria-hidden="true" size={22} className="rotate-[135deg]" fill="currentColor" />
      </Link>
    </div>
  </section>
}
