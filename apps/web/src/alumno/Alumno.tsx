// Página del alumno (/j/CODIGO): abre el juego que compartió su profe. Sin cuenta y sin el panel del docente.
import { ArrowRight, X } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { juegoPorId, juegosCompatibles } from '../juegos/catalogo'
import { cargar, codigoValido, contenidoDe, leerAutonomo, type Publicado } from '../juegos/compartir/publicado'
import { Llama, LLAMAS } from '../juegos/motor/Llama'
import { Partida, usePantallaCompleta } from '../juegos/motor/Partida'
import type { Contenido, JuegoId } from '../juegos/tipos'
import '../juegos/juegos.css'

type Estado =
  | { fase: 'codigo'; error?: string }
  | { fase: 'cargando' }
  | { fase: 'listo'; publicado: Publicado; contenido: Contenido }

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

function OtroJuego({ contenido, actual, elegir, cerrar }: { contenido: Contenido; actual: JuegoId; elegir: (id: JuegoId) => void; cerrar: () => void }) {
  const otros = juegosCompatibles(contenido).filter((j) => j.def.id !== actual)
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
          {otros.map(({ def }) => (
            <button
              key={def.id}
              type="button"
              onClick={() => elegir(def.id)}
              className="overflow-hidden rounded-2xl border-4 text-left transition hover:-translate-y-0.5"
              style={{ borderColor: def.color }}
            >
              <def.Miniatura />
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
  const pantalla = usePantallaCompleta()

  async function abrir(fuente: () => Promise<Publicado>) {
    setEstado({ fase: 'cargando' })
    try {
      const publicado = await fuente()
      const contenido = contenidoDe(publicado)
      if (!contenido || !juegoPorId(publicado.juego)) throw new Error('vacio')
      setJuego(publicado.juego)
      setEstado({ fase: 'listo', publicado, contenido })
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
    void abrir(() => cargar(codigo))
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
    const compatibles = juegosCompatibles(listo.contenido)
    // Si el juego compartido ya no cabe con este contenido, se abre el primero que sí.
    return compatibles.find((j) => j.def.id === juego) ?? compatibles[0] ?? null
  }, [listo, juego])

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
        alSalir={juegosCompatibles(listo.contenido).length > 1 ? () => setEligiendo(true) : undefined}
        className="h-full w-full"
      />
      {eligiendo && (
        <OtroJuego
          contenido={listo.contenido}
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
