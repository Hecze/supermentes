// Botones rápidos: un minuto para acertar todas las que se pueda.
// Inspirado en "Hit the Button" (Topmarks), el clásico para practicar tablas y cálculo mental.
import { useCallback, useMemo, useRef, useState } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useBucle, useTeclas, useTemporizadores } from '../motor/bucle'
import { CuentaRegresiva } from '../motor/CuentaRegresiva'
import { Enunciado, Flotante, TextoMat, colorBoton, elogio, letraOpciones } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

const SEGUNDOS = 60

function columnas(n: number) {
  return n <= 4 ? 2 : n <= 9 ? 3 : 4
}

export default function BotonesRapidos({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const siguienteReto = useMemo(() => fuenteDeRetos(contenido, azar), [contenido, azar])
  const botones = [0, 6, 9, 12][ritmo]
  const despues = useTemporizadores()

  const nuevaRonda = useCallback(() => {
    const reto = siguienteReto()
    return { reto, opciones: opcionesDe(reto, botones, azar), apagadas: new Set<string>(), id: Math.random() }
  }, [siguienteReto, botones, azar])

  const [ronda, setRonda] = useState<{ reto: Reto; opciones: string[]; apagadas: Set<string>; id: number }>(nuevaRonda)
  const [fase, setFase] = useState<'cuenta' | 'juega' | 'fin'>('cuenta')
  const [aciertos, setAciertos] = useState(0)
  const [errores, setErrores] = useState(0)
  const [racha, setRacha] = useState(0)
  const [bien, setBien] = useState<string | null>(null)
  const [flotantes, setFlotantes] = useState<{ id: number; texto: string; x: string; y: string }[]>([])
  const restante = useRef(SEGUNDOS)
  const acabado = useRef(false)
  const [segundos, setSegundos] = useState(SEGUNDOS)
  const anillo = useRef<SVGCircleElement>(null)

  // Las metas dependen de la edad y de si hay que leer (preguntas del tema) o solo calcular.
  const metas = contenido.generar ? [[0, 0, 0], [6, 12, 18], [8, 15, 22], [10, 18, 26]][ritmo] : [4, 8, 12]

  const empezar = useCallback(() => setFase('juega'), [])

  // Tiempo real: el reloj sigue corriendo si sale del juego (ver motor/bucle).
  useBucle((_dt, real) => {
    restante.current = Math.max(0, restante.current - real)
    const s = Math.ceil(restante.current)
    if (s !== segundos) {
      setSegundos(s)
      if (s <= 5 && s > 0) sonar.tic()
    }
    if (anillo.current) anillo.current.style.strokeDashoffset = String(1 - restante.current / SEGUNDOS)
    if (restante.current <= 0 && !acabado.current) {
      acabado.current = true
      setFase('fin')
      const estrellas = metas.filter((m) => aciertos >= m).length
      terminar({
        estrellas,
        titulo: aciertos === 0 ? '¡A practicar!' : `¡${aciertos} ${aciertos === 1 ? 'acierto' : 'aciertos'}!`,
        detalle: `En un minuto acertaste ${aciertos}${errores ? ` y fallaste ${errores}` : ''}. ${estrellas < 3 ? `Para ${estrellas + 1} ${estrellas + 1 === 1 ? 'estrella' : 'estrellas'} necesitas ${metas[estrellas]}.` : '¡Eres un rayo!'}`,
        puntaje: aciertos,
      })
    }
  }, fase === 'juega')

  function elegir(opcion: string, i: number) {
    if (fase !== 'juega' || bien || ronda.apagadas.has(opcion)) return
    const col = columnas(ronda.opciones.length)
    const x = `${((i % col) + 0.5) * (100 / col)}%`
    const y = `${62 + Math.floor(i / col) * 9}%`
    if (opcion === ronda.reto.respuesta) {
      sonar.acierto()
      setAciertos((a) => a + 1)
      setRacha((r) => r + 1)
      setBien(opcion)
      const id = Math.random()
      setFlotantes((f) => [...f, { id, texto: racha + 1 >= 3 && (racha + 1) % 5 === 0 ? elogio(azar) : '+1', x, y }])
      despues(() => setFlotantes((f) => f.filter((x) => x.id !== id)), 900)
      despues(() => {
        setBien(null)
        setRonda(nuevaRonda())
      }, 220)
    } else {
      sonar.error()
      setErrores((e) => e + 1)
      setRacha(0)
      setRonda({ ...ronda, apagadas: new Set(ronda.apagadas).add(opcion) })
    }
  }

  // Con teclado: los números 1 a 9 eligen el botón en esa posición.
  useTeclas((t) => {
    const n = Number(t)
    if (n >= 1 && n <= ronda.opciones.length) elegir(ronda.opciones[n - 1], n - 1)
  }, fase === 'juega')

  const col = columnas(ronda.opciones.length)
  const urgente = segundos <= 10

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 0%, #8f74ff, #4b37c9 75%)' }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ backgroundImage: 'radial-gradient(circle, rgb(255 255 255 / 0.8) 1.2px, transparent 1.8px)', backgroundSize: '34px 34px' }}
        aria-hidden
      />

      <div className="relative z-10 flex items-center gap-[2cqmin] px-[3cqmin] pr-[18cqmin] pt-[2.2cqmin]">
        <div className="relative grid size-[clamp(48px,11cqmin,96px)] place-items-center rounded-full bg-white shadow-md" aria-label={`Quedan ${segundos} segundos`}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
            <circle cx={50} cy={50} r={40} fill="none" stroke="#ece8ff" strokeWidth={12} />
            <circle
              ref={anillo}
              cx={50}
              cy={50}
              r={40}
              fill="none"
              stroke={urgente ? '#ff5d73' : '#2fc46f'}
              strokeWidth={12}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={0}
            />
          </svg>
          <span className={`relative font-bold tabular-nums ${urgente ? 'text-[#e23b55]' : ''}`} style={{ fontSize: 'clamp(16px, 4cqmin, 34px)' }}>
            {segundos}
          </span>
        </div>
        <span className="rounded-full bg-white/90 px-[2cqmin] py-[0.6cqmin] font-bold tabular-nums shadow-md" style={{ fontSize: 'clamp(16px, 4cqmin, 34px)' }}>
          ✓ {aciertos}
        </span>
        {racha >= 3 && (
          <span key={racha} className="entrar rounded-full bg-[#ffc93c] px-[1.6cqmin] py-[0.5cqmin] font-bold text-[#5a3a00] shadow-md" style={{ fontSize: 'clamp(14px, 3.2cqmin, 28px)' }}>
            🔥 {racha} seguidas
          </span>
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-[3cqmin] px-[4cqmin] pb-[4cqmin] pt-[2cqmin]">
        <div key={ronda.id} className="tarjeta-juego entrar flex min-h-[18cqh] w-full max-w-[min(92cqw,760px)] items-center justify-center px-[3cqmin] py-[2cqmin]">
          <Enunciado reto={ronda.reto} tam="clamp(28px, 8cqmin, 72px)" />
        </div>
        <div className="grid w-full max-w-[min(94cqw,820px)] gap-[2cqmin]" style={{ gridTemplateColumns: `repeat(${col}, minmax(0, 1fr))` }}>
          {ronda.opciones.map((o, i) => (
            <button
              key={`${ronda.id}-${o}`}
              type="button"
              onPointerDown={() => elegir(o, i)}
              onClick={(e) => e.detail === 0 && elegir(o, i)}
              className={`b3d sombra-texto flex min-h-[clamp(52px,12cqh,120px)] items-center justify-center px-[1cqmin] py-[1.4cqmin] ${bien === o ? 'bien' : ''} ${ronda.apagadas.has(o) ? 'mal apagado' : ''}`}
              style={{ ...colorBoton(i), fontSize: letraOpciones(ronda.opciones, `${88 / col}cqw`, 'clamp(24px, 6.4cqmin, 56px)') }}
            >
              <TextoMat texto={o} />
            </button>
          ))}
        </div>
      </div>

      {flotantes.map((f) => (
        <Flotante key={f.id} x={f.x} y={f.y} texto={f.texto} color="#ffffff" />
      ))}

      {fase === 'cuenta' && <CuentaRegresiva alTerminar={empezar} />}
    </div>
  )
}
