import { useEffect, useState } from 'react'
import { sonar } from './sonido'

/** "3, 2, 1, ¡Ya!" antes de un juego con tiempo. */
export function CuentaRegresiva({ alTerminar }: { alTerminar: () => void }) {
  const [n, setN] = useState(3)

  useEffect(() => {
    if (n > 0) sonar.tic()
    else sonar.acierto()
    const id = window.setTimeout(() => (n > 0 ? setN(n - 1) : alTerminar()), n > 0 ? 650 : 450)
    return () => window.clearTimeout(id)
  }, [n, alTerminar])

  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-[rgb(30_20_80/0.35)]" aria-live="assertive">
      <span
        key={n}
        className="entrar font-bold text-white sombra-texto"
        style={{ fontSize: 'clamp(70px, 26cqmin, 220px)', WebkitTextStroke: '0.03em rgb(30 20 80 / 0.4)' }}
      >
        {n > 0 ? n : '¡Ya!'}
      </span>
    </div>
  )
}
