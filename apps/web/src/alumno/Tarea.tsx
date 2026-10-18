// Tarea del alumno (/t/CODIGO, obsidian/TAREAS.md): elige su nombre de la lista del salón, hace el Concurso con reloj
// y su profe la recibe revisada. Sin cuenta: el celular solo recuerda qué nombre eligió.
import { Check, ListChecks, NotebookPen, Play, RotateCcw, Search, Star, Timer, User } from 'lucide-react'
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { juegoPorId } from '../juegos/catalogo'
import { contenidoDe } from '../juegos/compartir/publicado'
import { dia, nombreSalon, type TareaAlumno } from '../juegos/compartir/tareas'
import { activarAudio } from '../juegos/motor/sonido'
import type { Resultado } from '../juegos/tipos'
import '../juegos/juegos.css'

const VERDE = '#0f7f55'
const clave = (salon: string) => `supermentes-alumno-${salon}`

function recordado(salon: string) {
  try {
    return Number(localStorage.getItem(clave(salon))) || null
  } catch {
    return null
  }
}

function recordar(salon: string, id: number | null) {
  try {
    if (id) localStorage.setItem(clave(salon), String(id))
    else localStorage.removeItem(clave(salon))
  } catch {
    // Sin almacenamiento vale por esta visita.
  }
}

