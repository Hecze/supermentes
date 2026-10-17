import { useMemo } from 'react'
import { encode } from 'uqr'

/** Código QR real (corrección de errores media: se lee bien desde el proyector). */
export function Qr({ texto, tam = 160, className }: { texto: string; tam?: number | string; className?: string }) {
  const { size, d } = useMemo(() => {
    const qr = encode(texto, { ecc: 'M', border: 2 })
    let camino = ''
    qr.data.forEach((fila, y) =>
      fila.forEach((negro, x) => {
        if (negro) camino += `M${x} ${y}h1v1h-1z`
      }),
    )
    return { size: qr.size, d: camino }
  }, [texto])

  return (
    <svg width={tam} height={tam} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" role="img" aria-label="Código QR del juego" className={className}>
      <rect width={size} height={size} fill="#ffffff" />
      <path d={d} fill="#111111" />
    </svg>
  )
}
