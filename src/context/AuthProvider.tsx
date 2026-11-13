import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { obtenerAuth } from '../services/firebase'
import { consultarPerfil } from '../services/api/usuarios'
import type { Perfil } from '../services/api/usuarios'
import { AuthContext } from './auth'
import type { EstadoSesion } from './auth'
import { ConsultaCanceladaError, crearConsultaCoordinada } from '../services/consultaCoordinada'
import { confirmarCierreSesion } from '../services/confirmarCierreSesion'
import { autenticarConGoogle, crearAccesoGoogle } from '../services/googleAuth'
import type { AvisoGoogle } from '../services/googleAuth'
import { accederConCorreo, autenticarConCorreo } from '../services/ingresoCorreo'
import { crearExclusionAuth } from '../services/operacionAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [estado, setEstado] = useState<EstadoSesion>('cargando')
  const [error, setError] = useState('')
  const cuenta = useRef<User | null>(null)
  const consultas = useRef(crearConsultaCoordinada<Perfil | null>())
  const [googleActivo, setGoogleActivo] = useState(false)
  const [avisoGoogle, setAvisoGoogle] = useState<AvisoGoogle | null>(null)
  const [correoActivo, setCorreoActivo] = useState(false)
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const excluir = useRef(crearExclusionAuth())

  const limpiarSesion = useCallback(() => {
    consultas.current.invalidar()
    cuenta.current = null
    setUsuario(null)
    setPerfil(null)
    setEstado('sin-sesion')
    setError('')
    setAvisoGoogle(null)
  }, [])

  const cargar = useCallback(async (actual: User) => {
    if (obtenerAuth().currentUser?.uid !== actual.uid) throw new ConsultaCanceladaError()
    cuenta.current = actual
    setUsuario(actual)
    setPerfil(null)
    setEstado('cargando')
    setError('')
    try {
      const datos = await consultas.current.consultar(
        actual.uid,
        () => consultarPerfil(actual),
        () => obtenerAuth().currentUser?.uid === actual.uid,
      )
      if (obtenerAuth().currentUser?.uid !== actual.uid || cuenta.current?.uid !== actual.uid) {
        throw new ConsultaCanceladaError()
      }
      setPerfil(datos)
      setEstado(datos ? 'completo' : 'pendiente')
      return datos
    } catch (e) {
      if (obtenerAuth().currentUser?.uid !== actual.uid || cuenta.current?.uid !== actual.uid) {
        throw new ConsultaCanceladaError()
      }
      if (!(e instanceof ConsultaCanceladaError)) {
        setEstado('error')
        setError(e instanceof Error ? e.message : 'No pudimos consultar tu perfil.')
      }
      throw e
    }
  }, [])

  useEffect(() => {
    let activo = true
    const coordinador = consultas.current
    try {
      const cancelar = onAuthStateChanged(obtenerAuth(), actual => {
        if (!activo) return
        if (actual?.uid !== obtenerAuth().currentUser?.uid) return
        // actualizarPerfil puede haber sincronizado ya la cuenta recién creada.
        if (actual && cuenta.current?.uid === actual.uid) return
        coordinador.invalidar()
        cuenta.current = actual
        setUsuario(actual)
        setPerfil(null)
        if (actual) void cargar(actual).catch(() => {})
        else limpiarSesion()
      }, e => {
        if (!activo) return
        coordinador.invalidar()
        setPerfil(null)
        setEstado('error')
        setError(e.message)
      })
      return () => { activo = false; cuenta.current = null; coordinador.invalidar(); cancelar() }
    } catch (e) {
      queueMicrotask(() => {
        if (!activo) return
        setEstado('error')
        setError(e instanceof Error ? e.message : 'No pudimos inicializar la sesión.')
      })
      return () => { activo = false; coordinador.invalidar() }
    }
  }, [cargar, limpiarSesion])

  async function actualizarPerfil(usuarioEsperado?: User) {
    const actual = obtenerAuth().currentUser
    if (!actual) throw new Error('Debes iniciar sesión para completar tu perfil.')
    if (usuarioEsperado && actual.uid !== usuarioEsperado.uid) throw new ConsultaCanceladaError()
    return cargar(actual)
  }

  async function cerrarSesion() {
    await excluir.current(async () => {
      setCerrandoSesion(true)
      try {
        const auth = obtenerAuth()
        await confirmarCierreSesion(() => signOut(auth), () => auth.currentUser !== null, limpiarSesion)
      } finally { setCerrandoSesion(false) }
    })
  }

  const accesoGoogle = useMemo(() => crearAccesoGoogle(autenticarConGoogle, cargar, {
    iniciar: () => { setGoogleActivo(true); setAvisoGoogle(null) },
    aviso: setAvisoGoogle,
    finalizar: () => setGoogleActivo(false),
  }), [cargar])

  async function ingresarConGoogle() {
    // Un segundo clic no abre otro popup ni compite con el acceso por correo.
    if (correoActivo || cerrandoSesion) return
    try { await excluir.current(accesoGoogle) } catch { /* Ya hay una operación activa. */ }
  }

  async function ingresarConCorreo(correo: string, password: string) {
    await excluir.current(async () => {
      setCorreoActivo(true)
      setAvisoGoogle(null)
      try {
        await accederConCorreo(correo, password, autenticarConCorreo, cargar)
      } finally { setCorreoActivo(false) }
    })
  }

  return <AuthContext.Provider value={{ usuario, perfil, estado, error, actualizarPerfil, cerrarSesion, ingresarConGoogle, googleActivo, avisoGoogle, ingresarConCorreo, correoActivo, cerrandoSesion }}>{children}</AuthContext.Provider>
}
