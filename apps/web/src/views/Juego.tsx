import { ArrowLeft, Calculator, Check, Copy, ExternalLink, LoaderCircle, MessageCircle, Presentation, QrCode, Share2, Smartphone, Sparkles, Users, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api, COSTOS, type Ficha } from '../api'
import { useStore, type Resultados } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Acciones, Boton, Chip, NotaCreditos, cx, tinte } from '../components/ui'
import { JUEGOS, juegosCompatibles, ritmoDe } from '../juegos/catalogo'
import { contenidoDelTema, contenidoMatematica, nombrePractica } from '../juegos/contenido'
import { enlaceAutonomo, enlaceConCodigo, origen, publicar, type Publicado } from '../juegos/compartir/publicado'
import { Qr } from '../juegos/compartir/Qr'
import { habilidadesDelTema, practicaDelGrado, type Practica } from '../juegos/matematica/deducir'
import { GRUPOS_HABILIDAD, HABILIDADES, habilidadPorId, nivelPara } from '../juegos/matematica/habilidades'
import { TextoMat } from '../juegos/motor/piezas'
import { Partida, usePantallaCompleta } from '../juegos/motor/Partida'
import type { DefinicionJuego, JuegoId } from '../juegos/tipos'

const COLOR = 'var(--juego)'

type Fuente = NonNullable<Resultados['juegos']>

/** Si el tema es de cálculo, se juega con su habilidad; si no, con sus palabras y preguntas. */
function fuentePorDefecto(ficha: Ficha): Fuente {
  const sugerida = habilidadesDelTema(ficha)[0]
  return sugerida ? { fuente: 'calculo', ...sugerida } : { fuente: 'tema' }
}

function nombreFuente(f: Fuente, ficha: Ficha) {
  return f.fuente === 'calculo' ? nombrePractica(f) : `Palabras y preguntas de «${ficha.titulo}»`
}

/** "3.º y 4.º de primaria", "Inicial 5 años y 1.º de primaria". */
function textoGrados(grados: string[]) {
  const partes: string[] = []
  for (const nivel of ['inicial', 'primaria', 'secundaria']) {
    const ns = grados.filter((g) => g.startsWith(nivel)).map((g) => g.split('-')[1])
    if (!ns.length) continue
    if (nivel === 'inicial') partes.push(`Inicial ${ns.join(' y ')} años`)
    else partes.push(`${ns.map((n) => `${n}.º`).join(' y ')} de ${nivel}`)
  }
  return partes.join(' y ')
}

function Insignias({ def }: { def: DefinicionJuego }) {
  const insignia = 'inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-soft'
  return (
    <span className="flex flex-wrap gap-1.5">
      {def.donde.includes('clase') && (
        <span className={insignia}>
          <Presentation className="size-3.5" aria-hidden /> Proyectado
        </span>
      )}
      {def.donde.includes('celular') && (
        <span className={insignia}>
          <Smartphone className="size-3.5" aria-hidden /> Celular
        </span>
      )}
      {def.id === 'soga' && (
        <span className={insignia}>
          <Users className="size-3.5" aria-hidden /> 2 equipos
        </span>
      )}
    </span>
  )
}

function TarjetaJuego({ def, onClick }: { def: DefinicionJuego; onClick: () => void }) {
  const { Miniatura } = def
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border-2 border-line bg-surface text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5"
    >
      <span className="block overflow-hidden border-b-2 border-line">
        <span className="block transition duration-300 group-hover:scale-[1.04]">
          <Miniatura />
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="font-display text-xl font-bold leading-tight">{def.nombre}</span>
        <span className="text-sm text-ink-soft">{def.lema}</span>
        <span className="mt-auto pt-2">
          <Insignias def={def} />
        </span>
      </span>
    </button>
  )
}

