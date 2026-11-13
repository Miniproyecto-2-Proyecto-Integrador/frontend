export type MetadatosPagina = {
  titulo: string
  descripcion: string
  robots: 'index, follow' | 'noindex, follow' | 'noindex'
}

function pagina(nombre: string, descripcion: string, indexable = false): MetadatosPagina {
  return {
    titulo: `${nombre} · Salón de Estudio`,
    descripcion,
    robots: indexable ? 'index, follow' : 'noindex, follow',
  }
}

const paginas: Record<string, MetadatosPagina> = {
  '/': pagina('Inicio', 'Un espacio de estudio colaborativo para conectar con tus compañeros y aprender juntos.', true),
  '/ingresar': pagina('Iniciar sesión', 'Inicia sesión en Salón de Estudio con tu correo y contraseña o con tu cuenta de Google.'),
  '/registro': pagina('Crear cuenta', 'Crea tu cuenta en Salón de Estudio y prepara tu perfil para estudiar con tus compañeros.'),
  '/registro/usuario': pagina('Completar perfil', 'Completa los datos de tu perfil en Salón de Estudio para continuar a tu espacio de estudio.'),
  '/dashboard': pagina('Panel', 'Accede a tu Panel personal de Salón de Estudio.'),
  '/perfil': pagina('Mi perfil', 'Consulta tu perfil en Salón de Estudio.'),
  '/base-tecnica': pagina('Base técnica', 'Pantalla de comprobación técnica de la conexión de Salón de Estudio con su servidor.'),
  // Ambas páginas siguen siendo provisionales: revisar la política cuando tengan contenido público definitivo.
  '/ayuda': pagina('Ayuda', 'Información de ayuda de Salón de Estudio.'),
  '/accesibilidad': pagina('Declaración de accesibilidad', 'Información sobre accesibilidad de Salón de Estudio.'),
}

export function metadatosParaRuta(pathname: string): MetadatosPagina {
  // React Router acepta diferencias de mayúsculas y una barra final en estas rutas.
  const ruta = pathname === '/' ? '/' : pathname.replace(/\/$/, '').toLowerCase()
  if (Object.hasOwn(paginas, ruta)) return paginas[ruta]
  if (/^\/salas\/[^/]+$/.test(ruta)) return pagina('Sala', 'Espacio privado de estudio de Salón de Estudio.')
  return { ...pagina('Página no encontrada', 'La página solicitada no está disponible en Salón de Estudio.'), robots: 'noindex' }
}

function actualizarEtiqueta(documento: Document, nombre: string, contenido: string) {
  const etiquetas = [...documento.head.querySelectorAll<HTMLMetaElement>(`meta[name="${nombre}"]`)]
  const etiqueta = etiquetas[0] ?? documento.createElement('meta')
  if (!etiquetas.length) {
    etiqueta.name = nombre
    documento.head.appendChild(etiqueta)
  }
  etiqueta.content = contenido
  // Mantener una única etiqueta incluso si el HTML inicial ya contenía duplicados.
  for (const duplicada of etiquetas.slice(1)) duplicada.remove()
}

export function aplicarMetadatos(pathname: string, documento: Document = document) {
  const metadatos = metadatosParaRuta(pathname)
  documento.title = metadatos.titulo
  actualizarEtiqueta(documento, 'description', metadatos.descripcion)
  actualizarEtiqueta(documento, 'robots', metadatos.robots)
}
