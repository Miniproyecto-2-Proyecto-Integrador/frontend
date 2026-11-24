import type { CSSProperties } from 'react'

// Ramas pálidas en las esquinas: solo decoración, sin texto, sin foco y con colores muy suaves
// para que el texto que pase por encima conserve su contraste.
const hojas = (n: number, x0: number, y0: number, dx: number, dy: number, colores: string[]) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    const lado = i % 2 === 0 ? -1 : 1
    return { x: x0 + dx * t, y: y0 + dy * t + lado * 14, r: lado * (28 + (i % 3) * 10) - 20, c: colores[i % colores.length], s: 1.15 - t * 0.35 }
  })

const hoja = 'M0 0C6-9 18-9 24 0 18 9 6 9 0 0Z'

export function FondoNaturaleza() {
  const arriba = hojas(9, 330, 4, -230, 150, ['#dcebd3', '#cfe0c6', '#e7e2c3'])
  const abajo = hojas(10, 6, 296, 230, -176, ['#dcebd3', '#d6dcab', '#cfe0c6'])
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <svg viewBox="0 0 340 260" className="brisa absolute -right-6 -top-4 w-52 sm:w-80" style={{ '--t': '9s', transformOrigin: '100% 0%' } as CSSProperties}>
        <path d="M340 0C270 30 190 70 100 156" fill="none" stroke="#e3d5b6" strokeWidth="6" strokeLinecap="round" />
        {arriba.map((h, i) => <path key={i} d={hoja} fill={h.c} transform={`translate(${h.x} ${h.y}) rotate(${h.r}) scale(${h.s})`} />)}
      </svg>
      <svg viewBox="0 0 360 300" className="brisa absolute -bottom-4 -left-6 w-56 sm:w-96" style={{ '--t': '11s', '--d': '-3s', transformOrigin: '0% 100%' } as CSSProperties}>
        <path d="M0 300C70 280 150 230 236 122" fill="none" stroke="#e3d5b6" strokeWidth="7" strokeLinecap="round" />
        {abajo.map((h, i) => <path key={i} d={hoja} fill={h.c} transform={`translate(${h.x} ${h.y}) rotate(${h.r}) scale(${h.s})`} />)}
      </svg>
    </div>
  )
}
