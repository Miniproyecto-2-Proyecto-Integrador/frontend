// Marca de TertuliApp: un árbol que crece de un libro abierto. Decorativa: el nombre va en texto.
export function LogoArbol({ className = 'size-10' }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="23" fill="#eef5e8" />
      <circle cx="24" cy="15" r="8.5" fill="#2f5d3a" />
      <circle cx="16.5" cy="19" r="6" fill="#3f7a4a" />
      <circle cx="31.5" cy="19" r="6" fill="#3f7a4a" />
      <circle cx="21" cy="12" r="3" fill="#86b36b" />
      <rect x="22.4" y="20" width="3.2" height="12" rx="1.2" fill="#5b3a21" />
      <path d="M8 33.5c5-2.2 10-2 16 1.5 6-3.5 11-3.7 16-1.5v6.5c-5-2-10-1.8-16 1.6-6-3.4-11-3.6-16-1.6z" fill="#fffdf7" stroke="#5b3a21" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M24 35v6" stroke="#5b3a21" strokeWidth="1.4" />
    </svg>
  )
}
