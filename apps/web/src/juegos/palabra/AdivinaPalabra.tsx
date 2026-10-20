// Adivina la palabra: el ahorcado sin horca. Una llamita flota con globos y cada letra que no está revienta uno.
// Los globos tampoco aguantan para siempre: si pasan unos segundos sin elegir una letra (motor/Reloj), se revienta
// uno. Así no da tiempo de ir a buscar la palabra y volver.
import { useMemo, useState, type CSSProperties } from 'react'
import { normalizar } from '../../lib/crucigrama'
import { barajar, crearAzar } from '../motor/azar'
import { useTeclas, useTemporizadores } from '../motor/bucle'
import { Llama, LLAMAS } from '../motor/Llama'
import { PALETA } from '../motor/piezas'
import { BarraReloj, useReloj } from '../motor/Reloj'
import { sonar } from '../motor/sonido'
import type { PropsJuego } from '../tipos'

const GLOBOS = 6
// Siete teclas por fila: en un celular cada una queda de unos 50 px, cómoda para el dedo.
const FILAS = ['ABCDEFG', 'HIJKLMN', 'ÑOPQRST', 'UVWXYZ']

export default function AdivinaPalabra({ contenido, ritmo, semilla, terminar }: PropsJuego) {
  const azar = useMemo(() => crearAzar(semilla), [semilla])
  const palabras = useMemo(() => barajar(azar, contenido.palabras).slice(0, ritmo === 1 ? 3 : 5), [azar, contenido, ritmo])
  const despues = useTemporizadores()
  const [n, setN] = useState(0)
  const [usadas, setUsadas] = useState<Set<string>>(new Set())
  const [adivinadas, setAdivinadas] = useState(0)
  const [reventando, setReventando] = useState<number | null>(null)
  // Globos que se reventaron porque se acabó el tiempo de elegir una letra (cuentan como errores).
  const [soplos, setSoplos] = useState(0)

  const actual = palabras[n]
  const letras = normalizar(actual.palabra)
  const errores = [...usadas].filter((l) => !letras.includes(l)).length + soplos
  const gano = letras.split('').every((l) => usadas.has(l))
  const perdio = errores >= GLOBOS
  // Segundos para elegir cada letra; vuelve a empezar con cada letra y con cada globo que se revienta.
  // Si el alumno sale del juego, al volver se revientan los globos de todo el rato que estuvo fuera.
  const reloj = useReloj({ segundos: [0, 12, 10, 8][ritmo], activo: !gano && !perdio, vuelta: `${n}-${usadas.size}`, alVencer: desinflar, repetir: true })

  function desinflar() {
    if (gano || perdio) return
    sonar.pop()
    setReventando(errores)
    despues(() => setReventando(null), 250)
    setSoplos((x) => Math.min(GLOBOS, x + 1))
  }
  const ultima = n === palabras.length - 1

  function probar(l: string) {
    if (gano || perdio || usadas.has(l)) return
    const nuevas = new Set(usadas).add(l)
    setUsadas(nuevas)
    if (letras.includes(l)) {
      const completa = letras.split('').every((x) => nuevas.has(x))
      if (completa) {
        sonar.victoria()
        setAdivinadas(adivinadas + 1)
      } else sonar.acierto()
    } else {
      sonar.pop()
      setReventando(errores)
      despues(() => setReventando(null), 250)
      if (errores + 1 >= GLOBOS) despues(() => sonar.fin(), 300)
    }
  }

  function seguir() {
    if (ultima) {
      const total = palabras.length
      const r = adivinadas / total
      terminar({
        estrellas: r >= 1 ? 3 : r >= 0.6 ? 2 : r > 0 ? 1 : 0,
        titulo: adivinadas === total ? '¡Adivinaron todas!' : `¡${adivinadas} de ${total}!`,
        detalle: adivinadas === total ? 'Ningún globo se quedó sin dueño.' : 'Cada intento ayuda a recordar las palabras del tema.',
        puntaje: adivinadas * 100,
      })
      return
    }
    setN(n + 1)
    setUsadas(new Set())
    setSoplos(0)
  }

  useTeclas((t) => {
    if (t === 'Enter' && (gano || perdio)) return seguir()
    const l = normalizar(t)
    if (l.length === 1) probar(l)
  })

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(#ff9fcb, #ffd9ea 60%, #fff0f6)' }}>
      <div className="relative z-10 flex items-center gap-[1.5cqmin] px-[3cqmin] pr-[18cqmin] pt-[2.2cqmin]" style={{ fontSize: 'clamp(14px, 3.2cqmin, 26px)' }}>
        <span className="rounded-full bg-white/90 px-[1.8cqmin] py-[0.5cqmin] font-semibold tabular-nums shadow-md">
          Palabra {n + 1} de {palabras.length}
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center gap-[3cqmin] px-[3cqmin] [@container(orientation:portrait)]:flex-col [@container(orientation:portrait)]:gap-[1.6cqmin]">
        {/* Llamita colgada de sus globos: cada error revienta uno y la baja un poco */}
        <div
          className="relative aspect-[100/150] h-[min(56cqh,48cqw)] shrink-0 transition-transform duration-500 [@container(orientation:portrait)]:h-[26cqh]"
          style={{ transform: `translateY(${Math.min(errores, GLOBOS) * 1.4}cqh)` }}
        >
          <svg viewBox="0 0 100 90" className="absolute inset-x-0 top-0 h-[45%] w-full overflow-visible" aria-hidden>
            {Array.from({ length: GLOBOS }, (_, i) => {
              const x = 14 + i * 14.4
              const y = 16 + (i % 2) * 14
              const vivo = i >= errores || reventando === i
              if (!vivo) return null
              return (
                <g key={i} className={reventando === i ? 'reventar' : ''} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                  <path d={`M${x} ${y + 13} L49 152`} stroke="rgb(70 50 100 / 0.5)" strokeWidth={0.8} />
                  <ellipse cx={x} cy={y} rx={10} ry={12.5} fill={PALETA[i].c} />
                  <path d={`M${x - 2.5} ${y + 14} L${x} ${y + 11.5} L${x + 2.5} ${y + 14} Z`} fill={PALETA[i].c} />
                  <ellipse cx={x - 3.5} cy={y - 4} rx={2.5} ry={4.5} fill="#fff" opacity={0.5} transform={`rotate(25 ${x - 3.5} ${y - 4})`} />
                </g>
              )
            })}
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-[55%]">
            <Llama colores={LLAMAS.blanca} tam="100%" />
          </div>
        </div>

        <div className="flex min-w-0 max-w-[min(62cqw,640px)] flex-1 flex-col items-center justify-center gap-[2.4cqmin] [@container(orientation:portrait)]:max-w-full [@container(orientation:portrait)]:flex-none">
          <div className="tarjeta-juego w-full px-[3cqmin] py-[1.8cqmin] text-center">
            <p className="font-medium text-[var(--j-tinta-suave)]" style={{ fontSize: 'clamp(14px, 3cqmin, 24px)' }}>
              Pista
            </p>
            <p className="font-semibold leading-snug" style={{ fontSize: 'clamp(20px, 4.8cqmin, 36px)' }}>
              {actual.pista}
            </p>
            {!gano && !perdio && <BarraReloj reloj={reloj} className="mt-[1.4cqmin]" />}
          </div>
          <div className="flex flex-wrap justify-center gap-[1cqmin]" aria-live="polite">
            {letras.split('').map((l, i) => {
              const ver = usadas.has(l) || perdio
              return (
                <span
                  key={`${n}-${i}`}
                  className={`grid aspect-[4/5] w-[clamp(30px,7.4cqmin,64px)] place-items-center rounded-[1.2cqmin] bg-white font-bold shadow-[0_0.5cqmin_0_#e2c3d3] ${ver ? 'entrar' : ''}`}
                  style={{ fontSize: 'clamp(20px, 5.4cqmin, 48px)', color: ver && !usadas.has(l) ? '#e23b55' : undefined }}
                >
                  {ver ? l : ''}
                </span>
              )
            })}
          </div>
          {(gano || perdio) && (
            <div className="entrar flex flex-col items-center gap-[1.4cqmin] text-center">
              <p className="font-bold" style={{ fontSize: 'clamp(18px, 4.6cqmin, 40px)', color: gano ? '#1f9d55' : '#c2185b' }}>
                {gano ? '¡Adivinaron!' : `Era «${actual.palabra}»`}
              </p>
              <button type="button" onClick={seguir} className="b3d px-[1em] py-[0.45em]" style={{ '--c': '#ff4f9a', fontSize: 'clamp(17px, 4cqmin, 32px)' } as CSSProperties}>
                {ultima ? 'Ver resultado' : 'Siguiente palabra'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Teclado */}
      {!(gano || perdio) && (
        <div className="relative z-10 flex flex-col items-center gap-[1cqmin] px-[2cqmin] pb-[2.4cqmin]">
          {FILAS.map((fila) => (
            <div key={fila} className="flex gap-[1cqmin]">
              {fila.split('').map((l) => {
                const usada = usadas.has(l)
                const esta = letras.includes(l)
                return (
                  <button
                    key={l}
                    type="button"
                    disabled={usada}
                    onClick={() => probar(l)}
                    className={`b3d grid aspect-square w-[min(12.2cqw,9.5cqh,72px)] place-items-center ${usada ? (esta ? 'bien' : 'apagado') : 'b3d-blanco'}`}
                    style={{ fontSize: 'clamp(20px, 5.4cqmin, 36px)' }}
                    aria-label={`Letra ${l}`}
                  >
                    {l}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
