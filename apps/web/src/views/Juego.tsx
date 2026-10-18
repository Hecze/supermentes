import { ArrowLeft, Calculator, Trophy, Check, ChevronDown, Copy, LoaderCircle, MessageCircle, Presentation, Printer, Share2, Smartphone, Sparkles, Users, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { api, COSTOS, type Ficha } from '../api'
import { tokenDeCuenta, useCuenta } from '../app/cuenta'
import { useStore, type Resultados } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { juegoDelBanco, useBanco } from '../banco/banco'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Boton, Chip, NotaCreditos, Ventana, cx, imprimir, tinte } from '../components/ui'
import { JUEGOS, juegosCompatibles, ritmoDe } from '../juegos/catalogo'
import { contenidoDelTema, contenidoMatematica, nombrePractica } from '../juegos/contenido'
import { enlaceAutonomo, enlaceConCodigo, origen, publicar, type Publicado } from '../juegos/compartir/publicado'
import { Qr } from '../juegos/compartir/Qr'
import { guardarEnviado, sincronizarEnviados } from '../juegos/compartir/resultados'
import { habilidadesDelTema, practicaDelGrado, type Practica } from '../juegos/matematica/deducir'
import { GRUPOS_HABILIDAD, HABILIDADES, habilidadPorId, nivelPara, type Habilidad } from '../juegos/matematica/habilidades'
import { TextoMat } from '../juegos/motor/piezas'
import { Partida, usePantallaCompleta } from '../juegos/motor/Partida'
import { HojaPupiletras } from '../juegos/pupiletras/HojaPupiletras'
import { AtajoResultados } from './ResultadosJuegos'
import { InfoCurricular, textoGrados, useSustento, type Sustento } from './SustentoJuego'
import { muestraDe } from '../juegos/miniaturas'
import type { DefinicionJuego, JuegoId, Muestra } from '../juegos/tipos'

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


