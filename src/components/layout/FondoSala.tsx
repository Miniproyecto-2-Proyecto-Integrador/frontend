// Fondo de la sala: verde cafesito con doodles de estudio (hojas, taza, libro, lápiz, estrellas) en trazo crema muy suave.
// Es solo decoración: oculto a lectores de pantalla, sin foco, sin movimiento y con tan poco contraste que no afecta al texto.
export function FondoSala() {
  return (
    <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 -z-10 size-full text-fondo/[0.13]">
      <defs>
        <pattern id="doodles-sala" width="180" height="180" viewBox="0 0 220 220" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* taza con vapor */}
            <g transform="translate(18 30) scale(0.7)">
              <path d="M0 14h30v14a12 12 0 0 1-12 12h-6a12 12 0 0 1-12-12z" />
              <path d="M30 18h4a6 6 0 0 1 0 12h-4" />
              <path d="M9 8c-3-3 3-5 0-9M19 8c-3-3 3-5 0-9" />
            </g>
            {/* hoja */}
            <g transform="translate(130 24) rotate(25) scale(0.7)">
              <path d="M0 0C10-14 30-14 40 0 30 14 10 14 0 0Z" />
              <path d="M0 0h40" />
            </g>
            {/* libro abierto */}
            <g transform="translate(120 128) scale(0.7)">
              <path d="M0 6c10-4 20-4 30 2v28c-10-6-20-6-30-2z" />
              <path d="M30 8c10-6 20-6 30-2v28c-10-4-20-4-30 2" />
            </g>
            {/* lápiz */}
            <g transform="translate(24 134) rotate(-35) scale(0.7)">
              <path d="M0 0h42v10H0z" />
              <path d="M42 0l10 5-10 5" />
              <path d="M8 0v10" />
            </g>
            {/* estrellitas y ondas */}
            <path d="M92 70v12M86 76h12" />
            <path d="M190 98v10M185 103h10" />
            <path d="M70 196v10M65 201h10" />
            <path d="M160 190c6-8 12 8 18 0s12 8 18 0" />
            <path d="M84 26c5-6 10 6 15 0" />
            <circle cx="200" cy="30" r="3" />
            <circle cx="104" cy="112" r="2.5" />
            <circle cx="14" cy="96" r="2.5" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#doodles-sala)" />
    </svg>
  )
}
