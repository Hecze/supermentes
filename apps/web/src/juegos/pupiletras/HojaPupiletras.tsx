// El pupiletras en una hoja para imprimir: grilla, palabras y sus pistas. En pantalla no se ve.
import { useMemo } from 'react'
import { normalizar } from '../../lib/crucigrama'
import { Membrete } from '../../components/Membrete'
import { Hoja } from '../../components/ui'
import { crearAzar } from '../motor/azar'
import type { Palabra } from '../tipos'
import { armarSopa, direcciones } from './sopa'

export function HojaPupiletras({
  titulo,
  grado,
  palabras,
  tema,
}: {
  titulo: string
  grado: string
  palabras: Palabra[]
  /** Grado y curso del tema: con eso sale el colegio del membrete. */
  tema?: { gradoId: string; areaId: string }
}) {
  const { letras, lista } = useMemo(() => {
    const vistas = new Set<string>()
    const elegidas = palabras.filter((p) => {
      const n = normalizar(p.palabra)
      if (n.length < 3 || n.length > 12 || vistas.has(n)) return false
      vistas.add(n)
      return true
    })
    const { letras, ubicadas } = armarSopa(elegidas.slice(0, 10).map((p) => normalizar(p.palabra)), 12, direcciones(2), crearAzar(7))
    const lista = elegidas.filter((p) => ubicadas.some((u) => u.palabra === normalizar(p.palabra)))
    return { letras, lista }
  }, [palabras])

  return (
    <Hoja className="hidden print:flex">
      <header className="flex flex-col gap-1">
        <Membrete tema={tema ?? null} />
        <h2 className="font-display text-3xl font-bold">Pupiletras: {titulo}</h2>
        <p className="text-ink-soft">
          {grado} · Nombre: ______________________________
        </p>
      </header>
      <p>Encuentra las {lista.length} palabras escondidas. Pueden estar de izquierda a derecha, de arriba abajo o en diagonal.</p>
      <table className="mx-auto border-collapse">
        <tbody>
          {letras.map((fila, f) => (
            <tr key={f}>
              {fila.map((l, c) => (
                <td key={c} className="size-9 border border-[#999] text-center align-middle font-display text-xl font-bold">
                  {l}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ol className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        {lista.map((p) => (
          <li key={p.palabra} className="flex gap-2">
            <span className="mt-1.5 size-3.5 shrink-0 rounded-sm border border-[#555]" aria-hidden />
            <span>
              <strong className="uppercase">{p.palabra}</strong>: {p.pista}
            </span>
          </li>
        ))}
      </ol>
    </Hoja>
  )
}
