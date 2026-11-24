import { BookOpen, MessageSquare, Mic, MonitorUp, Video } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'

/* El árbol del tertuliadero. Es una ilustración decorativa (aria-hidden): la información real
   de la página está en el texto de la izquierda. De sus ramas cuelgan las salas, el chat y la pantalla
   compartida. Coordenadas del SVG: viewBox 600×680; los colgantes usan esos mismos puntos en %. */

function aleatorio(semilla: number) {
  // mulberry32: determinista, para que el árbol sea idéntico en cada carga.
  let a = semilla
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Copa = { x: number; y: number; r: number; c: string }
const grupos: { clase: string; t: string; d: string; copas: Copa[]; hojas: number; semilla: number }[] = [
  { clase: 'izquierda', t: '7.5s', d: '0s', semilla: 7, hojas: 34, copas: [
    { x: 205, y: 190, r: 72, c: '#3a6b44' }, { x: 130, y: 262, r: 52, c: '#3a6b44' }, { x: 250, y: 112, r: 58, c: '#3f7a4a' } ] },
  { clase: 'centro', t: '9s', d: '-2s', semilla: 21, hojas: 40, copas: [
    { x: 300, y: 150, r: 95, c: '#2f5d3a' }, { x: 300, y: 238, r: 66, c: '#35653f' }, { x: 305, y: 96, r: 52, c: '#3f7a4a' } ] },
  { clase: 'derecha', t: '8s', d: '-4s', semilla: 42, hojas: 34, copas: [
    { x: 395, y: 185, r: 75, c: '#3a6b44' }, { x: 470, y: 262, r: 52, c: '#3a6b44' }, { x: 352, y: 112, r: 56, c: '#3f7a4a' } ] },
]
const verdes = ['#2f5d3a', '#3f7a4a', '#4f8a52', '#5c9a5b', '#86b36b', '#a9c97f']
const hoja = 'M0 0C5-7 15-7 20 0 15 7 5 7 0 0Z'

function Copas() {
  return <>{grupos.map(g => {
    const azar = aleatorio(g.semilla)
    const hojas = Array.from({ length: g.hojas }, () => {
      const copa = g.copas[Math.floor(azar() * g.copas.length)]
      const ang = azar() * Math.PI * 2
      const dist = Math.sqrt(azar()) * copa.r * 0.92
      const alto = copa.y + Math.sin(ang) * dist < 175
      const idx = Math.floor(azar() * (alto ? 6 : 4) + (alto ? 0 : 0))
      const calida = azar() > 0.96
      return {
        x: copa.x + Math.cos(ang) * dist, y: copa.y + Math.sin(ang) * dist,
        r: azar() * 360, s: 0.7 + azar() * 0.7, c: calida ? '#d9b765' : verdes[idx],
      }
    })
    return <g key={g.clase} className="brisa" style={{ '--t': g.t, '--d': g.d } as CSSProperties}>
      {g.copas.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={c.c} />)}
      {hojas.map((h, i) => <path key={i} d={hoja} fill={h.c} transform={`translate(${h.x.toFixed(1)} ${h.y.toFixed(1)}) rotate(${h.r.toFixed(0)}) scale(${h.s.toFixed(2)})`} />)}
    </g>
  })}</>
}

