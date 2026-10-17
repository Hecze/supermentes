// Memoria: voltear cartas de a dos hasta encontrar todas las parejas (3/4 y su dibujo, 7 × 8 y 56).
import { Check } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { paresDePartida } from '../contenido'
import { barajar, crearAzar } from '../motor/azar'
import { useTamano, useTemporizadores } from '../motor/bucle'
import { PALETA, TextoMat, VisualDe } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { Lado, PropsJuego } from '../tipos'

type Carta = { id: number; par: number; lado: Lado }

/** Columnas que dan las cartas más grandes (proporción 3:4) en el espacio disponible. */
function mejorGrilla(n: number, ancho: number, alto: number, hueco: number) {
  let mejor = { cols: 4, lado: 0 }
  for (let cols = 2; cols <= 8; cols++) {
    const filas = Math.ceil(n / cols)
    const w = (ancho - hueco * (cols - 1)) / cols
    const h = (alto - hueco * (filas - 1)) / filas
    const lado = Math.min(w, h * 0.75)
    if (lado > mejor.lado) mejor = { cols, lado }
  }
  return mejor
}

function tamTexto(t: string) {
  const n = [...t].length
  return n <= 3 ? 1 : n <= 6 ? 0.74 : n <= 10 ? 0.56 : 0.46
}

export default function Memoria({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const disponibles = useMemo(() => paresDePartida(contenido, azar), [contenido, azar])
  const cuantas = Math.min(disponibles.length, [0, 6, 8, 10][ritmo])
  const cartas = useMemo<Carta[]>(() => {
    const pares = barajar(azar, disponibles).slice(0, cuantas)
    return barajar(
      azar,
      pares.flatMap((p, i) => [
        { id: i * 2, par: i, lado: p.a },
        { id: i * 2 + 1, par: i, lado: p.b },
      ]),
    )
  }, [azar, disponibles, cuantas])

  const tablero = useRef<HTMLDivElement>(null)
  const { ancho, alto } = useTamano(tablero)
  const despues = useTemporizadores()
  const [abiertas, setAbiertas] = useState<number[]>([])
  const [encontradas, setEncontradas] = useState<Set<number>>(new Set())
  const [intentos, setIntentos] = useState(0)
  const [falla, setFalla] = useState(false)

  const hueco = Math.max(6, Math.min(ancho, alto) * 0.02)
  const { cols, lado } = mejorGrilla(cartas.length, ancho, alto, hueco)

  function tocar(c: Carta) {
    if (abiertas.length === 2 || abiertas.includes(c.id) || encontradas.has(c.par)) return
    const nuevas = [...abiertas, c.id]
    setAbiertas(nuevas)
    if (nuevas.length < 2) {
      sonar.paso()
      return
    }
    const total = intentos + 1
    setIntentos(total)
    const [a, b] = nuevas.map((id) => cartas.find((x) => x.id === id)!)
    if (a.par === b.par) {
      sonar.acierto()
      const ya = new Set(encontradas).add(a.par)
      setEncontradas(ya)
      setAbiertas([])
      if (ya.size === cuantas) {
        const estrellas = total <= cuantas + 2 ? 3 : total <= cuantas * 1.8 ? 2 : 1
        despues(
          () =>
            terminar({
              estrellas,
              titulo: '¡Encontraron todas!',
              detalle: `${cuantas} parejas en ${total} intentos.${estrellas < 3 ? ` Con ${cuantas + 2} o menos son tres estrellas.` : ''}`,
              // 1000 sin errores; cada intento de más resta 50.
              puntaje: Math.max(0, 1000 - (total - cuantas) * 50),
            }),
          900,
        )
      }
    } else {
      setFalla(true)
      despues(() => {
        sonar.error()
        setAbiertas([])
        setFalla(false)
      }, 950)
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 30%, #3fd683, #128a49 80%)' }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle, rgb(255 255 255 / 0.7) 1px, transparent 1.6px)', backgroundSize: '18px 18px' }}
        aria-hidden
      />
      <div className="relative z-10 flex items-center gap-[1.5cqmin] px-[3cqmin] pr-[18cqmin] pt-[2.2cqmin]" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
        <span className="rounded-full bg-white/90 px-[1.8cqmin] py-[0.5cqmin] font-semibold tabular-nums shadow-md">
          ⭐ {encontradas.size} / {cuantas}
        </span>
        <span className="rounded-full bg-white/90 px-[1.8cqmin] py-[0.5cqmin] font-semibold tabular-nums shadow-md">Intentos: {intentos}</span>
      </div>
      <div ref={tablero} className="relative z-10 m-[3cqmin] mt-[2cqmin] flex-1">
        <div
          className="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2"
          style={{ gridTemplateColumns: `repeat(${cols}, ${lado}px)`, gap: hueco }}
        >
          {lado > 0 &&
            cartas.map((c, i) => {
              const visible = abiertas.includes(c.id) || encontradas.has(c.par)
              const hallada = encontradas.has(c.par)
              const color = PALETA[c.par % PALETA.length]
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => tocar(c)}
                  className={`carta ${visible ? 'volteada' : ''} ${hallada ? 'encontrada' : ''}`}
                  style={{ width: lado, height: lado / 0.75 }}
                  aria-label={visible ? c.lado.texto || 'dibujo' : `Carta ${i + 1}, tapada`}
                >
                  <span className="carta-interior block">
                    <span
                      className="carta-cara grid place-items-center border-[5cqi] border-white/70"
                      style={{ background: `linear-gradient(145deg, ${PALETA[i % PALETA.length].c}, color-mix(in oklab, ${PALETA[i % PALETA.length].c} 75%, #2b1060))`, boxShadow: '0 1.2cqi 0 rgb(0 40 20 / 0.35)' }}
                    >
                      <span className="font-bold text-white sombra-texto" style={{ fontSize: '42cqi' }}>
                        ?
                      </span>
                    </span>
                    <span
                      className={`carta-cara carta-frente flex flex-col items-center justify-center gap-[4cqi] bg-white p-[6cqi] text-center font-bold leading-tight ${falla && abiertas.includes(c.id) ? 'temblar' : ''}`}
                      style={{ border: `4cqi solid ${hallada ? color.c : '#e5e7f5'}`, boxShadow: '0 1.2cqi 0 rgb(0 40 20 / 0.35)' }}
                    >
                      {c.lado.visual && <VisualDe visual={c.lado.visual} tam="66cqi" />}
                      {c.lado.texto && (
                        <span style={{ fontSize: `calc(30cqi * ${tamTexto(c.lado.texto)})` }}>
                          <TextoMat texto={c.lado.texto} />
                        </span>
                      )}
                      {hallada && (
                        <span className="absolute right-[5cqi] top-[5cqi] grid size-[18cqi] place-items-center rounded-full text-white" style={{ background: color.c }}>
                          <Check className="size-[70%]" strokeWidth={3.5} aria-hidden />
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              )
            })}
        </div>
      </div>
    </div>
  )
}
