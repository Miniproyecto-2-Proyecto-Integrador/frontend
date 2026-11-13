export function destinoSeguro(valor: unknown): string {
  if (typeof valor !== 'string' || !valor.startsWith('/') || valor.startsWith('//')) return '/dashboard'
  try {
    const decodificado = decodeURIComponent(valor)
    if (decodificado.includes(String.fromCharCode(92)) || [...decodificado].some(letra => letra.charCodeAt(0) <= 32)) return '/dashboard'
    const url = new URL(valor, 'https://destino.invalid')
    const ruta = valor.split(/[?#]/)[0]
    if (url.origin !== 'https://destino.invalid' || url.pathname !== ruta) return '/dashboard'
    if (!/^\/(dashboard|perfil|salas\/[a-zA-Z0-9_-]+)$/.test(ruta)) return '/dashboard'
    return valor
  } catch { return '/dashboard' }
}

export function destinoDelEstado(estado: unknown) {
  return destinoSeguro(estado && typeof estado === 'object' && 'from' in estado ? estado.from : undefined)
}
