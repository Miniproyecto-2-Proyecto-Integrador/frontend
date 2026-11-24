import { getApp } from 'firebase/app'
import type { User } from 'firebase/auth'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'
import { FOTO_NUEVA, esAvatarFoto } from './avatares'
import { obtenerAuth } from './firebase'

export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_BYTES_FOTO = 5 * 1024 * 1024
const LADO = 256

// La foto ya recortada y reducida (lo que se sube) y su vista previa.
export type FotoAvatar = { blob: Blob; previa: string }

export function validarArchivoFoto(archivo: { type: string; size: number }): string {
  if (!TIPOS_FOTO.includes(archivo.type)) return 'Elige una imagen JPG, PNG o WebP.'
  if (archivo.size > MAX_BYTES_FOTO) return 'La foto pesa más de 5 MB. Elige una más liviana.'
  return ''
}

function aDataUrl(blob: Blob) {
  return new Promise<string>((resolver, rechazar) => {
    const lector = new FileReader()
    lector.onload = () => resolver(String(lector.result))
    lector.onerror = () => rechazar(new Error('No pudimos leer esa imagen. Prueba con otra.'))
    lector.readAsDataURL(blob)
  })
}

// Recorta al centro en cuadrado y reduce a 256 px: la foto pesa pocos KB y se ve igual en todo el sitio.
export async function procesarFoto(archivo: File): Promise<FotoAvatar> {
  const problema = validarArchivoFoto(archivo)
  if (problema) throw new Error(problema)
  let imagen: ImageBitmap
  try { imagen = await createImageBitmap(archivo) } catch { throw new Error('No pudimos leer esa imagen. Prueba con otra.') }
  const lado = Math.min(imagen.width, imagen.height)
  const lienzo = document.createElement('canvas')
  lienzo.width = lienzo.height = LADO
  const contexto = lienzo.getContext('2d')
  if (!contexto) throw new Error('Tu navegador no pudo preparar la foto. Elige uno de los avatares disponibles.')
  contexto.drawImage(imagen, (imagen.width - lado) / 2, (imagen.height - lado) / 2, lado, lado, 0, 0, LADO, LADO)
  imagen.close()
  const aBlob = (tipo: string) => new Promise<Blob | null>(resolver => lienzo.toBlob(resolver, tipo, 0.85))
  let blob = await aBlob('image/webp')
  if (blob?.type !== 'image/webp') blob = await aBlob('image/jpeg')
  if (!blob) throw new Error('No pudimos preparar esa imagen. Prueba con otra.')
  return { blob, previa: await aDataUrl(blob) }
}

// Sube la foto a Firebase Storage (carpeta propia de la cuenta) y devuelve su dirección pública.
export async function subirFotoAvatar(usuario: User, foto: FotoAvatar): Promise<string> {
  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
  if (!bucket) throw new Error('La subida de fotos aún no está configurada. Elige uno de los avatares disponibles.')
  obtenerAuth()
  try {
    const extension = foto.blob.type === 'image/jpeg' ? 'jpg' : 'webp'
    const destino = ref(getStorage(getApp(), `gs://${bucket}`), `avatares/${usuario.uid}/${Date.now()}.${extension}`)
    await uploadBytes(destino, foto.blob, { contentType: foto.blob.type })
    const url = await getDownloadURL(destino)
    if (!esAvatarFoto(url)) throw new Error('dirección inválida')
    return url
  } catch {
    throw new Error('No pudimos subir tu foto. Revisa tu conexión y reintenta, o elige uno de los avatares disponibles.')
  }
}

// Convierte el valor del formulario en el que se envía al servidor.
export async function resolverAvatar(usuario: User, avatar: string, foto: FotoAvatar | null): Promise<string> {
  if (avatar !== FOTO_NUEVA) return avatar
  if (!foto) throw new Error('Elige una foto o uno de los avatares disponibles.')
  return subirFotoAvatar(usuario, foto)
}
