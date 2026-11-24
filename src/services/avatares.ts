// Fondos suaves de la paleta. Los cuatro primeros acompañan a los avatares; avatar5 y avatar6
// sirven para perfiles antiguos (ya no se ofrecen, pero se siguen mostrando).
export const estilosAvatar = [
  'from-arena to-miel', 'from-hoja-suave to-salvia',
  'from-terracota to-arena', 'from-lino to-musgo',
  'from-hoja-claro to-hoja-suave', 'from-miel to-terracota',
] as const

// Avatares disponibles para elegir. El valor que se guarda sigue siendo «avatarN», igual que antes.
export const personajes = [
  { id: 'avatar1', nombre: 'Gato con moño', src: '/avatares/avatar1.webp', ajuste: 'contain' },
  { id: 'avatar2', nombre: 'Gato amarillo', src: '/avatares/avatar2.webp', ajuste: 'contain' },
  { id: 'avatar3', nombre: 'Pingüino sabio', src: '/avatares/avatar3.webp', ajuste: 'contain' },
  { id: 'avatar4', nombre: 'Yuca asada', src: '/avatares/avatar4.webp', ajuste: 'cover' },
] as const

export function esAvatarValido(valor: string) {
  return /^avatar[1-6]$/.test(valor)
}
