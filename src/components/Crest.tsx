/** Logo crest Blitar Mengaji — mihrab + bintang 8 (khatam). Vektor, bukan emoji. */
export function Crest({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" className={className} role="img" aria-label="Blitar Mengaji">
      <rect x="2" y="2" width="52" height="52" rx="13" fill="#0E5C46" />
      <rect x="7.5" y="7.5" width="41" height="41" rx="9" fill="none" stroke="#C9A227" strokeOpacity=".55" />
      <path
        d="M19 44 L19 27 C19 16 27 13 28 13 C29 13 37 16 37 27 L37 44"
        fill="none"
        stroke="#E6CC8A"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M23.5 44 L23.5 31 M32.5 44 L32.5 31" stroke="#E6CC8A" strokeWidth="1.3" strokeOpacity=".6" strokeLinecap="round" />
      <g transform="translate(28 9.5)" fill="#C9A227">
        <rect x="-3.2" y="-3.2" width="6.4" height="6.4" />
        <rect x="-3.2" y="-3.2" width="6.4" height="6.4" transform="rotate(45)" />
      </g>
    </svg>
  );
}