function Insignias({ def }: { def: DefinicionJuego }) {
  const insignia = 'inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-soft'
  return (
    <span className="flex flex-wrap gap-1.5">
      {def.donde.includes('celular') && (
        <span className={insignia}>
          <Smartphone className="size-3.5" aria-hidden /> Celular
        </span>
      )}
      {def.donde.includes('clase') && (
        <span className={insignia}>
          <Presentation className="size-3.5" aria-hidden /> Proyector
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

function TarjetaJuego({ def, onClick, sustento, muestra }: { def: DefinicionJuego; onClick: () => void; sustento: Sustento | null; muestra: Muestra }) {
  const { Miniatura } = def
  return (
    <div className="relative flex">
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full flex-col overflow-hidden rounded-2xl border-2 border-line bg-surface text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5"
      >
        <span className="block overflow-hidden border-b-2 border-line">
          <span className="block transition duration-300 group-hover:scale-[1.04]">
            <Miniatura muestra={muestra} />
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
      {/* Fuera del botón de la tarjeta: abrir el sustento no abre el juego. */}
      <InfoCurricular sustento={sustento} def={def} className="absolute right-2.5 top-2.5 z-10" />
    </div>
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
  const delGrado = practicaDelGrado(ficha.gradoId)
  const sugeridas = deducidas.length ? deducidas : delGrado ? [delGrado] : []

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (abierta && !d.open) {
      setBorrador(actual)
      d.showModal()
    }
    if (!abierta && d.open) d.close()
  }, [abierta, actual])

  // Primero lo que el currículo pide en el grado del tema (niveles con cita del desempeño); lo demás, aparte.
  const delCurriculo = (h: Habilidad) => h.niveles.some((n) => n.grados.includes(ficha.gradoId))
  const otrosGrados = HABILIDADES.filter((h) => !delCurriculo(h))
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
          {GRUPOS_HABILIDAD.map((g) => {
            const delGrupo = HABILIDADES.filter((h) => h.grupo === g && delCurriculo(h))
            if (!delGrupo.length) return null
            return (
              <div key={g} className="flex flex-col gap-1.5">
                <p className="text-sm text-ink-soft">{g}</p>
                <div className="flex flex-wrap gap-1.5">
                  {delGrupo.map((h) => (
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
            )
          })}
          {otrosGrados.length > 0 && (
            <details className="flex flex-col gap-1.5" open={!!hab && !delCurriculo(hab)}>
              <summary className="cursor-pointer text-sm text-ink-soft">De otros grados ({otrosGrados.length}): el currículo no los pide en {ficha.grado}</summary>
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {otrosGrados.map((h) => (
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
            </details>
          )}
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

function enlaceDe(p: Publicado, datos: { grado: string; practica: string }) {
  const clave = JSON.stringify(p)
  if (!publicados.has(clave)) {
    publicados.set(
      clave,
      publicar(p).then(
        ({ codigo, clave }) => {
          // La laptop del docente guarda la clave: con ella verá quién jugó y su mejor puntaje.
          guardarEnviado({ codigo, clave, juego: p.juego, tema: p.tema, ...datos, fecha: new Date().toISOString() })
          tokenDeCuenta().then((t) => void (t && sincronizarEnviados(t)))
          return { url: enlaceConCodigo(codigo), codigo }
        },
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

// "Ahora no" vale por esta visita: no se vuelve a preguntar en cada juego.
let sinCuentaEstaVisita = false

/** Mockup z2hti: la cuenta se ofrece al mandar el juego, que es cuando sirve (ver resultados en cualquier computadora). */
function PedirCuenta({ seguir }: { seguir: () => void }) {
  const { entrar } = useCuenta()
  const [entrando, setEntrando] = useState(false)
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-juego/10">
        <Trophy className="size-8 text-juego" aria-hidden />
      </span>
      <h3 className="font-display text-2xl font-bold sm:text-3xl">Guarda tu juego para ver cómo les va a tus alumnos</h3>
      <p className="text-ink-soft">Verás quién jugó y cuántas estrellas sacó, desde cualquier computadora. Es gratis.</p>
      <button
        type="button"
        disabled={entrando}
        onClick={() => {
          setEntrando(true)
          entrar().finally(() => setEntrando(false))
        }}
        className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-ink px-5 text-lg font-semibold text-surface hover:opacity-90 disabled:opacity-60"
      >
        {entrando ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <span className="grid size-7 place-items-center rounded-full bg-white font-bold text-[#4285F4]">G</span>}
        Entrar con Google
      </button>
      <button type="button" onClick={seguir} className="font-medium text-ink-soft underline-offset-4 hover:underline">
        Ahora no, solo mandar el juego
      </button>
      <p className="text-sm text-ink-soft">No publicamos nada en tu nombre.</p>
    </div>
  )
}

function Compartir({ publicado, nombreJuego, grado, practica }: { publicado: Publicado; nombreJuego: string; grado: string; practica: string }) {
  const { avisar } = useStore()
  const cuenta = useCuenta()
  const [sinCuenta, setSinCuenta] = useState(sinCuentaEstaVisita)
  const [enlace, setEnlace] = useState<{ url: string; codigo: string | null } | null>(null)
  const [grande, setGrande] = useState(false)
  const clave = JSON.stringify(publicado)

  useEffect(() => {
    let vivo = true
    setEnlace(null)
    enlaceDe(publicado, { grado, practica }).then((e) => vivo && setEnlace(e))
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

  if (cuenta.lista && !cuenta.entro && !sinCuenta) {
    return (
      <PedirCuenta
        seguir={() => {
          sinCuentaEstaVisita = true
          setSinCuenta(true)
        }}
      />
    )
  }

  if (!enlace) {
    return (
      <section className="flex items-center gap-3 py-6 text-ink-soft" role="status">
        <LoaderCircle className="size-5 animate-spin" aria-hidden /> Preparando el link para las familias…
      </section>
    )
  }

  const sitio = `${origen().replace(/^https?:\/\/(www\.)?/, '')}/j`
  // Lo leen los papás en el grupo de WhatsApp: ellos le prestan el celular a su hijo o hija.
  const mensaje = `Hola, familias 👋\nHoy en clase vimos «${publicado.tema}». Para practicar en casa, préstenle el celular a su hijo o hija y que juegue «${nombreJuego}» aquí:\n${enlace.url}\nNo necesita cuenta ni descargar nada. ¡Gracias!`

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace!.url)
      avisar('Link copiado.', 'ok')
    } catch {
      avisar(`Copia este link: ${enlace!.url}`)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-5 text-lg font-semibold text-on-tool hover:opacity-90"
        style={{ background: COLOR }}
      >
        <MessageCircle className="size-6" aria-hidden /> Enviar por WhatsApp
      </a>

      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 p-1.5 pl-3">
        <span className="min-w-0 flex-1 truncate text-ink-soft">{enlace.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
        <Boton tam="sm" variante="contorno" onClick={copiar}>
          <Copy className="size-4" aria-hidden /> Copiar
        </Boton>
      </div>

      {/* En clase: escanear el código o escribirlo en supermentes.app/j. */}
      <div className="flex items-center gap-4 border-t border-line pt-4">
        <button type="button" onClick={() => setGrande(true)} className="shrink-0 rounded-xl border border-line bg-white p-1.5" aria-label="Ver el código QR en grande" title="Ver en grande">
          <Qr texto={enlace.url} tam={96} />
        </button>
        <p className="text-ink-soft">
          Para la clase: que lo escaneen
          {enlace.codigo && (
            <>
              {' '}o entren a <strong className="text-ink">{sitio}</strong> con el código{' '}
              <strong className="font-mono tracking-widest text-ink">{enlace.codigo}</strong>
            </>
          )}
          .
        </p>
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
  const { ficha, resultados, guardar, creditos, avisar } = useStore()
  const { ocupado, generar } = useGeneracion()
  const [elegido, setElegido] = useState<JuegoId | null>(null)
  const [eligiendo, setEligiendo] = useState(false)
  const [compartir, setCompartir] = useState(false)
  const pantalla = usePantallaCompleta()

  // Al abrir un juego, la escena queda entera a la vista (en el celular el encabezado la empuja hacia abajo).
  useEffect(() => {
    setCompartir(false)
    if (elegido) pantalla.ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [elegido, pantalla.ref])

  const fuente: Fuente = resultados.juegos ?? (ficha ? fuentePorDefecto(ficha) : { fuente: 'tema' })
  const claveFuente = JSON.stringify(fuente)
  // Preguntas y parejas del tema: las que se crearon con la IA o, si no, las del banco (listas al instante).
  const banco = useBanco(ficha)
  const preguntas = useMemo(() => resultados.juego ?? (banco ? juegoDelBanco(banco) : undefined), [resultados.juego, banco])
  const contenido = useMemo(
    () => (!ficha ? null : fuente.fuente === 'calculo' ? contenidoMatematica(fuente) : contenidoDelTema(ficha, preguntas)),
    // fuente se recrea en cada render; claveFuente cambia solo si cambia lo elegido.
    [ficha, claveFuente, preguntas],
  )
  const compatibles = useMemo(() => (contenido && ficha ? juegosCompatibles(contenido, ficha.gradoId) : []), [contenido, ficha])
  // fuente se recrea en cada render: se memoriza por su clave para no rearmar el sustento.
  const fuenteEstable = useMemo(() => fuente, [claveFuente]) // eslint-disable-line react-hooks/exhaustive-deps
  const sustento = useSustento(ficha, fuenteEstable, banco)

  if (!ficha) return <SinTema />

  const enJuego = compatibles.find((j) => j.def.id === elegido)
  const faltan = JUEGOS.filter((j) => !compatibles.some((c) => c.def.id === j.id))

  async function crearPreguntas() {
    const nuevo = await generar(COSTOS.juego, 'Preguntas y parejas', () => api.generarJuego(ficha!))
    if (nuevo) {
      guardar('juego', nuevo)
      guardar('juegos', { fuente: 'tema' })
      // Los juegos nuevos aparecen arriba, en la lista: se sube a verlos.
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (enJuego && contenido) {
    const deCelular = enJuego.def.donde.includes('celular')
    return (
      <>
        <EncabezadoHerramienta id="juego" />
        {/* Todo lo del juego va arriba, a la vista: volver, el sustento, proyectar y enviar. */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Boton variante="suave" onClick={() => setElegido(null)} className="-ml-3 mr-auto">
            <ArrowLeft className="size-5" aria-hidden /> Todos los juegos
          </Boton>
          <InfoCurricular sustento={sustento} def={enJuego.def} chip />
          {enJuego.def.id === 'pupiletras' && (
            <Boton variante="contorno" onClick={() => imprimir(avisar)} aria-label="Imprimir pupiletras">
              <Printer className="size-5" aria-hidden /> <span className="hidden sm:inline">Imprimir</span>
            </Boton>
          )}
          <Boton variante={deCelular ? 'contorno' : 'herramienta'} herramienta="juego" onClick={pantalla.alternar} title={deCelular ? undefined : 'Este juego es para la clase, en una sola pantalla'}>
            <Presentation className="size-5" aria-hidden /> Proyectar
          </Boton>
          {deCelular && (
            <Boton variante="herramienta" herramienta="juego" onClick={() => setCompartir(true)}>
              <Share2 className="size-5" aria-hidden /> Enviar a las familias
            </Boton>
          )}
        </div>
        <Partida
          key={`${elegido}-${claveFuente}`}
          def={enJuego.def}
          contenido={enJuego.contenido}
          ritmo={ritmoDe(ficha.gradoId)}
          pantalla={pantalla}
          alSalir={() => setElegido(null)}
          className="h-[min(78svh,680px)] min-h-[460px] w-full rounded-3xl shadow-[0_18px_40px_-24px_rgb(0_0_0/0.5)] print:hidden"
        />
        {enJuego.def.id === 'pupiletras' && <HojaPupiletras titulo={ficha.titulo} grado={ficha.grado} palabras={enJuego.contenido.palabras} />}
        <Ventana abierta={compartir && deCelular} cerrar={() => setCompartir(false)} titulo="Enviar a las familias">
          {compartir && deCelular && (
            <Compartir
              nombreJuego={enJuego.def.nombre}
              grado={ficha.grado}
              practica={nombreFuente(fuente, ficha)}
              publicado={{
                v: 1,
                juego: enJuego.def.id,
                ritmo: ritmoDe(ficha.gradoId),
                tema: ficha.titulo,
                grado: ficha.gradoId,
                fuente:
                  fuente.fuente === 'calculo'
                    ? { tipo: 'calculo', habilidad: fuente.habilidad, nivel: fuente.nivel }
                    : { tipo: 'tema', contenido: { titulo: contenido.titulo, retos: contenido.retos, pares: contenido.pares, palabras: contenido.palabras } },
              }}
            />
          )}
        </Ventana>
      </>
    )
  }

  return (
    <>
      <EncabezadoHerramienta
        id="juego"
        accion={
          <Boton variante="contorno" onClick={() => setEligiendo(true)} title="Cambiar qué practican" className="max-w-[min(22rem,calc(100vw-2rem))]">
            {fuente.fuente === 'calculo' ? <Calculator className="size-5 shrink-0" style={{ color: COLOR }} aria-hidden /> : <Sparkles className="size-5 shrink-0" style={{ color: COLOR }} aria-hidden />}
            <span className="truncate">{fuente.fuente === 'calculo' ? <TextoMat texto={nombrePractica(fuente)} /> : 'Palabras del tema'}</span>
            <ChevronDown className="size-4 shrink-0 text-ink-soft" aria-hidden />
          </Boton>
        }
      />

      <AtajoResultados tema={ficha.titulo} />

      <section className="flex flex-col gap-4">
        {compatibles.length > 0 ? (
          <>
            <div className="flex flex-col gap-0.5">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Smartphone className="size-5" style={{ color: COLOR }} aria-hidden /> Para jugar en casa, en el celular
              </h3>
              <p className="text-sm text-ink-soft">Los mandas al WhatsApp de las familias y los niños juegan con el celular de sus papás.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {compatibles
                .filter(({ def }) => def.donde.includes('celular'))
                .map(({ def, contenido: c }) => (
                  <TarjetaJuego key={def.id} def={def} sustento={sustento} muestra={muestraDe(c)} onClick={() => setElegido(def.id)} />
                ))}
            </div>
            {compatibles.some(({ def }) => !def.donde.includes('celular')) && (
              <>
                <div className="mt-2 flex flex-col gap-0.5">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Presentation className="size-5" style={{ color: COLOR }} aria-hidden /> Para la clase, con el proyector
                  </h3>
                  <p className="text-sm text-ink-soft">Se juegan en una sola pantalla, con toda la clase.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {compatibles
                    .filter(({ def }) => !def.donde.includes('celular'))
                    .map(({ def, contenido: c }) => (
                      <TarjetaJuego key={def.id} def={def} sustento={sustento} muestra={muestraDe(c)} onClick={() => setElegido(def.id)} />
                    ))}
                </div>
              </>
            )}
          </>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-line bg-surface p-6 text-ink-soft">
            Con esto todavía no hay juegos. Crea preguntas del tema o elige algo de cálculo con el botón de arriba a la derecha.
          </p>
        )}
      </section>

      {fuente.fuente === 'tema' && !preguntas && banco === null && (
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
        tieneJuego={!!preguntas}
        elegir={(f) => guardar('juegos', f)}
      />
    </>
  )
}
