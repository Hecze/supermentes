import { Camera, Check, ChevronRight, FileUp, LoaderCircle, Mic, PenLine, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api, COSTOS, textoCosto, type EntradaTema } from '../api'
import { DOCENTE, TEMAS_RECIENTES } from '../api/ejemplos'
import { AREAS, DURACIONES, GRADOS, HERRAMIENTAS, ORDEN_HERRAMIENTAS } from '../app/herramientas'
import { useStore } from '../app/store'
import { Boton, Costo, IconoHerramienta, Tarjeta, cx } from '../components/ui'

type Modo = 'texto' | 'foto' | 'archivo'

const MODOS: { id: Modo; texto: string; corto: string; icono: typeof PenLine }[] = [
  { id: 'texto', texto: 'Escribir o dictar', corto: 'Escribir', icono: PenLine },
  { id: 'foto', texto: 'Foto del libro', corto: 'Foto', icono: Camera },
  { id: 'archivo', texto: 'Subir archivo', corto: 'Archivo', icono: FileUp },
]

const PASOS = ['Leyendo lo que enviaste', 'Identificando conceptos y vocabulario', 'Armando la ficha del tema']

const DICTADO_EJEMPLO = 'Fracciones como partes de un todo. Mis alumnos confunden el numerador con el denominador.'

function saludo() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

/** Miniatura de una página de libro para el ejemplo de "foto". */
function PaginaEjemplo() {
  return (
    <div className="flex aspect-[3/4] w-28 shrink-0 flex-col gap-1.5 rounded-md border border-line bg-surface p-2.5 shadow-sm" aria-label="Foto de ejemplo: página 48 del libro">
      <span className="font-display text-[11px] font-bold text-examen">Fracciones</span>
      {[90, 75, 85, 60].map((w, i) => (
        <span key={i} className="h-1 rounded bg-line" style={{ width: `${w}%` }} />
      ))}
      <div className="mt-1 flex gap-1.5">
        {[0.5, 0.25, 0.75].map((f) => (
          <span
            key={f}
            className="size-5 rounded-full border border-ink/40"
            style={{ background: `conic-gradient(var(--examen) ${f * 360}deg, transparent 0)` }}
          />
        ))}
      </div>
      {[80, 70].map((w, i) => (
        <span key={i} className="h-1 rounded bg-line" style={{ width: `${w}%` }} />
      ))}
      <span className="mt-auto self-end text-[9px] text-ink-soft">48</span>
    </div>
  )
}

