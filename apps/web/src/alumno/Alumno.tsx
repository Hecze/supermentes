// Página del alumno (/j/CODIGO): abre el juego que compartió su profe. Sin cuenta y sin el panel del docente.
import { ArrowRight, Check, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { juegoPorId, juegosCompatibles } from '../juegos/catalogo'
import { cargar, codigoValido, contenidoDe, leerAutonomo, type Publicado } from '../juegos/compartir/publicado'
import { alumnoGuardado, enviarResultado, guardarAlumno, type Alumno as DatosAlumno } from '../juegos/compartir/resultados'
import { muestraDe } from '../juegos/miniaturas'
import { Llama, LLAMAS } from '../juegos/motor/Llama'
import { Partida, usePantallaCompleta } from '../juegos/motor/Partida'
import type { Contenido, JuegoId, Resultado } from '../juegos/tipos'
import '../juegos/juegos.css'

type Estado =
  | { fase: 'codigo'; error?: string }
  | { fase: 'cargando' }
  | { fase: 'listo'; publicado: Publicado; contenido: Contenido; codigo?: string }

/** Los alumnos juegan en el celular de la familia: solo se ofrecen juegos pensados para celular. */
function deCelular(contenido: Contenido, grado?: string) {
  return juegosCompatibles(contenido, grado).filter((j) => j.def.donde.includes('celular'))
}

/** Container queries llegaron en 2022 (Chrome 105, Safari 16). Sin ellas los juegos se desarman. */
function navegadorAlDia() {
  try {
    return CSS.supports('width', '1cqmin')
  } catch {
    return false
  }
}

/** El código puede venir en la ruta (/j/ABC234), como ?c= o, si no hubo servidor, todo el juego en #d=. */
function leerUbicacion() {
  const ruta = /^\/j\/([A-Za-z0-9]{6})\/?$/.exec(window.location.pathname)?.[1]
  const consulta = new URLSearchParams(window.location.search).get('c')
  const datos = /[#&]d=([A-Za-z0-9_-]+)/.exec(window.location.hash)?.[1]
  return { codigo: (ruta ?? consulta ?? '').toUpperCase(), datos }
}

function Fondo({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative flex min-h-full flex-col items-center justify-center gap-6 overflow-hidden px-5 py-10 text-center"
      style={{ background: 'linear-gradient(#6cc4ff, #b8e5ff 60%, #e6f7ff)' }}
    >
      <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[16vh] w-full" aria-hidden>
        <path d="M0 30 Q60 5 120 26 T240 22 T400 18 V60 H0 Z" fill="#7ad65a" />
        <path d="M0 44 Q80 22 170 40 T330 36 T400 34 V60 H0 Z" fill="#4fbf45" />
      </svg>
      <div className="relative flex w-full max-w-md flex-col items-center gap-5">{children}</div>
    </main>
  )
}

function PedirCodigo({ error, entrar }: { error?: string; entrar: (c: string) => void }) {
  const [codigo, setCodigo] = useState('')
  const limpio = codigo.toUpperCase().replace(/[^A-Z0-9]/g, '')

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (limpio.length === 6) entrar(limpio)
  }

  return (
    <Fondo>
      <Llama colores={LLAMAS.crema} tam={150} className="flotar" />
      <h1 className="text-4xl font-bold leading-tight text-white sombra-texto">¡Hola! ¿Cuál es el código de tu profe?</h1>
      <p className="text-lg font-medium text-[#1d3b6b]">Está en la pizarra o en el mensaje de WhatsApp.</p>
      <form onSubmit={enviar} className="flex w-full flex-col items-center gap-4">
        <label htmlFor="codigo" className="sr-only">
          Código del juego
        </label>
        <input
          id="codigo"
          value={limpio}
          onChange={(e) => setCodigo(e.target.value)}
          maxLength={6}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="······"
          className="tarjeta-juego w-full max-w-xs py-3 text-center text-4xl font-bold uppercase tracking-[0.3em] text-[#2b2d5c] outline-none placeholder:text-[#c9cde6] focus:ring-4 focus:ring-white/70"
        />
        {error && <p className="rounded-full bg-white/90 px-4 py-1.5 font-semibold text-[#c2185b]">{error}</p>}
        <button
          type="submit"
          disabled={limpio.length !== 6}
          className="b3d inline-flex items-center gap-2 px-7 py-3 text-2xl disabled:opacity-50"
          style={{ '--c': '#ffc93c', '--t': '#4a2c00' } as CSSProperties}
        >
          ¡Vamos! <ArrowRight className="size-6" aria-hidden />
        </button>
      </form>
    </Fondo>
  )
}

/** La primera vez en este celular: el nombre con el que el docente verá el puntaje. Sin cuenta ni contraseña. */
function PedirNombre({ anterior, listo }: { anterior: DatosAlumno | null; listo: (a: DatosAlumno) => void }) {
  const [nombre, setNombre] = useState('')
  const limpio = nombre.trim()

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (limpio.length >= 2) listo(guardarAlumno(limpio))
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-[rgb(30_20_80/0.6)] p-4 backdrop-blur-sm" role="dialog" aria-modal aria-labelledby="titulo-nombre">
      <form onSubmit={enviar} className="tarjeta-juego entrar flex w-full max-w-sm flex-col items-center gap-4 px-6 pb-6 pt-4 text-center text-[#2b2d5c]">
        <Llama colores={LLAMAS.crema} tam={110} className="flotar" />
        <h2 id="titulo-nombre" className="text-3xl font-bold leading-tight">
          ¿Cómo te llamas?
        </h2>
        <p className="text-lg text-[#5d6290]">Así tu profe verá tu puntaje.</p>
        <label htmlFor="nombre" className="sr-only">
          Tu nombre
        </label>
        <input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value.slice(0, 30))}
          autoComplete="given-name"
          autoCapitalize="words"
          autoFocus
          placeholder={anterior ? 'Escribe tu nombre' : 'Nombre y apellido'}
          className="w-full rounded-2xl border-2 border-[#d9dcf2] px-4 py-3 text-center text-2xl font-semibold outline-none focus:border-[#4f6dff]"
        />
        <button
          type="submit"
          disabled={limpio.length < 2}
          className="b3d inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-2xl disabled:opacity-50"
          style={{ '--c': '#2fc46f' } as CSSProperties}
        >
          <Check className="size-6" aria-hidden /> ¡Listo!
        </button>
      </form>
    </div>
  )
}

