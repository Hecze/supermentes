// Pupiletras: encontrar las palabras del tema en la sopa de letras. Se arrastra de la primera a la última letra,
// o se toca una y luego la otra (más fácil en la pizarra digital y en celulares chicos). La sopa tiene su tiempo
// (motor/Reloj), según cuántas palabras esconde; si se acaba, cuentan las que encontró.
import { Check } from 'lucide-react'
import { useMemo, useRef, useState, type PointerEvent } from 'react'
import { normalizar } from '../../lib/crucigrama'
import { barajar, crearAzar } from '../motor/azar'
import { useBucle, useTemporizadores } from '../motor/bucle'
import { PALETA } from '../motor/piezas'
import { BarraReloj, useReloj } from '../motor/Reloj'
import { sonar } from '../motor/sonido'
import type { PropsJuego } from '../tipos'
import { ajustar, armarSopa, direcciones, linea, type Celda } from './sopa'

type Hallada = { palabra: string; celdas: Celda[]; color: string }

const igual = (a: Celda, b: Celda) => a.f === b.f && a.c === b.c

export default function Pupiletras({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const lado = [0, 8, 10, 12][ritmo]
  const despues = useTemporizadores()

  const sopa = useMemo(() => {
    const vistas = new Set<string>()
    const elegidas = barajar(azar, contenido.palabras).filter((p) => {
      const n = normalizar(p.palabra)
      if (n.length < 3 || n.length > lado || vistas.has(n)) return false
      vistas.add(n)
      return true
    })
    const { letras, ubicadas } = armarSopa(
      elegidas.slice(0, [0, 5, 6, 8][ritmo]).map((p) => normalizar(p.palabra)),
      lado,
      direcciones(ritmo),
      azar,
    )
    const info = new Map(elegidas.map((p) => [normalizar(p.palabra), p]))
    return { letras, ubicadas, info }
  }, [azar, contenido, lado, ritmo])

  const grilla = useRef<HTMLDivElement>(null)
  const arrastrando = useRef(false)
  const tiempo = useRef(0)
  const [inicio, setInicio] = useState<Celda | null>(null)
  const [fin, setFin] = useState<Celda | null>(null)
  const [pendiente, setPendiente] = useState<Celda | null>(null)
  const [halladas, setHalladas] = useState<Hallada[]>([])
  const [ultima, setUltima] = useState<{ palabra: string; pista: string } | null>(null)
  const [falla, setFalla] = useState(0)
  const total = sopa.ubicadas.length
  const [acabado, setAcabado] = useState(false)
  const terminado = halladas.length === total || acabado
  const limite = total * [0, 35, 30, 25][ritmo]
  const reloj = useReloj({ segundos: limite, activo: !terminado, vuelta: sopa, alVencer: seAcabo })

  function seAcabo() {
    if (terminado) return
    setAcabado(true)
    setInicio(null)
    setFin(null)
    setPendiente(null)
    sonar.error()
    const n = halladas.length
    despues(
      () =>
        terminar({
          estrellas: n >= total * 0.6 ? 1 : 0,
          titulo: '¡Se acabó el tiempo!',
          detalle: `Encontraste ${n} de ${total} palabras.`,
          puntaje: n * 100,
        }),
      900,
    )
  }

  useBucle((_dt, real) => (tiempo.current += real), !terminado)

  function celdaDe(e: PointerEvent): Celda | null {
    const r = grilla.current?.getBoundingClientRect()
    if (!r) return null
    const c = Math.floor(((e.clientX - r.left) / r.width) * lado)
    const f = Math.floor(((e.clientY - r.top) / r.height) * lado)
    return f >= 0 && f < lado && c >= 0 && c < lado ? { f, c } : null
  }

  const dentro = (x: Celda) => x.f >= 0 && x.f < lado && x.c >= 0 && x.c < lado

  function comprobar(a: Celda, b: Celda) {
    setInicio(null)
    setFin(null)
    setPendiente(null)
    const celdas = linea(a, ajustar(a, b))
    if (!celdas || celdas.length < 2 || !celdas.every(dentro)) return
    const texto = celdas.map(({ f, c }) => sopa.letras[f][c]).join('')
    const al = [...texto].reverse().join('')
    const yaEsta = new Set(halladas.map((h) => h.palabra))
    const encontrada = sopa.ubicadas.find((u) => !yaEsta.has(u.palabra) && (u.palabra === texto || u.palabra === al))
    if (!encontrada) {
      sonar.error()
      setFalla((n) => n + 1)
      return
    }
    sonar.acierto()
    const nuevas = [...halladas, { palabra: encontrada.palabra, celdas, color: PALETA[halladas.length % PALETA.length].c }]
    setHalladas(nuevas)
    const p = sopa.info.get(encontrada.palabra)
    if (p) setUltima({ palabra: p.palabra, pista: p.pista })
    if (nuevas.length === total) {
      const s = tiempo.current
      const estrellas = s <= limite * 0.6 ? 3 : s <= limite * 0.85 ? 2 : 1
      const min = Math.floor(s / 60)
      const seg = Math.round(s % 60)
      despues(
        () =>
          terminar({
            estrellas,
            titulo: '¡Encontraron todas!',
            detalle: `${total} palabras en ${min ? `${min} min ` : ''}${seg} s.`,
            // Cada palabra vale 100 y terminar rápido suma hasta 300 más.
            puntaje: total * 100 + Math.max(0, 300 - Math.round(s)),
          }),
        1100,
      )
    }
  }

  function bajar(e: PointerEvent) {
    if (terminado) return
    const x = celdaDe(e)
    if (!x) return
    if (pendiente) {
      // Segundo toque: de la letra marcada a esta.
      if (igual(pendiente, x)) {
        setPendiente(null)
        setInicio(null)
        setFin(null)
      } else comprobar(pendiente, x)
      return
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    arrastrando.current = true
    setInicio(x)
    setFin(x)
  }

  function mover(e: PointerEvent) {
    if (!arrastrando.current || !inicio) return
    const x = celdaDe(e)
    if (!x) return
    const b = ajustar(inicio, x)
    if (dentro(b)) setFin(b)
  }

  function soltar() {
    if (!arrastrando.current || !inicio || !fin) return
    arrastrando.current = false
    if (igual(inicio, fin)) setPendiente(inicio)
    else comprobar(inicio, fin)
  }

  const seleccion = inicio && fin ? linea(inicio, fin) : null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center gap-[3cqmin] overflow-hidden p-[3cqmin] pt-[calc(4cqmin+clamp(36px,7cqmin,52px))] [@container(orientation:portrait)]:flex-col [@container(orientation:portrait)]:justify-start"
      style={{ background: 'radial-gradient(circle at 50% 0%, #6fe3cf, #17998f 85%)' }}
    >
      <div className="absolute left-[3cqmin] top-[2.2cqmin] flex gap-[1.5cqmin]" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
        <span className="rounded-full bg-white/90 px-[1.8cqmin] py-[0.5cqmin] font-semibold tabular-nums shadow-md">
          🔎 {halladas.length} / {total}
        </span>
        <span className="flex w-[clamp(90px,22cqmin,200px)] items-center rounded-full bg-white/90 px-[1.4cqmin] shadow-md">
          <BarraReloj reloj={reloj} />
        </span>
      </div>

      {/* Grilla */}
      <div
        className={`tarjeta-juego relative aspect-square h-[min(calc(100cqh_-_15cqmin),64cqw)] shrink-0 p-[1.4cqmin] [@container(orientation:portrait)]:h-auto [@container(orientation:portrait)]:w-[min(calc(100cqw_-_6cqmin),64cqh)] ${falla ? 'temblar' : ''}`}
        key={falla}
      >
        <div
          ref={grilla}
          className="relative grid h-full w-full touch-none select-none"
          style={{ gridTemplateColumns: `repeat(${lado}, 1fr)`, containerType: 'inline-size' }}
          onPointerDown={bajar}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={() => {
            arrastrando.current = false
            setInicio(null)
            setFin(null)
          }}
          role="group"
          aria-label={`Pupiletras de ${lado} por ${lado}`}
        >
          <svg viewBox={`0 0 ${lado} ${lado}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
            {halladas.map((h) => {
              const a = h.celdas[0]
              const b = h.celdas[h.celdas.length - 1]
              return <line key={h.palabra} x1={a.c + 0.5} y1={a.f + 0.5} x2={b.c + 0.5} y2={b.f + 0.5} stroke={h.color} strokeOpacity={0.55} strokeWidth={0.78} strokeLinecap="round" />
            })}
            {seleccion && (
              <line
                x1={seleccion[0].c + 0.5}
                y1={seleccion[0].f + 0.5}
                x2={seleccion[seleccion.length - 1].c + 0.5}
                y2={seleccion[seleccion.length - 1].f + 0.5}
                stroke="#ffc93c"
                strokeOpacity={0.7}
                strokeWidth={0.78}
                strokeLinecap="round"
              />
            )}
          </svg>
          {sopa.letras.flatMap((fila, f) =>
            fila.map((l, c) => (
              <span key={`${f}-${c}`} className="relative grid place-items-center font-bold leading-none" style={{ fontSize: `calc(100cqi / ${lado} * 0.56)` }}>
                {l}
              </span>
            )),
          )}
        </div>
      </div>

      {/* Palabras por encontrar */}
      <div className="flex min-w-0 max-w-[min(34cqw,360px)] flex-col gap-[1.6cqmin] [@container(orientation:portrait)]:max-w-full">
        <p className="font-bold text-white sombra-texto" style={{ fontSize: 'clamp(16px, 3.6cqmin, 30px)' }}>
          Busca estas palabras
        </p>
        <ul className="flex flex-wrap gap-[1cqmin]">
          {sopa.ubicadas.map((u) => {
            const h = halladas.find((x) => x.palabra === u.palabra)
            return (
              <li
                key={u.palabra}
                className={`flex items-center gap-1 rounded-full px-[1.4cqmin] py-[0.4cqmin] font-bold tracking-wide ${h ? 'bg-white/60 text-[#2b2d5c]/60 line-through' : 'bg-white text-[#2b2d5c]'}`}
                style={{ fontSize: 'clamp(16px, 3.6cqmin, 26px)', boxShadow: h ? undefined : '0 0.4cqmin 0 rgb(0 60 50 / 0.3)' }}
              >
                {h && <Check className="size-[1em]" style={{ color: h.color }} strokeWidth={3.5} aria-hidden />}
                {u.palabra}
              </li>
            )
          })}
        </ul>
        {ultima && (
          <div key={ultima.palabra} className="tarjeta-juego entrar px-[2cqmin] py-[1.4cqmin]" aria-live="polite">
            <p className="font-bold capitalize" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
              ¡{ultima.palabra}!
            </p>
            <p className="text-[var(--j-tinta-suave)]" style={{ fontSize: 'clamp(15px, 3.2cqmin, 24px)' }}>
              {ultima.pista}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
