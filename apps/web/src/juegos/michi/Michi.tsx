// Michi: tres en raya contra la computadora. Para marcar una casilla hay que responder bien; si fallas, pierdes
// el turno. Todos lo conocen, así que no hay que explicar nada. Con los más chicos la computadora se distrae más.
import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { fuenteDeRetos, opcionesDe } from '../contenido'
import { crearAzar } from '../motor/azar'
import { useTeclas, useTemporizadores } from '../motor/bucle'
import { Enunciado, TextoMat, colorBoton, letraOpciones } from '../motor/piezas'
import { sonar } from '../motor/sonido'
import type { PropsJuego, Reto } from '../tipos'

type Marca = 'X' | 'O' | null
const RONDAS = 3
const LINEAS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function ganador(t: Marca[]) {
  for (const l of LINEAS) {
    const [a, b, c] = l
    if (t[a] && t[a] === t[b] && t[a] === t[c]) return { marca: t[a]!, linea: l }
  }
  return null
}

/** La jugada de la computadora: gana si puede, a veces tapa al alumno y si no, centro, esquina o lo que quede. */
function jugadaCompu(t: Marca[], tapa: number, azar: () => number) {
  const libres = t.map((m, i) => (m ? -1 : i)).filter((i) => i >= 0)
  const completa = (marca: Marca) =>
    libres.find((i) => {
      const prueba = [...t]
      prueba[i] = marca
      return ganador(prueba)?.marca === marca
    })
  const gana = completa('O')
  if (gana !== undefined) return gana
  const bloqueo = completa('X')
  if (bloqueo !== undefined && azar() < tapa) return bloqueo
  if (libres.includes(4) && azar() < 0.7) return 4
  const esquinas = libres.filter((i) => [0, 2, 6, 8].includes(i))
  const lista = esquinas.length && azar() < 0.6 ? esquinas : libres
  return lista[Math.floor(azar() * lista.length)]
}