function Colgante({ x, y, cuerda, entrada, t, d, ocultoMovil = false, children }: {
  x: number; y: number; cuerda: number; entrada: number; t: string; d: string; ocultoMovil?: boolean; children: ReactNode
}) {
  return (
    <div className={`absolute ${ocultoMovil ? 'hidden sm:block' : ''}`} style={{ left: `${x}%`, top: `${y}%` }}>
      <div className="colgar" style={{ '--d': `${entrada}ms` } as CSSProperties}>
        <div className="balanceo relative h-0 w-0" style={{ '--t': t, '--d': d } as CSSProperties}>
          <span className="absolute left-0 top-0 w-0.5 -translate-x-1/2 bg-corteza" style={{ height: cuerda }} />
          <span className="absolute left-0 size-2 -translate-x-1/2 rounded-full bg-corteza" style={{ top: cuerda - 3 }} />
          <div className="absolute left-0 -translate-x-1/2" style={{ top: cuerda, fontSize: 'max(0.75rem, 2.2cqw)' }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

const iniciales = [
  { t: 'LM', c: 'bg-arena' }, { t: 'JU', c: 'bg-hoja-suave' }, { t: 'AM', c: 'bg-miel' },
]

export function EscenaSala() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-xl [container-type:inline-size]">
      <div className="relative aspect-[600/680]">
        <svg viewBox="0 0 600 680" className="crecer absolute inset-0 size-full" style={{ '--d': '120ms' } as CSSProperties}>
          {/* sol suave y suelo */}
          <circle cx="478" cy="96" r="64" fill="#f3e3b0" opacity="0.7" />
          <defs>
            <linearGradient id="suelo-a" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#cfe0c6" stopOpacity="0" /><stop offset="0.14" stopColor="#cfe0c6" /><stop offset="0.86" stopColor="#cfe0c6" /><stop offset="1" stopColor="#cfe0c6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="suelo-b" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#b9d2ad" stopOpacity="0" /><stop offset="0.2" stopColor="#b9d2ad" /><stop offset="0.8" stopColor="#b9d2ad" /><stop offset="1" stopColor="#b9d2ad" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 640C120 622 220 630 300 627 400 625 500 621 600 636V672C440 680 160 680 0 672Z" fill="url(#suelo-a)" />
          <path d="M40 656C160 646 260 651 330 648 430 643 500 646 570 654V670C430 678 180 678 40 670Z" fill="url(#suelo-b)" />
          <g fill="none" stroke="#4f8a52" strokeWidth="3" strokeLinecap="round">
            <path d="M430 640c2-14-2-22-8-28M438 640c0-12 3-20 10-26M446 640c-2-10-8-16-14-20" />
            <path d="M520 646c2-12-1-20-6-26M528 646c0-10 3-18 9-22" />
            <path d="M60 648c2-12-2-18-8-24M68 648c0-10 4-16 10-20" />
          </g>

          {/* tronco con raíces */}
          <path d="M232 646C258 640 266 628 268 600 270 540 262 490 262 450 262 420 268 392 276 366H324C332 392 338 420 338 450 338 490 330 540 332 600 334 628 342 640 368 646 340 654 262 654 232 646Z" fill="#5b3a21" />
          <path d="M284 396C279 450 281 520 284 604" fill="none" stroke="#7a4a26" strokeWidth="7" strokeLinecap="round" opacity="0.75" />
          <g fill="none" stroke="#3f2715" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
            <path d="M312 430c3 18 2 34-1 50M305 520c2 14 1 28-1 40M322 560c1 12 0 22-2 30" />
          </g>

          {/* ramas */}
          <g fill="none" stroke="#5b3a21" strokeLinecap="round">
            <path d="M292 432C250 404 190 384 130 322" strokeWidth="18" />
            <path d="M308 432C360 404 430 392 492 334" strokeWidth="18" />
            <path d="M186 386C150 352 112 322 80 286" strokeWidth="9" />
            <path d="M440 382C468 352 500 322 536 286" strokeWidth="9" />
            <path d="M290 384C272 332 232 284 214 214" strokeWidth="14" />
            <path d="M310 384C328 332 368 284 392 214" strokeWidth="14" />
            <path d="M300 372C298 320 300 260 300 190" strokeWidth="14" />
          </g>

          <Copas />

          {/* banca con taza y libro */}
          <g>
            <rect x="46" y="598" width="158" height="10" rx="4" fill="#7a4a26" />
            <rect x="62" y="608" width="9" height="32" rx="2" fill="#5b3a21" />
            <rect x="178" y="608" width="9" height="32" rx="2" fill="#5b3a21" />
            <rect x="136" y="586" width="40" height="12" rx="2" fill="#2f5d3a" />
            <rect x="136" y="595" width="40" height="3" fill="#fffdf7" />
            <rect x="84" y="578" width="24" height="20" rx="5" fill="#fffdf7" stroke="#5b3a21" strokeWidth="2" />
            <path d="M108 583c8-1 8 11 0 10" fill="none" stroke="#5b3a21" strokeWidth="2" />
            <g fill="none" stroke="#8b7a68" strokeWidth="2" strokeLinecap="round">
              <path className="vapor" style={{ '--d': '0s' } as CSSProperties} d="M91 572c-4-5 4-8 0-13" />
              <path className="vapor" style={{ '--d': '1.1s' } as CSSProperties} d="M100 572c-4-5 4-8 0-13" />
            </g>
          </g>
        </svg>

        {/* hojas que caen */}
        {[{ l: '34%', t: '24%', d: '0s', s: '13s' }, { l: '62%', t: '18%', d: '-5s', s: '15s' }, { l: '48%', t: '30%', d: '-9s', s: '17s' }].map((h, i) => (
          <svg key={i} viewBox="0 0 24 14" className="hoja-cae absolute w-4 text-primario" style={{ left: h.l, top: h.t, '--d': h.d, '--t': h.s } as CSSProperties}>
            <path d="M0 7C6-1 18-1 24 7 18 15 6 15 0 7Z" fill="#5c9a5b" />
          </svg>
        ))}

        {/* de las ramas cuelgan las salas y el chat */}
        <Colgante x={29.2} y={53.1} cuerda={44} entrada={700} t="5.4s" d="-1s">
          <div className="w-[28cqw] rounded-2xl border border-borde-tarjeta bg-papel p-[0.7em] shadow-papel">
            <p className="flex items-center gap-[0.5em] font-titulo font-bold text-texto">
              <span className="latido size-[0.6em] shrink-0 rounded-full bg-primario" />
              Sala de cálculo
            </p>
            <div className="mt-[0.6em] flex -space-x-[0.5em]">
              {iniciales.map(p => (
                <span key={p.t} className={`flex size-[2.2em] items-center justify-center rounded-full border-2 border-papel text-[0.85em] font-bold text-bosque ${p.c}`}>{p.t}</span>
              ))}
            </div>
            <div className="mt-[0.6em] flex gap-[0.4em] text-primario">
              <span className="flex size-[2em] items-center justify-center rounded-full bg-hoja-suave"><Mic size="1.1em" /></span>
              <span className="flex size-[2em] items-center justify-center rounded-full bg-hoja-suave"><Video size="1.1em" /></span>
            </div>
          </div>
        </Colgante>

        <Colgante x={72.5} y={55.3} cuerda={40} entrada={850} t="6.2s" d="-2.5s">
          <div className="w-[32cqw] rounded-2xl border border-borde-tarjeta bg-papel p-[0.7em] shadow-papel">
            <p className="flex items-center gap-[0.5em] font-titulo font-bold text-texto"><MessageSquare size="1.2em" className="text-acento" />Chat</p>
            <p className="mt-[0.5em] rounded-xl rounded-tl-sm bg-arena px-[0.7em] py-[0.4em] text-texto"><b>Lucía</b><br />¿Revisamos el ejercicio 4?</p>
            <p className="mt-[0.4em] rounded-xl rounded-tr-sm bg-hoja-suave px-[0.7em] py-[0.4em] text-bosque"><b>Julián</b><br />Sí, comparto mi pantalla.</p>
          </div>
        </Colgante>

        <Colgante x={16.7} y={45.1} cuerda={18} entrada={1000} t="4.8s" d="-0.5s" ocultoMovil>
          <p className="flex w-[27cqw] items-center justify-center gap-[0.5em] whitespace-nowrap rounded-lg bg-acento px-[0.6em] py-[0.5em] font-titulo font-bold text-papel shadow-papel">
            <BookOpen size="1.2em" />Mesa de lectura
          </p>
        </Colgante>

        <Colgante x={85.8} y={45.1} cuerda={20} entrada={1150} t="5.8s" d="-3s" ocultoMovil>
          <p className="flex w-[24cqw] items-center justify-center gap-[0.5em] whitespace-nowrap rounded-full bg-hoja-suave px-[0.6em] py-[0.5em] font-bold text-bosque shadow-papel">
            <MonitorUp size="1.2em" />Ana presenta
          </p>
        </Colgante>
      </div>
    </div>
  )
}
