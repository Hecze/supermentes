import { ArrowLeft, Calculator, Check, Copy, MessageCircle, Presentation, Share2, Smartphone, Sparkles, Users, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api, COSTOS, type Ficha } from '../api'
import { useStore, type Resultados } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Acciones, Boton, Chip, NotaCreditos, QrEjemplo, cx, tinte } from '../components/ui'
import { JUEGOS, juegosCompatibles, ritmoDe } from '../juegos/catalogo'
import { contenidoDelTema, contenidoMatematica, nombrePractica } from '../juegos/contenido'
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

function Compartir({ codigo, titulo }: { codigo: string; titulo: string }) {
  const { avisar } = useStore()
  const enlace = `supermentes.pe/j/${codigo}`
  const mensaje = `¡Hola! Hoy jugamos sobre "${titulo}". Entra aquí: https://${enlace} (código ${codigo})`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(`https://${enlace}`)
      avisar('Link copiado.', 'ok')
    } catch {
      avisar(`Copia este link: https://${enlace}`)
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border-2 bg-surface p-5 sm:flex-row sm:items-center" style={{ borderColor: COLOR }}>
      <QrEjemplo semilla={codigo} tam={136} />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <p className="font-semibold">Tus alumnos escanean el código con el celular</p>
          <p className="text-ink-soft">
            O entran a {enlace} con el código <strong className="text-ink">{codigo}</strong>. No necesitan cuenta.
          </p>
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
        </div>
        <p className="text-xs text-ink-soft">Código y link de ejemplo hasta que el juego se publique desde el servidor.</p>
      </div>
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
        {compartir && <Compartir codigo={resultados.juego?.codigo ?? 'JUEGO-1'} titulo={ficha.titulo} />}
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
