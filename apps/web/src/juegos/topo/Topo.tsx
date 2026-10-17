// Topo: los cuyes se asoman con carteles y hay que tocar al que tiene la respuesta correcta.
// Inspirado en el "whack-a-mole" de Wordwall.
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useBucle, useTamano, useTemporizadores } from '../motor/bucle'
import { Cuy } from '../motor/Cuy'
import { Enunciado, Flotante, TextoMat, Vidas, elogio } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

const VIDAS = 3

type Asomado = { id: number; texto: string; correcto: boolean; hasta: number; estado: 'arriba' | 'golpe' | 'mal' | 'baja' }

function tamTexto(t: string) {
  const n = [...t].length
  return n <= 3 ? 1 : n <= 6 ? 0.78 : n <= 10 ? 0.6 : 0.48
}

export default function Topo({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const siguienteReto = useMemo(() => fuenteDeRetos(contenido, azar), [contenido, azar])
  const huecos = ritmo === 1 ? 6 : 8
  const meta = ritmo === 1 ? 8 : 10
  const visible = [0, 2.8, 2.2, 1.7][ritmo]
  const intervalo = [0, 1.0, 0.8, 0.6][ritmo]
  const despues = useTemporizadores()

  const raiz = useRef<HTMLDivElement>(null)
  const { ancho, alto } = useTamano(raiz)
  // En el proyector (horizontal) los huecos van en filas anchas; en el celular, en columnas.
  const cols = ancho >= alto ? huecos / 2 : 2
  const filas = huecos / cols
  const [, refrescar] = useReducer((x: number) => x + 1, 0)
  const asomados = useRef<(Asomado | null)[]>(Array(huecos).fill(null))
  const tiempo = useRef(0)
  const proximo = useRef(0.5)
  const sinCorrecto = useRef(0)
  const contador = useRef(0)
  const pausa = useRef(false)
  const [reto, setReto] = useState<{ reto: Reto; opciones: string[]; n: number }>(() => {
    const r = siguienteReto()
    return { reto: r, opciones: opcionesDe(r, 6, azar), n: 0 }
  })
  const [aciertos, setAciertos] = useState(0)
  const [vidas, setVidas] = useState(VIDAS)
  const [terminado, setTerminado] = useState(false)
  const [flotantes, setFlotantes] = useState<{ id: number; x: string; y: string; texto: string }[]>([])

  // En modo estricto el efecto corre dos veces: los huecos empiezan vacíos igual.
  useEffect(() => {
    asomados.current = Array(huecos).fill(null)
  }, [huecos])

  function esconder(i: number) {
    const a = asomados.current[i]
    if (!a) return
    a.estado = 'baja'
    const id = a.id
    despues(() => {
      if (asomados.current[i]?.id === id) {
        asomados.current[i] = null
        refrescar()
      }
    }, 230)
  }

  useBucle((dt) => {
    tiempo.current += dt
    const t = tiempo.current
    let cambio = false
    asomados.current.forEach((a, i) => {
      if (a && a.estado === 'arriba' && t >= a.hasta) {
        esconder(i)
        cambio = true
      }
    })
    if (!pausa.current && t >= proximo.current) {
      const libres = asomados.current.map((a, i) => (a ? -1 : i)).filter((i) => i >= 0)
      if (libres.length) {
        const i = libres[Math.floor(azar() * libres.length)]
        const arriba = new Set(asomados.current.filter(Boolean).map((a) => a!.texto))
        const correcta = reto.reto.respuesta
        // La respuesta aparece seguido: como mucho dos cuyes seguidos sin ella.
        const toca = !arriba.has(correcta) && (sinCorrecto.current >= 2 || azar() < 0.4)
        const otras = reto.opciones.filter((o) => o !== correcta && !arriba.has(o))
        const texto = toca || otras.length === 0 ? correcta : otras[Math.floor(azar() * otras.length)]
        if (!arriba.has(texto)) {
          sinCorrecto.current = texto === correcta ? 0 : sinCorrecto.current + 1
          asomados.current[i] = { id: ++contador.current, texto, correcto: texto === correcta, hasta: t + visible * (0.85 + azar() * 0.3), estado: 'arriba' }
          cambio = true
        }
      }
      proximo.current = t + intervalo * (0.7 + azar() * 0.6)
    }
    if (cambio) refrescar()
  }, !terminado)

  function golpear(i: number) {
    const a = asomados.current[i]
    if (terminado || !a || a.estado !== 'arriba') return
    const x = `${((i % cols) + 0.5) * (100 / cols)}%`
    const y = `${35 + Math.floor(i / cols) * (60 / filas)}%`
    if (a.correcto) {
      sonar.pop()
      sonar.acierto()
      a.estado = 'golpe'
      const total = aciertos + 1
      setAciertos(total)
      const id = ++contador.current
      setFlotantes((f) => [...f, { id, x, y, texto: elogio(azar) }])
      despues(() => setFlotantes((f) => f.filter((z) => z.id !== id)), 900)
      // Todos se esconden y llega la siguiente pregunta.
      pausa.current = true
      asomados.current.forEach((_, j) => j !== i && esconder(j))
      despues(() => esconder(i), 350)
      refrescar()
      if (total >= meta) {
        setTerminado(true)
        despues(
          () =>
            terminar({
              estrellas: vidas,
              titulo: '¡Atrapaste a todos!',
              detalle: vidas === VIDAS ? `${meta} respuestas correctas sin ningún error.` : `${meta} respuestas correctas y ${VIDAS - vidas} ${VIDAS - vidas === 1 ? 'error' : 'errores'}.`,
            }),
          900,
        )
        return
      }
      despues(() => {
        const r = siguienteReto()
        setReto((x) => ({ reto: r, opciones: opcionesDe(r, 6, azar), n: x.n + 1 }))
        sinCorrecto.current = 0
        pausa.current = false
        proximo.current = tiempo.current + 0.3
      }, 650)
      return
    }
    sonar.error()
    a.estado = 'mal'
    refrescar()
    despues(() => esconder(i), 500)
    const quedan = vidas - 1
    setVidas(quedan)
    if (quedan <= 0) {
      setTerminado(true)
      despues(
        () =>
          terminar({
            estrellas: aciertos >= meta / 2 ? 1 : 0,
            titulo: aciertos > 0 ? '¡Buen intento!' : '¡Casi!',
            detalle: `Atrapaste ${aciertos} de ${meta}. La respuesta era ${reto.reto.respuesta}.`,
          }),
        1000,
      )
    }
  }

  return (
    <div ref={raiz} className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(#a6e98f, #5cc94a 60%, #45b03a)' }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{ backgroundImage: 'radial-gradient(ellipse 3px 6px, #2f8f2a 60%, transparent 70%)', backgroundSize: '28px 24px' }}
        aria-hidden
      />
      <div className="relative z-10 flex flex-col items-center gap-[1.5cqmin] px-[3cqmin] pt-[2.2cqmin]">
        <div className="flex w-full items-center gap-[1.5cqmin] pr-[17cqmin]">
          <span className="rounded-full bg-white/85 px-[1.4cqmin] py-[0.6cqmin] shadow-sm">
            <Vidas quedan={vidas} total={VIDAS} />
          </span>
          <span className="rounded-full bg-white/85 px-[1.8cqmin] py-[0.5cqmin] font-semibold tabular-nums shadow-sm" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
            🐹 {aciertos} / {meta}
          </span>
        </div>
        <div key={reto.n} className="tarjeta-juego entrar px-[3.5cqmin] py-[1.4cqmin]" style={{ maxWidth: 'min(86cqw, 720px)' }}>
          <Enunciado reto={reto.reto} tam="clamp(20px, 5.4cqmin, 48px)" />
        </div>
      </div>

      <div
        className="relative z-10 grid flex-1 gap-x-[3cqmin] px-[5cqmin] pb-[2cqmin] pt-[1cqmin]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${filas}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: huecos }, (_, i) => {
          const a = asomados.current[i]
          return (
            <div key={i} className="relative">
              <div className="absolute bottom-[8%] left-1/2 h-[20%] w-[80%] -translate-x-1/2 rounded-[50%] bg-[#4a2f22] shadow-[inset_0_0.8cqmin_0_rgb(0_0_0/0.35)]" aria-hidden />
              <div className="absolute inset-x-0 bottom-[18%] top-0 overflow-hidden">
                {a && (
                  <button
                    key={a.id}
                    type="button"
                    onPointerDown={() => golpear(i)}
                    onClick={(e) => e.detail === 0 && golpear(i)}
                    disabled={a.estado !== 'arriba'}
                    aria-label={a.texto}
                    className={`absolute inset-x-[6%] bottom-[-2%] flex h-full max-h-[40cqmin] flex-col items-center justify-end ${a.estado === 'baja' ? 'esconder' : 'asomar'}`}
                  >
                    <span
                      className={`relative z-10 mb-[-4%] grid h-[36%] w-full max-w-[34cqmin] shrink-0 place-items-center rounded-[1.4cqmin] border-[0.6cqmin] px-[0.8cqmin] font-bold leading-tight ${a.estado === 'mal' ? 'temblar' : ''}`}
                      style={{
                        background: a.estado === 'golpe' ? '#2fc46f' : a.estado === 'mal' ? '#ff6b6b' : '#f6d6a3',
                        borderColor: a.estado === 'golpe' ? '#1f9d55' : a.estado === 'mal' ? '#d64545' : '#b7804a',
                        color: a.estado === 'arriba' ? '#4a2c00' : '#fff',
                        fontSize: `calc(clamp(16px, 4.6cqmin, 42px) * ${tamTexto(a.texto)})`,
                      }}
                    >
                      <TextoMat texto={a.texto} />
                    </span>
                    <Cuy mareado={a.estado === 'mal'} className="h-[64%] w-auto max-w-full" />
                  </button>
                )}
              </div>
              <div
                className="pointer-events-none absolute bottom-[5%] left-1/2 h-[14%] w-[88%] -translate-x-1/2 rounded-[50%] bg-[#8a5d3b]"
                style={{ clipPath: 'inset(50% 0 0 0)' }}
                aria-hidden
              />
            </div>
          )
        })}
      </div>

      {flotantes.map((f) => (
        <Flotante key={f.id} x={f.x} y={f.y} texto={f.texto} />
      ))}
    </div>
  )
}