export function Inicio() {
  const { ir, setFicha, avisar } = useStore()
  const [modo, setModo] = useState<Modo>('texto')
  const [texto, setTexto] = useState('')
  const [escuchando, setEscuchando] = useState(false)
  const [foto, setFoto] = useState<{ url: string | null; archivo?: File } | null>(null)
  const [archivo, setArchivo] = useState<{ nombre: string; archivo?: File } | null>(null)
  const [grado, setGrado] = useState('4.º primaria')
  const [area, setArea] = useState('Matemática')
  const [duracion, setDuracion] = useState('45 min')
  const [paso, setPaso] = useState<number | null>(null)
  const temporizadores = useRef<number[]>([])

  useEffect(() => () => temporizadores.current.forEach((t) => window.clearTimeout(t)), [])

  const listo = modo === 'texto' ? texto.trim().length > 3 : modo === 'foto' ? !!foto : !!archivo

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

  async function preparar() {
    const entrada: EntradaTema = {
      tipo: modo,
      texto: modo === 'texto' ? texto : undefined,
      archivo: modo === 'foto' ? foto?.archivo : modo === 'archivo' ? archivo?.archivo : undefined,
      grado,
      area,
      duracion,
    }
    setPaso(0)
    temporizadores.current.push(
      window.setTimeout(() => setPaso(1), 600),
      window.setTimeout(() => setPaso(2), 1200),
    )
    try {
      const ficha = await api.prepararFicha(entrada)
      setFicha(ficha)
      ir('ficha')
    } catch {
      avisar('No pudimos leer tu tema. Revisa tu conexión e intenta de nuevo.', 'error')
      setPaso(null)
    }
  }

  return (
    <>
      <header>
        <p className="text-ink-soft">
          {saludo()}, {DOCENTE.saludo}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold leading-tight sm:text-5xl">
          ¿Qué vas a enseñar <span className="marker">hoy</span>?
        </h1>
      </header>

      <Tarjeta className="flex flex-col gap-5 sm:p-6">
        {paso !== null ? (
          <div className="flex flex-col gap-3 py-4" role="status">
            {PASOS.map((p, i) => (
              <p key={p} className={cx('flex items-center gap-3', i > paso && 'text-ink-soft')}>
                {i < paso ? (
                  <Check className="size-5 text-ok" aria-hidden />
                ) : i === paso ? (
                  <LoaderCircle className="size-5 animate-spin" aria-hidden />
                ) : (
                  <span className="size-5" />
                )}
                {p}
              </p>
            ))}
          </div>
        ) : (
          <>
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1" role="tablist">
              {MODOS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={modo === m.id}
                  onClick={() => setModo(m.id)}
                  className={cx(
                    'flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm transition',
                    modo === m.id ? 'bg-surface font-semibold shadow-sm' : 'text-ink-soft hover:text-ink',
                  )}
                >
                  <m.icono className="size-4" aria-hidden />
                  <span className="sm:hidden">{m.corto}</span>
                  <span className="hidden sm:inline">{m.texto}</span>
                </button>
              ))}
            </div>

            {modo === 'texto' && (
              <div className="relative">
                <label htmlFor="tema-texto" className="sr-only">
                  Tema de la clase
                </label>
                <textarea
                  id="tema-texto"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={4}
                  placeholder="Ej.: Fracciones como partes de un todo. Mis alumnos confunden el numerador con el denominador."
                  className="w-full resize-none rounded-xl border border-line bg-bg/40 p-4 pr-16 text-base placeholder:text-ink-soft/70 focus:border-ink focus:outline-none"
                />
                <button
                  type="button"
                  onClick={dictar}
                  disabled={escuchando}
                  className={cx(
                    'absolute bottom-3 right-3 grid size-11 place-items-center rounded-full transition',
                    escuchando ? 'animate-pulse bg-cancion text-on-tool' : 'bg-surface-2 text-ink hover:bg-line',
                  )}
                  aria-label={escuchando ? 'Escuchando…' : 'Dictar el tema'}
                >
                  <Mic className="size-5" />
                </button>
                {escuchando && <p className="mt-2 text-sm text-cancion">Escuchando… habla con normalidad.</p>}
              </div>
            )}

            {modo === 'foto' && (
              <div className="flex flex-col gap-3">
                {foto ? (
                  <div className="flex items-start gap-4 rounded-xl border border-line p-3">
                    {foto.url ? <img src={foto.url} alt="Foto de la página del libro" className="h-36 w-28 rounded-md object-cover" /> : <PaginaEjemplo />}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="font-medium">{foto.archivo?.name ?? 'Página 48 · Libro de Matemática'}</p>
                      <p className="text-sm text-ink-soft">Leeremos el texto, los ejemplos y los ejercicios de la página.</p>
                    </div>
                    <button type="button" onClick={() => setFoto(null)} className="rounded-lg p-1 text-ink-soft hover:text-ink" aria-label="Quitar foto">
                      <X className="size-5" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="tema-foto"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-8 text-center hover:bg-surface-2"
                  >
                    <Camera className="size-8 text-examen" aria-hidden />
                    <span className="font-medium">Toma una foto de la página del libro</span>
                    <span className="text-sm text-ink-soft">Desde el celular se abre la cámara. Funciona con el libro del colegio.</span>
                    <input
                      id="tema-foto"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) setFoto({ url: URL.createObjectURL(f), archivo: f })
                      }}
                    />
                  </label>
                )}
                {!foto && (
                  <button type="button" onClick={() => setFoto({ url: null })} className="self-start text-sm font-medium text-examen underline-offset-4 hover:underline">
                    Usar una foto de ejemplo
                  </button>
                )}
              </div>
            )}

            {modo === 'archivo' && (
              <div className="flex flex-col gap-3">
                {archivo ? (
                  <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <FileUp className="size-5 text-examen" aria-hidden />
                    <p className="min-w-0 flex-1 truncate font-medium">{archivo.nombre}</p>
                    <button type="button" onClick={() => setArchivo(null)} className="rounded-lg p-1 text-ink-soft hover:text-ink" aria-label="Quitar archivo">
                      <X className="size-5" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="tema-archivo"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-8 text-center hover:bg-surface-2"
                  >
                    <FileUp className="size-8 text-examen" aria-hidden />
                    <span className="font-medium">Sube tu sesión, ficha o examen</span>
                    <span className="text-sm text-ink-soft">PDF, Word o PowerPoint</span>
                    <input
                      id="tema-archivo"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) setArchivo({ nombre: f.name, archivo: f })
                      }}
                    />
                  </label>
                )}
                {!archivo && (
                  <button
                    type="button"
                    onClick={() => setArchivo({ nombre: 'Sesión 12 - Fracciones.pdf' })}
                    className="self-start text-sm font-medium text-examen underline-offset-4 hover:underline"
                  >
                    Usar un archivo de ejemplo
                  </button>
                )}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ['tema-grado', 'Grado', grado, setGrado, GRADOS],
                  ['tema-area', 'Área', area, setArea, AREAS],
                  ['tema-duracion', 'Duración de la clase', duracion, setDuracion, DURACIONES],
                ] as const
              ).map(([id, etiqueta, valor, cambiar, opciones]) => (
                <label key={id} htmlFor={id} className="flex flex-col gap-1 text-sm">
                  <span className="text-ink-soft">{etiqueta}</span>
                  <select
                    id={id}
                    value={valor}
                    onChange={(e) => cambiar(e.target.value)}
                    className="h-11 rounded-xl border border-line bg-surface px-3 text-[15px] text-ink focus:border-ink focus:outline-none"
                  >
                    {opciones.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Boton onClick={preparar} disabled={!listo}>
                Preparar ficha del tema
                <ChevronRight className="size-4" aria-hidden />
              </Boton>
              <span className="text-sm text-ink-soft">{textoCosto(COSTOS.ficha)}: la ficha no gasta créditos.</span>
            </div>
          </>
        )}
      </Tarjeta>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">O ve directo a una herramienta</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ORDEN_HERRAMIENTAS.map((id) => {
            const h = HERRAMIENTAS[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => ir(id)}
                className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <IconoHerramienta id={id} />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-semibold">{h.nombre}</span>
                  <span className="text-sm text-ink-soft">{h.descripcion}</span>
                  <span className="mt-1 text-xs text-ink-soft">{h.costo}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">Tus temas recientes</h2>
        <Tarjeta className="divide-y divide-line p-0 sm:p-0">
          {TEMAS_RECIENTES.map((t) => (
            <button
              key={t.titulo}
              type="button"
              onClick={() => ir('ficha')}
              className="flex w-full items-center gap-4 px-4 py-3 text-left first:rounded-t-2xl last:rounded-b-2xl hover:bg-surface-2 sm:px-5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{t.titulo}</span>
                <span className="text-sm text-ink-soft">
                  {t.cuando} · {t.grado}
                </span>
              </span>
              <span className="flex gap-1">
                {t.herramientas.map((h) => (
                  <IconoHerramienta key={h} id={h} tam="sm" />
                ))}
              </span>
              <ChevronRight className="size-4 text-ink-soft" aria-hidden />
            </button>
          ))}
        </Tarjeta>
        <p className="text-xs text-ink-soft">
          <Costo n={0} className="mr-1" /> Abrir un tema que ya preparaste no gasta créditos.
        </p>
      </section>
    </>
  )
}
