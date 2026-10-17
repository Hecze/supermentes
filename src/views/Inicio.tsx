import { ArrowRight, Camera, Check, ChevronRight, FileText, LoaderCircle, Mic, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, type EntradaTema } from '../api'
import { DOCENTE, TEMAS_RECIENTES } from '../api/ejemplos'
import { GRADOS } from '../app/herramientas'
import { useStore } from '../app/store'
import { Chip, cx } from '../components/ui'

type Adjunto = { nombre: string; url: string | null; archivo?: File; tipo: 'foto' | 'archivo' }

const PASOS = ['Leyendo lo que enviaste', 'Buscando las ideas y palabras clave', 'Preparando tu tema']
const EJEMPLOS = ['Las fracciones', 'El ciclo del agua', 'Los sustantivos', 'Las regiones del Perú']
const DICTADO_EJEMPLO = 'Fracciones como partes de un todo. Mis alumnos confunden el numerador con el denominador.'

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

/** Miniatura de una página de libro para la foto de ejemplo. */
function PaginaEjemplo() {
  return (
    <span className="flex aspect-[3/4] w-12 shrink-0 flex-col gap-1 rounded border border-line bg-surface p-1.5 shadow-sm" aria-hidden>
      <span className="h-1 w-2/3 rounded bg-examen" />
      {[90, 75, 85].map((w, i) => (
        <span key={i} className="h-0.5 rounded bg-line" style={{ width: `${w}%` }} />
      ))}
      <span className="mt-0.5 size-3 rounded-full border border-ink/40" style={{ background: 'conic-gradient(var(--examen) 270deg, transparent 0)' }} />
    </span>
  )
}