/** Ventana para elegir con qué se juega: el tema o una habilidad de cálculo con su nivel. */
function ElegirPractica({
  abierta,
  cerrar,
  ficha,
  actual,
  tieneJuego,
  elegir,
}: {
  abierta: boolean
  cerrar: () => void
  ficha: Ficha
  actual: Fuente
  tieneJuego: boolean
  elegir: (f: Fuente) => void
}) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [borrador, setBorrador] = useState<Fuente>(actual)
  const deducidas = useMemo(() => habilidadesDelTema(ficha), [ficha])
  // Si el tema no dice qué calcular, se sugiere lo típico del grado.
  const sugeridas = deducidas.length ? deducidas : [practicaDelGrado(ficha.gradoId)]

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (abierta && !d.open) {
      setBorrador(actual)
      d.showModal()
    }
    if (!abierta && d.open) d.close()
  }, [abierta, actual])

  const hab = borrador.fuente === 'calculo' ? habilidadPorId(borrador.habilidad) : undefined
  const recomendado = hab ? nivelPara(hab, ficha.gradoId) : -1
  const muestra = useMemo(() => (borrador.fuente === 'calculo' ? (contenidoMatematica(borrador, 7)?.retos.slice(0, 4) ?? []) : []), [borrador])

  function elegirHabilidad(p: Practica) {
    setBorrador({ fuente: 'calculo', ...p })
  }

  return (
    <dialog
      ref={dialogo}
      onClose={cerrar}
      onClick={(e) => e.target === dialogo.current && cerrar()}
      aria-labelledby="titulo-practica"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45"
    >
      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 id="titulo-practica" className="font-display text-2xl font-bold">
              ¿Qué practican?
            </h2>
            <p className="text-ink-soft">Los mismos juegos sirven para el tema o para cálculo.</p>
          </div>
          <button type="button" onClick={cerrar} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-2" aria-label="Cerrar">
            <X className="size-5" />
          </button>
        </header>

        <button
          type="button"
          onClick={() => setBorrador({ fuente: 'tema' })}
          aria-pressed={borrador.fuente === 'tema'}
          className={cx(
            'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition',
            borrador.fuente === 'tema' ? 'border-[var(--juego)]' : 'border-line hover:bg-surface-2',
          )}
          style={borrador.fuente === 'tema' ? { background: tinte(COLOR, 8) } : undefined}
        >
          <Sparkles className="mt-0.5 size-5 shrink-0" style={{ color: COLOR }} aria-hidden />
          <span className="flex flex-col">
            <span className="font-semibold">El tema: {ficha.titulo}</span>
            <span className="text-sm text-ink-soft">
              Sus palabras clave{tieneJuego ? ', preguntas y parejas' : ''}. {tieneJuego ? '' : 'Puedes crear preguntas y parejas después.'}
            </span>
          </span>
        </button>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="size-5" style={{ color: COLOR }} aria-hidden />
            <h3 className="font-semibold">Cálculo</h3>
            <span className="text-sm text-ink-soft">Gratis y sin fin: los ejercicios se crean al momento.</span>
          </div>
          {sugeridas.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm text-ink-soft">{deducidas.length ? 'Para este tema' : `Para ${ficha.grado}`}</p>
              <div className="flex flex-wrap gap-1.5">
                {sugeridas.map((s) => (
                  <Chip
                    key={s.habilidad}
                    activo={borrador.fuente === 'calculo' && borrador.habilidad === s.habilidad}
                    color={COLOR}
                    onClick={() => elegirHabilidad(s)}
                  >
                    {habilidadPorId(s.habilidad)?.nombre}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {GRUPOS_HABILIDAD.map((g) => (
            <div key={g} className="flex flex-col gap-1.5">
              <p className="text-sm text-ink-soft">{g}</p>
              <div className="flex flex-wrap gap-1.5">
                {HABILIDADES.filter((h) => h.grupo === g).map((h) => (
                  <Chip
                    key={h.id}
                    activo={borrador.fuente === 'calculo' && borrador.habilidad === h.id}
                    color={COLOR}
                    onClick={() => elegirHabilidad({ habilidad: h.id, nivel: nivelPara(h, ficha.gradoId) })}
                  >
                    {h.nombre}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </section>

        {hab && borrador.fuente === 'calculo' && (
          <section className="flex flex-col gap-3 rounded-2xl bg-surface-2 p-4">
            <h3 className="font-semibold">Nivel de {hab.nombre.toLowerCase()}</h3>
            <div className="flex flex-wrap gap-1.5">
              {hab.niveles.map((n, i) => (
                <Chip key={n.nombre} activo={borrador.nivel === i} color={COLOR} onClick={() => setBorrador({ ...borrador, nivel: i })}>
                  {n.nombre}
                  {i === recomendado && <span className="size-1.5 rounded-full" style={{ background: COLOR }} aria-label={`recomendado para ${ficha.grado}`} />}
                </Chip>
              ))}
            </div>
            <p className="text-sm text-ink-soft">Se trabaja en {textoGrados(hab.niveles[borrador.nivel]?.grados ?? [])}.</p>
            <div className="flex flex-wrap gap-2" aria-label="Ejemplos">
              {muestra.map((r, i) => (
                <span key={i} className="rounded-xl border border-line bg-surface px-3 py-1.5 text-sm">
                  {r.consigna && !r.pregunta ? r.consigna : <TextoMat texto={r.pregunta} />} →{' '}
                  <strong>
                    <TextoMat texto={r.respuesta} />
                  </strong>
                </span>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-end">
          <Boton
            onClick={() => {
              elegir(borrador)
              cerrar()
            }}
          >
            <Check className="size-5" aria-hidden /> Listo
          </Boton>
        </div>
      </div>
    </dialog>
  )
}

// Un juego se publica una sola vez por sesión aunque se abra y cierre el panel.
const publicados = new Map<string, Promise<{ url: string; codigo: string | null }>>()

function enlaceDe(p: Publicado) {
  const clave = JSON.stringify(p)
  if (!publicados.has(clave)) {
    publicados.set(
      clave,
      publicar(p).then(
        (codigo) => ({ url: enlaceConCodigo(codigo), codigo }),
        // Sin servidor (por ejemplo, en desarrollo) el juego viaja dentro del link y funciona igual.
        async () => {
          publicados.delete(clave)
          return { url: await enlaceAutonomo(p), codigo: null }
        },
      ),
    )
  }
  return publicados.get(clave)!
}

function Compartir({ publicado, nombreJuego }: { publicado: Publicado; nombreJuego: string }) {
  const { avisar } = useStore()
  const [enlace, setEnlace] = useState<{ url: string; codigo: string | null } | null>(null)
  const [grande, setGrande] = useState(false)
  const panel = useRef<HTMLElement>(null)
  const clave = JSON.stringify(publicado)

  // El panel aparece debajo del juego: se desplaza para que se vea entero.
  useEffect(() => {
    panel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [enlace])

  useEffect(() => {
    let vivo = true
    setEnlace(null)
    enlaceDe(publicado).then((e) => vivo && setEnlace(e))
    return () => {
      vivo = false
    }
    // publicado se recrea en cada render; clave cambia solo si cambia el juego.
  }, [clave])

  useEffect(() => {
    if (!grande) return
    const salir = (e: KeyboardEvent) => e.key === 'Escape' && setGrande(false)
    window.addEventListener('keydown', salir)
    return () => window.removeEventListener('keydown', salir)
  }, [grande])

  if (!enlace) {
    return (
      <section ref={panel} className="flex items-center gap-3 rounded-2xl border-2 bg-surface p-5 text-ink-soft" style={{ borderColor: COLOR }} role="status">
        <LoaderCircle className="size-5 animate-spin" aria-hidden /> Preparando el link para tus alumnos…
      </section>
    )
  }

  const sitio = `${origen().replace(/^https?:\/\/(www\.)?/, '')}/j`
  const mensaje = `¡Hola! Hoy jugamos «${nombreJuego}» para practicar ${publicado.tema}. Entra aquí: ${enlace.url}${enlace.codigo ? ` (código ${enlace.codigo})` : ''}`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace!.url)
      avisar('Link copiado.', 'ok')
    } catch {
      avisar(`Copia este link: ${enlace!.url}`)
    }
  }

  return (
    <section ref={panel} className="flex flex-col gap-5 rounded-2xl border-2 bg-surface p-5 sm:flex-row sm:items-center" style={{ borderColor: COLOR }}>
      <button type="button" onClick={() => setGrande(true)} className="shrink-0 self-center rounded-xl border border-line bg-white p-1.5" aria-label="Mostrar el código QR en grande">
        <Qr texto={enlace.url} tam={152} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Tus alumnos escanean el código con el celular</p>
          {enlace.codigo ? (
            <p className="text-ink-soft">
              O entran a <strong className="text-ink">{sitio}</strong> y escriben el código{' '}
              <strong className="rounded-md bg-surface-2 px-1.5 font-mono text-lg tracking-widest text-ink">{enlace.codigo}</strong>. No necesitan cuenta.
            </p>
          ) : (
            <p className="text-sm text-ink-soft">No pudimos crear un código corto: el link funciona igual, con todo el juego adentro.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl px-4 font-medium text-on-tool hover:opacity-90"
            style={{ background: COLOR }}
          >
            <MessageCircle className="size-5" aria-hidden /> Enviar por WhatsApp
          </a>
          <Boton variante="contorno" onClick={copiar}>
            <Copy className="size-5" aria-hidden /> Copiar link
          </Boton>
          <Boton variante="contorno" onClick={() => setGrande(true)}>
            <QrCode className="size-5" aria-hidden /> Mostrar en grande
          </Boton>
          <a href={enlace.url} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl px-3 font-medium text-ink-soft hover:bg-surface-2 hover:text-ink">
            <ExternalLink className="size-5" aria-hidden /> Probar
          </a>
        </div>
      </div>

      {grande && (
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-[3vh] bg-white p-6 text-center text-[#111]" role="dialog" aria-modal aria-label="Código para escanear">
          <button type="button" onClick={() => setGrande(false)} className="absolute right-4 top-4 grid size-12 place-items-center rounded-full bg-[#f1f2f6]" aria-label="Cerrar">
            <X className="size-6" />
          </button>
          <p className="font-display text-[clamp(22px,4vw,48px)] font-bold">¡Escanea y a jugar {nombreJuego}!</p>
          <Qr texto={enlace.url} tam="min(62vh, 82vw)" />
          {enlace.codigo && (
            <p className="text-[clamp(18px,3vw,36px)]">
              {sitio} · código <strong className="font-mono tracking-[0.2em]">{enlace.codigo}</strong>
            </p>
          )}
        </div>
      )}
    </section>
  )
}

export function Juego() {
  const { ficha, resultados, guardar, creditos } = useStore()
  const { ocupado, generar } = useGeneracion()
  const [elegido, setElegido] = useState<JuegoId | null>(null)
  const [eligiendo, setEligiendo] = useState(false)
  const [compartir, setCompartir] = useState(false)
  const pantalla = usePantallaCompleta()

  // Al abrir un juego, la escena queda entera a la vista (en el celular el encabezado la empuja hacia abajo).
  useEffect(() => {
    if (elegido) pantalla.ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [elegido, pantalla.ref])

  const fuente: Fuente = resultados.juegos ?? (ficha ? fuentePorDefecto(ficha) : { fuente: 'tema' })
  const claveFuente = JSON.stringify(fuente)
  const contenido = useMemo(
    () => (!ficha ? null : fuente.fuente === 'calculo' ? contenidoMatematica(fuente) : contenidoDelTema(ficha, resultados.juego)),
    // fuente se recrea en cada render; claveFuente cambia solo si cambia lo elegido.
    [ficha, claveFuente, resultados.juego],
  )
  const compatibles = useMemo(() => (contenido ? juegosCompatibles(contenido) : []), [contenido])

  if (!ficha) return <SinTema />

  const enJuego = compatibles.find((j) => j.def.id === elegido)
  const faltan = JUEGOS.filter((j) => !compatibles.some((c) => c.def.id === j.id))

  async function crearPreguntas() {
    const nuevo = await generar(COSTOS.juego, 'Preguntas y parejas', () => api.generarJuego(ficha!))
    if (nuevo) {
      guardar('juego', nuevo)
      guardar('juegos', { fuente: 'tema' })
    }
  }

  if (enJuego && contenido) {
    return (
      <>
        <EncabezadoHerramienta id="juego" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Boton variante="suave" onClick={() => setElegido(null)} className="-ml-3">
            <ArrowLeft className="size-5" aria-hidden /> Todos los juegos
          </Boton>
          <p className="text-sm text-ink-soft">
            Practican: <TextoMat texto={nombreFuente(fuente, ficha)} className="font-medium text-ink" />
          </p>
        </div>
        <Partida
          key={`${elegido}-${claveFuente}`}
          def={enJuego.def}
          contenido={enJuego.contenido}
          ritmo={ritmoDe(ficha.gradoId)}
          pantalla={pantalla}
          alSalir={() => setElegido(null)}
          className="h-[min(78svh,680px)] min-h-[460px] w-full rounded-3xl shadow-[0_18px_40px_-24px_rgb(0_0_0/0.5)]"
        />
        <Acciones>
          <Boton variante="herramienta" herramienta="juego" onClick={pantalla.alternar}>
            <Presentation className="size-5" aria-hidden /> Proyectar en clase
          </Boton>
          <Boton variante="contorno" onClick={() => setCompartir(!compartir)}>
            <Share2 className="size-5" aria-hidden /> Compartir con mis alumnos
          </Boton>
        </Acciones>
        {compartir && (
          <Compartir
            nombreJuego={enJuego.def.nombre}
            publicado={{
              v: 1,
              juego: enJuego.def.id,
              ritmo: ritmoDe(ficha.gradoId),
              tema: ficha.titulo,
              fuente:
                fuente.fuente === 'calculo'
                  ? { tipo: 'calculo', habilidad: fuente.habilidad, nivel: fuente.nivel }
                  : { tipo: 'tema', contenido: { titulo: contenido.titulo, retos: contenido.retos, pares: contenido.pares, palabras: contenido.palabras } },
            }}
          />
        )}
      </>
    )
  }

  return (
    <>
      <EncabezadoHerramienta id="juego" />

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">¿A qué jugamos?</h2>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-3 sm:p-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl" style={{ background: tinte(COLOR, 14), color: COLOR }}>
            {fuente.fuente === 'calculo' ? <Calculator className="size-5" aria-hidden /> : <Sparkles className="size-5" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-soft">Practican</p>
            <p className="font-semibold">
              <TextoMat texto={nombreFuente(fuente, ficha)} />
            </p>
          </div>
          <Boton variante="contorno" tam="sm" onClick={() => setEligiendo(true)}>
            Cambiar
          </Boton>
        </div>

        {compatibles.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {compatibles.map(({ def }) => (
              <TarjetaJuego key={def.id} def={def} onClick={() => setElegido(def.id)} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-line bg-surface p-6 text-ink-soft">
            Con esto todavía no hay juegos. Crea preguntas del tema o elige algo de cálculo en «Cambiar».
          </p>
        )}
      </section>

      {fuente.fuente === 'tema' && !resultados.juego && (
        <section className="flex flex-col items-start gap-3 rounded-2xl border-2 border-dashed border-line bg-surface p-5">
          <p className="font-semibold">Más juegos con tu tema</p>
          <p className="text-ink-soft">
            Creamos preguntas y parejas sobre «{ficha.titulo}»
            {faltan.length > 0 && <> para jugar también {faltan.map((j) => j.nombre).join(', ')}</>}. Se crean una vez y sirven para todos los juegos.
          </p>
          <Boton variante="herramienta" herramienta="juego" onClick={crearPreguntas} cargando={ocupado}>
            Crear preguntas y parejas
          </Boton>
          <NotaCreditos n={COSTOS.juego} quedan={creditos} />
        </section>
      )}

      <ElegirPractica
        abierta={eligiendo}
        cerrar={() => setEligiendo(false)}
        ficha={ficha}
        actual={fuente}
        tieneJuego={!!resultados.juego}
        elegir={(f) => guardar('juegos', f)}
      />
    </>
  )
}