export default function Michi({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const siguienteReto = useMemo(() => fuenteDeRetos(contenido, azar), [contenido, azar])
  const tapa = [0, 0.55, 0.8, 0.95][ritmo]
  const nOpciones = ritmo === 1 ? 3 : 4
  const despues = useTemporizadores()

  const [tablero, setTablero] = useState<Marca[]>(Array(9).fill(null))
  const [turno, setTurno] = useState<'alumno' | 'compu'>('alumno')
  const [pregunta, setPregunta] = useState<{ casilla: number; reto: Reto; opciones: string[] } | null>(null)
  const [respuesta, setRespuesta] = useState<{ elegida: string; bien: boolean } | null>(null)
  const [ronda, setRonda] = useState(1)
  const [marcador, setMarcador] = useState({ alumno: 0, compu: 0, empates: 0 })
  // Se cuenta en una ref: el resultado final se arma en un temporizador y necesita el valor al día.
  const aciertos = useRef(0)
  const [fin, setFin] = useState<{ texto: string; linea?: number[] } | null>(null)

  function cerrarRonda(t: Marca[], m: typeof marcador) {
    const g = ganador(t)
    const lleno = t.every(Boolean)
    if (!g && !lleno) return false
    const nuevo = { ...m }
    if (g?.marca === 'X') nuevo.alumno++
    else if (g?.marca === 'O') nuevo.compu++
    else nuevo.empates++
    setMarcador(nuevo)
    setFin({ texto: g?.marca === 'X' ? '¡Hiciste michi!' : g ? 'Ganó la compu' : 'Empate', linea: g?.linea })
    if (g?.marca === 'X') sonar.victoria()
    else sonar.fin()
    const decidido = nuevo.alumno >= 2 || nuevo.compu >= 2 || ronda >= RONDAS
    despues(() => {
      if (decidido) {
        terminar({
          estrellas: nuevo.alumno >= 2 ? 3 : nuevo.alumno === 1 ? 2 : aciertos.current >= 3 ? 1 : 0,
          titulo: nuevo.alumno > nuevo.compu ? '¡Le ganaste a la compu!' : nuevo.alumno === nuevo.compu ? '¡Empataron!' : '¡La revancha!',
          detalle: `Tú ${nuevo.alumno}, compu ${nuevo.compu}${nuevo.empates ? `, ${nuevo.empates} ${nuevo.empates === 1 ? 'empate' : 'empates'}` : ''}. Respondiste bien ${aciertos.current} ${aciertos.current === 1 ? 'pregunta' : 'preguntas'}.`,
          puntaje: nuevo.alumno * 300 + nuevo.empates * 100 + aciertos.current * 50,
        })
        return
      }
      // Nueva ronda: empieza quien no empezó la anterior.
      setTablero(Array(9).fill(null))
      setFin(null)
      setRonda(ronda + 1)
      const empiezaCompu = ronda % 2 === 1
      setTurno(empiezaCompu ? 'compu' : 'alumno')
      if (empiezaCompu) juegaCompu(Array(9).fill(null), nuevo)
    }, 1800)
    return true
  }

  function juegaCompu(t: Marca[], m: typeof marcador) {
    setTurno('compu')
    despues(() => {
      const i = jugadaCompu(t, tapa, azar)
      if (i === undefined) return
      const nuevo = [...t]
      nuevo[i] = 'O'
      sonar.pop()
      setTablero(nuevo)
      if (!cerrarRonda(nuevo, m)) setTurno('alumno')
    }, 800)
  }

  function elegirCasilla(i: number) {
    if (turno !== 'alumno' || pregunta || fin || tablero[i]) return
    sonar.paso()
    const reto = siguienteReto()
    setPregunta({ casilla: i, reto, opciones: opcionesDe(reto, nOpciones, azar) })
  }

  function responder(o: string) {
    if (!pregunta || respuesta) return
    const bien = o === pregunta.reto.respuesta
    setRespuesta({ elegida: o, bien })
    if (bien) {
      sonar.acierto()
      aciertos.current++
    } else sonar.error()
    despues(
      () => {
        const t = [...tablero]
        if (bien) t[pregunta.casilla] = 'X'
        setTablero(t)
        setPregunta(null)
        setRespuesta(null)
        if (!cerrarRonda(t, marcador)) juegaCompu(t, marcador)
      },
      bien ? 600 : 1500,
    )
  }

  useTeclas((t) => {
    if (pregunta && /^[1-4]$/.test(t)) {
      const o = pregunta.opciones[Number(t) - 1]
      if (o) responder(o)
    } else if (!pregunta && /^[1-9]$/.test(t)) elegirCasilla(Number(t) - 1)
  })

  const estado = fin ? fin.texto : turno === 'alumno' ? 'Te toca: elige una casilla' : 'La compu está pensando…'

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(160deg, #4f6dff, #7b5cff 60%, #b05cff)' }}>
      <div className="pointer-events-none absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 2px)', backgroundSize: '24px 24px' }} aria-hidden />

      {/* Marcador; a la derecha están el sonido y la pantalla completa */}
      <div className="relative z-10 flex items-center gap-[1.5cqmin] px-[3cqmin] pr-[17cqmin] pt-[2.2cqmin] text-white" style={{ fontSize: 'clamp(15px, 3.4cqmin, 28px)' }}>
        <span className="rounded-full bg-black/20 px-[2cqmin] py-[0.5cqmin] font-semibold">
          Ronda {ronda} de {RONDAS}
        </span>
        <span className="rounded-full bg-black/20 px-[2cqmin] py-[0.5cqmin] font-bold tabular-nums">
          <span className="text-[#7ff0ff]">Tú {marcador.alumno}</span> · <span className="text-[#ffb3c0]">{marcador.compu} Compu</span>
        </span>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-[3cqmin] px-[4cqmin] py-[2cqmin]">
        <p className="rounded-full bg-white/90 px-[3cqmin] py-[1cqmin] font-bold text-[#2b2d5c] shadow-md" style={{ fontSize: 'clamp(16px, 4.2cqmin, 34px)' }} role="status">
          {estado}
        </p>
        <div className="grid aspect-square w-[min(86cqw,58cqh)] grid-cols-3 gap-[2cqmin] rounded-[3cqmin] bg-white/20 p-[2cqmin]">
          {tablero.map((m, i) => {
            const enLinea = fin?.linea?.includes(i)
            return (
              <button
                key={i}
                type="button"
                onClick={() => elegirCasilla(i)}
                disabled={!!m || turno !== 'alumno' || !!pregunta || !!fin}
                aria-label={m ? `Casilla ${i + 1}: ${m === 'X' ? 'tuya' : 'de la compu'}` : `Casilla ${i + 1}, libre`}
                className={`grid place-items-center rounded-[2cqmin] font-bold shadow-[0_0.7cqmin_0_rgb(30_20_90/0.35)] transition ${!m && turno === 'alumno' && !pregunta && !fin ? 'hover:brightness-95' : ''}`}
                style={{ background: enLinea ? '#ffd23f' : '#ffffff', fontSize: 'min(16cqw, 11cqh)' }}
              >
                {m && (
                  <span key={m} className="entrar leading-none" style={{ color: m === 'X' ? '#2f7bff' : '#ff4d6d' }}>
                    {m}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* La pregunta para ganarse la casilla: tapa el tablero entero, que si no se mezcla con las opciones */}
      {pregunta && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-[2.4cqmin] bg-[#2a1c6b]/90 p-[4cqmin] backdrop-blur-sm">
          <div className="tarjeta-juego entrar w-full max-w-[min(90cqw,720px)] px-[4cqmin] py-[2.4cqmin]">
            <p className="mb-[1cqmin] text-center font-semibold text-[#8a8fb8]" style={{ fontSize: 'clamp(15px, 3.2cqmin, 24px)' }}>
              Responde bien y la casilla es tuya
            </p>
            <Enunciado reto={pregunta.reto} tam="clamp(22px, 6cqmin, 52px)" />
          </div>
          <div className={`grid w-full max-w-[min(90cqw,720px)] gap-[2cqmin] ${pregunta.opciones.length === 3 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {pregunta.opciones.map((o, i) => {
              const r = respuesta
              const clase = r ? (o === pregunta.reto.respuesta ? 'bien' : o === r.elegida ? 'mal' : 'apagado') : ''
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => responder(o)}
                  disabled={!!r}
                  aria-keyshortcuts={String(i + 1)}
                  className={`b3d sombra-texto min-h-[clamp(54px,11cqh,110px)] px-[2cqmin] font-bold ${clase}`}
                  style={{ ...colorBoton(i), fontSize: letraOpciones(pregunta.opciones, pregunta.opciones.length === 3 ? '80cqw' : '38cqw', 'clamp(22px, 5.6cqmin, 46px)') } as CSSProperties}
                >
                  <TextoMat texto={o} />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
