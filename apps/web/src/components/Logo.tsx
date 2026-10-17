// Los colores del logo: uno por herramienta (el último era de "Adaptar para inclusión", hoy dentro de "Adaptar examen").
const PLUMONES = ['var(--cancion)', 'var(--examen)', 'var(--juego)', 'var(--crucigrama)', 'var(--adaptar)']
const ALTOS = [18, 14, 20, 12, 16]

/** Cinco plumones en su estuche: uno por herramienta. */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 items-end gap-[3px] rounded-lg border border-line bg-surface-2 px-1.5 pb-1" aria-hidden>
        {PLUMONES.map((color, i) => (
          <span key={color} className="w-[4px] rounded-full" style={{ background: color, height: ALTOS[i] }} />
        ))}
      </span>
      <span className="font-display text-xl font-bold tracking-tight">Supermentes</span>
    </span>
  )
}