export function Inicio() {
  const { ir, setFicha, avisar, ficha } = useStore()
  const [texto, setTexto] = useState('')
  const [adjunto, setAdjunto] = useState<Adjunto | null>(null)
  const [grado, setGrado] = useState(ficha?.grado ?? '4.º primaria')
  const [escuchando, setEscuchando] = useState(false)
  const [paso, setPaso] = useState<number | null>(null)
  const temporizadores = useRef<number[]>([])

  useEffect(() => () => temporizadores.current.forEach((t) => window.clearTimeout(t)), [])

  const listo = texto.trim().length > 2 || !!adjunto

  function dictar() {
    // El dictado real usará voz a texto; aquí se simula con una frase de ejemplo.
    setEscuchando(true)
    temporizadores.current.push(
      window.setTimeout(() => {
        setTexto(DICTADO_EJEMPLO)
        setEscuchando(false)
      }, 1600),
    )
  }

  async function preparar(e?: FormEvent) {
    e?.preventDefault()
    if (!listo || paso !== null) return
    const entrada: EntradaTema = {
      tipo: adjunto ? adjunto.tipo : 'texto',
      texto: texto.trim() || undefined,
      archivo: adjunto?.archivo,
      grado,
    }
    setPaso(0)
    temporizadores.current.push(
      window.setTimeout(() => setPaso(1), 600),
      window.setTimeout(() => setPaso(2), 1200),
    )
    try {
      setFicha(await api.prepararFicha(entrada))
      ir('ficha')
    } catch {
      avisar('No pudimos leer tu tema. Revisa tu conexión e intenta de nuevo.', 'error')
      setPaso(null)
    }
  }

  return (
    <>
      <header className="flex flex-col gap-2 pt-2 sm:pt-12">
        <p className="text-lg text-ink-soft">
          {saludo()}, {DOCENTE.saludo}
        </p>
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
          ¿Qué vas a enseñar <span className="marker">hoy</span>?
        </h1>
      </header>

      {paso !== null ? (
        <div className="flex flex-col gap-4 rounded-3xl border-2 border-line bg-surface p-6 text-lg" role="status">
          {PASOS.map((p, i) => (
            <p key={p} className={cx('flex items-center gap-3', i > paso && 'text-ink-soft')}>
              {i < paso ? (
                <Check className="size-6 text-ok" aria-hidden />
              ) : i === paso ? (
                <LoaderCircle className="size-6 animate-spin" aria-hidden />
              ) : (
                <span className="size-6" />
              )}
              {p}
            </p>
          ))}
        </div>
      ) : (
        <form onSubmit={preparar} className="flex flex-col gap-3">
          <div className="flex flex-col rounded-3xl border-2 border-line bg-surface shadow-sm transition focus-within:border-ink">
            {adjunto && (
              <div className="flex items-center gap-3 border-b border-line px-4 py-3">
                {adjunto.url ? (
                  <img src={adjunto.url} alt="" className="h-16 w-12 rounded object-cover" />
                ) : adjunto.tipo === 'foto' ? (
                  <PaginaEjemplo />
                ) : (
                  <FileText className="size-6 text-examen" aria-hidden />
                )}
                <p className="min-w-0 flex-1 truncate font-medium">{adjunto.nombre}</p>
                <button type="button" onClick={() => setAdjunto(null)} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label="Quitar">
                  <X className="size-5" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-1.5 p-2 sm:p-3">
              <label htmlFor="tema" className="sr-only">
                Tema de tu clase
              </label>
              <textarea
                id="tema"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    preparar()
                  }
                }}
                rows={2}
                placeholder={adjunto ? 'Si quieres, agrega una nota' : escuchando ? 'Te escucho…' : 'Escribe el tema de tu clase'}
                className="min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-lg placeholder:text-ink-soft/70 focus:outline-none sm:text-xl"
              />
              <label
                htmlFor="tema-foto"
                className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
                title="Foto del libro o archivo"
              >
                <Camera className="size-6" aria-hidden />
                <span className="sr-only">Subir una foto del libro o un archivo</span>
                <input
                  id="tema-foto"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    const esFoto = f.type.startsWith('image/')
                    setAdjunto({ nombre: f.name, url: esFoto ? URL.createObjectURL(f) : null, archivo: f, tipo: esFoto ? 'foto' : 'archivo' })
                  }}
                />
              </label>
              <button
                type="button"
                onClick={dictar}
                disabled={escuchando}
                className={cx(
                  'grid size-12 shrink-0 place-items-center rounded-full transition',
                  escuchando ? 'animate-pulse bg-cancion text-on-tool' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                )}
                aria-label={escuchando ? 'Escuchando' : 'Dictar el tema'}
                title="Dictar"
              >
                <Mic className="size-6" />
              </button>
              <button
                type="submit"
                disabled={!listo}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-ink transition hover:opacity-90 disabled:opacity-30"
                aria-label="Preparar mi tema"
              >
                <ArrowRight className="size-6" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 text-ink-soft">
            <label htmlFor="tema-grado">Para</label>
            <select
              id="tema-grado"
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              className="rounded-lg border border-line bg-surface px-2 py-1 font-medium text-ink focus:border-ink focus:outline-none"
            >
              {GRADOS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </div>
        </form>
      )}

      {paso === null && (
        <div className="flex flex-col gap-3">
          <p className="text-ink-soft">Prueba con un ejemplo:</p>
          <div className="flex flex-wrap gap-2">
            {EJEMPLOS.map((e) => (
              <Chip key={e} onClick={() => setTexto(e)}>
                {e}
              </Chip>
            ))}
            <Chip onClick={() => setAdjunto({ nombre: 'Página 48 del libro de Matemática', url: null, tipo: 'foto' })}>
              <Camera className="size-4" aria-hidden /> Foto del libro
            </Chip>
          </div>
        </div>
      )}

      {paso === null && (
        <section className="flex flex-col gap-2 pt-4">
          <h2 className="text-ink-soft">Seguir con un tema anterior</h2>
          <div className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface">
            {TEMAS_RECIENTES.map((t) => (
              <button
                key={t.titulo}
                type="button"
                onClick={() => ir('ficha')}
                className="flex items-center gap-3 px-4 py-3.5 text-left first:rounded-t-2xl last:rounded-b-2xl hover:bg-surface-2"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{t.titulo}</span>
                <span className="text-sm text-ink-soft">{t.cuando}</span>
                <ChevronRight className="size-5 text-ink-soft" aria-hidden />
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