function OtroJuego({ contenido, grado, actual, elegir, cerrar }: { contenido: Contenido; grado?: string; actual: JuegoId; elegir: (id: JuegoId) => void; cerrar: () => void }) {
  const otros = deCelular(contenido, grado).filter((j) => j.def.id !== actual)
  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-[rgb(30_20_80/0.6)] p-4 backdrop-blur-sm" role="dialog" aria-modal aria-label="Elegir otro juego">
      <div className="tarjeta-juego relative mx-auto my-6 flex max-w-2xl flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-3xl font-bold">¿A qué más jugamos?</h2>
          <button type="button" onClick={cerrar} className="grid size-10 place-items-center rounded-full bg-[#eef0fb]" aria-label="Volver al juego">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {otros.map(({ def, contenido: c }) => (
            <button
              key={def.id}
              type="button"
              onClick={() => elegir(def.id)}
              className="overflow-hidden rounded-2xl border-4 text-left transition hover:-translate-y-0.5"
              style={{ borderColor: def.color }}
            >
              <def.Miniatura muestra={muestraDe(c)} />
              <span className="block px-3 py-2 text-xl font-bold">{def.nombre}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Alumno() {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' })
  const [juego, setJuego] = useState<JuegoId | null>(null)
  const [eligiendo, setEligiendo] = useState(false)
  const [alumno, setAlumno] = useState<DatosAlumno | null>(alumnoGuardado)
  const [cambiandoNombre, setCambiandoNombre] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null)
  const pantalla = usePantallaCompleta()

  async function abrir(fuente: () => Promise<Publicado>, codigo?: string) {
    setEstado({ fase: 'cargando' })
    try {
      const publicado = await fuente()
      const contenido = contenidoDe(publicado)
      if (!contenido || !juegoPorId(publicado.juego)) throw new Error('vacio')
      setJuego(publicado.juego)
      setEstado({ fase: 'listo', publicado, contenido, codigo })
    } catch (e) {
      const noExiste = (e as Error).message === 'no-existe'
      setEstado({ fase: 'codigo', error: noExiste ? 'No encontramos ese juego. Revisa el código.' : 'No pudimos abrir el juego. Revisa tu conexión e intenta otra vez.' })
    }
  }

  function entrar(codigo: string) {
    if (!codigoValido(codigo)) return setEstado({ fase: 'codigo', error: 'Ese código no existe. Revisa las letras con tu profe.' })
    try {
      window.history.replaceState(null, '', `/j/${codigo}`)
    } catch {
      // Si no se puede cambiar la dirección, el juego abre igual.
    }
    void abrir(() => cargar(codigo), codigo)
  }

  useEffect(() => {
    const { codigo, datos } = leerUbicacion()
    if (datos) void abrir(() => leerAutonomo(datos))
    else if (codigo) entrar(codigo)
    else setEstado({ fase: 'codigo' })
    // Solo al abrir la página.
  }, [])

  const listo = estado.fase === 'listo' ? estado : null
  const elegido = useMemo(() => {
    if (!listo || !juego) return null
    // El juego compartido se abre aunque sea de clase (el docente lo eligió); si ya no cabe, el primero de celular.
    const compatibles = juegosCompatibles(listo.contenido)
    return compatibles.find((j) => j.def.id === juego) ?? deCelular(listo.contenido, listo.publicado.grado)[0] ?? null
  }, [listo, juego])

  // Cada partida manda su puntaje: el servidor se queda con el mejor de cada alumno.
  const codigo = listo?.codigo
  const juegoActual = elegido?.def.id
  const alTerminar = useCallback(
    async (r: Resultado) => {
      if (!codigo || !alumno || !juegoActual) return
      const nuevo = await enviarResultado(codigo, alumno, juegoActual, r)
      const texto = nuevo === null ? 'No pudimos guardar tu puntaje. Revisa tu conexión.' : nuevo ? '¡Es tu mejor puntaje! Tu profe lo verá.' : 'Listo: tu profe verá tu mejor puntaje.'
      setAviso({ texto, n: Math.random() })
    },
    [codigo, alumno, juegoActual],
  )

  useEffect(() => {
    if (!aviso) return
    const id = window.setTimeout(() => setAviso(null), 4500)
    return () => window.clearTimeout(id)
  }, [aviso])

  if (!navegadorAlDia()) {
    return (
      <Fondo>
        <Llama colores={LLAMAS.crema} tam={150} />
        <h1 className="text-3xl font-bold leading-tight text-white sombra-texto">Este celular necesita un navegador más nuevo</h1>
        <p className="text-lg font-medium text-[#1d3b6b]">Abre el link en Chrome actualizado (o actualiza el celular) para jugar.</p>
      </Fondo>
    )
  }

  if (estado.fase === 'codigo') return <PedirCodigo error={estado.error} entrar={entrar} />

  if (estado.fase === 'cargando' || !listo) {
    return (
      <Fondo>
        <Llama colores={LLAMAS.crema} tam={150} className="flotar" />
        <p className="text-2xl font-bold text-white sombra-texto" role="status">
          Abriendo el juego…
        </p>
      </Fondo>
    )
  }

  if (!elegido) return <PedirCodigo error="Este juego no tiene preguntas. Pide otro código a tu profe." entrar={entrar} />

  return (
    <>
      <Partida
        key={elegido.def.id}
        def={elegido.def}
        contenido={elegido.contenido}
        ritmo={listo.publicado.ritmo}
        pantalla={pantalla}
        // Con código, el juego es una tarea del docente: no se cambia por otro.
        alSalir={!codigo && deCelular(listo.contenido, listo.publicado.grado).length > 1 ? () => setEligiendo(true) : undefined}
        alTerminar={alTerminar}
        pie={
          codigo &&
          alumno && (
            <button type="button" onClick={() => setCambiandoNombre(true)} className="rounded-full bg-white/20 px-4 py-1.5 text-white" style={{ fontSize: 'clamp(14px, 3cqmin, 22px)' }}>
              Juegas como <strong>{alumno.nombre}</strong> · <span className="underline">No soy yo</span>
            </button>
          )
        }
        className="h-full w-full"
      />
      {codigo && (!alumno || cambiandoNombre) && (
        <PedirNombre
          anterior={alumno}
          listo={(a) => {
            setAlumno(a)
            setCambiandoNombre(false)
          }}
        />
      )}
      {aviso && (
        <div key={aviso.n} className="entrar pointer-events-none fixed inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] z-[96] flex justify-center px-4" role="status">
          <span className="rounded-full bg-[#2b2d5c] px-5 py-3 text-center text-lg font-semibold text-white shadow-xl">{aviso.texto}</span>
        </div>
      )}
      {eligiendo && (
        <OtroJuego
          contenido={listo.contenido}
          grado={listo.publicado.grado}
          actual={elegido.def.id}
          elegir={(id) => {
            setJuego(id)
            setEligiendo(false)
          }}
          cerrar={() => setEligiendo(false)}
        />
      )}
    </>
  )
}