function Hoja({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-full bg-[#f3f6fb] text-[#172031]" style={{ fontFamily: 'Lexend, system-ui, sans-serif' }}>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-6 pt-7">{children}</div>
    </main>
  )
}

const titulo = 'font-bold leading-tight'
const display = { fontFamily: '"Shantell Sans", Fredoka, cursive' }
const botonVerde = 'flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-xl font-bold text-white disabled:opacity-60'

type Fase = { fase: 'nombre' } | { fase: 'portada' } | { fase: 'jugando'; desde: number } | { fase: 'fin'; r: Resultado; segundos: number; envio: 'enviando' | 'ok' | 'practica' | 'error' }

export function Tarea() {
  const codigo = /^\/t\/([A-Za-z0-9]{6})\/?$/.exec(location.pathname)?.[1]?.toUpperCase() ?? ''
  const [tarea, setTarea] = useState<TareaAlumno | null>(null)
  const [error, setError] = useState('')
  const [alumno, setAlumno] = useState<number | null>(null)
  const [fase, setFase] = useState<Fase>({ fase: 'nombre' })
  const [buscar, setBuscar] = useState('')
  const [partida, setPartida] = useState(1)
  const enviado = useRef(false)

  useEffect(() => {
    fetch(`/api/tareas?codigo=${codigo}`)
      .then(async (r) => {
        if (r.status === 404 || r.status === 400) throw new Error('No encontramos esta tarea. Pide el link otra vez a tu profe.')
        if (!r.ok) throw new Error('No pudimos abrir la tarea. Revisa tu conexión e intenta otra vez.')
        const t = (await r.json()) as TareaAlumno
        const id = recordado(t.salon)
        setTarea(t)
        if (id && t.alumnos.some((a) => a.id === id)) {
          setAlumno(id)
          setFase({ fase: 'portada' })
        }
      })
      .catch((e: Error) => setError(e.message))
  }, [codigo])

  const def = juegoPorId('concurso')
  const contenido = useMemo(() => (tarea && def ? def.preparar(contenidoDe(tarea.publicado) ?? { titulo: '', retos: [], pares: [], palabras: [] }) : null), [tarea, def])

  if (error) {
    return (
      <Hoja>
        <p className="my-auto text-center text-xl font-semibold">{error}</p>
      </Hoja>
    )
  }
  if (!tarea || !def) {
    return (
      <Hoja>
        <p className="my-auto text-center text-xl font-semibold" role="status">
          Abriendo tu tarea…
        </p>
      </Hoja>
    )
  }

  const yo = tarea.alumnos.find((a) => a.id === alumno)
  const deCurso = `Tarea de ${tarea.area || 'tu profe'}`

  async function enviar(r: Resultado, segundos: number) {
    setFase({ fase: 'fin', r, segundos, envio: 'enviando' })
    try {
      const res = await fetch('/api/intentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, alumno, segundos, respuestas: r.respuestas }),
      })
      if (!res.ok) throw new Error()
      const { primero } = (await res.json()) as { primero: boolean }
      enviado.current = true
      setFase({ fase: 'fin', r, segundos, envio: primero ? 'ok' : 'practica' })
    } catch {
      setFase({ fase: 'fin', r, segundos, envio: 'error' })
    }
  }

  if (fase.fase === 'nombre' || !yo) {
    const filtro = buscar.trim().toLowerCase()
    return (
      <Hoja>
        <p className="text-sm font-semibold" style={{ color: VERDE }}>
          {deCurso} · {nombreSalon(tarea.grado, tarea.seccion)}
        </p>
        <h1 className={`${titulo} mt-4 text-4xl`} style={display}>
          ¿Quién eres?
        </h1>
        <label className="mt-5 flex h-12 items-center gap-3 rounded-2xl border-2 border-[#d4dce8] bg-white px-4">
          <Search className="size-5 text-[#536075]" aria-hidden />
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Escribe tu nombre" aria-label="Escribe tu nombre" className="min-w-0 flex-1 bg-transparent text-lg outline-none" />
        </label>
        <ul className="mt-4 flex flex-col gap-3">
          {tarea.alumnos
            .filter((a) => !filtro || a.nombre.toLowerCase().includes(filtro))
            .map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    recordar(tarea.salon, a.id)
                    setAlumno(a.id)
                    setFase({ fase: 'portada' })
                  }}
                  className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-left text-lg font-semibold active:scale-[0.99]"
                >
                  {a.nombre}
                  {a.hizo && <span className="shrink-0 text-sm font-normal text-[#536075]">ya la hizo</span>}
                </button>
              </li>
            ))}
        </ul>
      </Hoja>
    )
  }

  const corto = yo.nombre.split(' ')[0]

  if (fase.fase === 'portada') {
    return (
      <Hoja>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-[#dcefe6] px-3 py-1 text-sm font-semibold" style={{ color: VERDE }}>
          <NotebookPen className="size-4" aria-hidden /> {deCurso}
        </span>
        <h1 className={`${titulo} mt-3 text-4xl`} style={display}>
          {tarea.tema}
        </h1>
        <p className="mt-2 text-[#536075]">
          {tarea.profe ? `${tarea.profe} · ` : ''}hasta el {dia(tarea.vence, true)}
        </p>
        <ul className="my-auto flex flex-col gap-4 rounded-3xl bg-white p-5 text-lg font-semibold">
          <li className="flex items-start gap-3">
            <ListChecks className="mt-0.5 size-6 shrink-0" style={{ color: VERDE }} aria-hidden /> 10 preguntas, unos 5 minutos
          </li>
          <li className="flex items-start gap-3">
            <Timer className="mt-0.5 size-6 shrink-0" style={{ color: VERDE }} aria-hidden /> {tarea.segundos} segundos para cada una
          </li>
          <li className="flex items-start gap-3">
            <User className="mt-0.5 size-6 shrink-0" style={{ color: VERDE }} aria-hidden /> Hazla tú solito o solita
          </li>
        </ul>
        {yo.hizo && <p className="mb-3 text-center text-[#536075]">Ya la hiciste: ahora es para practicar.</p>}
        <button
          type="button"
          onClick={() => {
            activarAudio()
            setFase({ fase: 'jugando', desde: Date.now() })
          }}
          className={botonVerde}
          style={{ background: VERDE }}
        >
          <Play className="size-6" aria-hidden /> Empezar
        </button>
        <p className="mt-4 text-center text-[#536075]">
          Juegas como {corto} ·{' '}
          <button
            type="button"
            className="font-semibold text-[#172031]"
            onClick={() => {
              recordar(tarea.salon, null)
              setAlumno(null)
              setFase({ fase: 'nombre' })
            }}
          >
            No soy yo
          </button>
        </p>
        <p className="mt-3 text-center text-sm text-[#536075]">Tu profe verá tus respuestas. Nadie más.</p>
      </Hoja>
    )
  }

  if (fase.fase === 'jugando' && contenido) {
    const Juego = def.Componente
    return (
      <div className="escena relative h-[100dvh] w-full overflow-hidden bg-[#46178f]">
        <Suspense fallback={null}>
          <Juego
            key={partida}
            contenido={contenido}
            ritmo={tarea.publicado.ritmo}
            semilla={Date.now() + partida}
            tarea={{ segundos: tarea.segundos }}
            terminar={(r) => {
              const segundos = Math.round((Date.now() - fase.desde) / 1000)
              // Ya entregó en esta visita: practicar otra vez no se manda.
              if (enviado.current) setFase({ fase: 'fin', r, segundos, envio: 'practica' })
              else void enviar(r, segundos)
            }}
          />
        </Suspense>
      </div>
    )
  }

  if (fase.fase !== 'fin') return null
  const aciertos = fase.r.respuestas?.filter((x) => x.elegida === x.correcta).length ?? 0
  const total = fase.r.respuestas?.length ?? 10

  return (
    <Hoja>
      <div className="my-auto flex flex-col items-center gap-4 text-center">
        <span className="grid size-20 place-items-center rounded-full text-white" style={{ background: VERDE }}>
          <Check className="size-10" strokeWidth={3} aria-hidden />
        </span>
        <h1 className={`${titulo} text-4xl`} style={display}>
          ¡Listo, {corto}!
        </h1>
        <p className="text-lg text-[#536075]" role="status">
          {fase.envio === 'enviando'
            ? 'Enviando tu tarea…'
            : fase.envio === 'error'
              ? 'No pudimos enviar tu tarea. Revisa tu conexión.'
              : fase.envio === 'ok'
                ? 'Tu profe ya recibió tu tarea.'
                : 'Esta vez fue para practicar.'}
        </p>
        {fase.envio === 'error' && (
          <button type="button" onClick={() => void enviar(fase.r, fase.segundos)} className={botonVerde} style={{ background: VERDE }}>
            Enviar otra vez
          </button>
        )}
        <div className="flex w-full flex-col items-center gap-2 rounded-3xl bg-white p-6">
          <p className={`${titulo} text-5xl`} style={display}>
            {aciertos} de {total}
          </p>
          <p className="flex gap-1" aria-label={`${fase.r.estrellas} de 3 estrellas`}>
            {[0, 1, 2].map((i) => (
              <Star key={i} className="size-8" fill={i < fase.r.estrellas ? '#f2b705' : 'none'} stroke={i < fase.r.estrellas ? '#f2b705' : '#c9d1de'} aria-hidden />
            ))}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setPartida((p) => p + 1)
          setFase({ fase: 'jugando', desde: Date.now() })
        }}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#e8edf5] text-lg font-bold"
      >
        <RotateCcw className="size-5" aria-hidden /> Practicar otra vez
      </button>
      <p className="mt-3 text-center text-sm text-[#536075]">Practicar no cambia lo que recibió tu profe.</p>
    </Hoja>
  )
}
