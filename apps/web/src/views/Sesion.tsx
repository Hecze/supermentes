// Sesión de aprendizaje: el documento que el docente presenta al director, en el formato del MINEDU.
// Se corrige con un clic, se imprime y se descarga en Word (un .doc hecho con el HTML de la hoja, con lo corregido).
import { BadgeCheck, Check, Download, FileText, Gamepad2, Music, Printer, RefreshCw, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { api, COSTOS, type OpcionesSesion, type Sesion as TipoSesion } from '../api'
import { INTERESES } from '../app/herramientas'
import { useStore, type Vista } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { BarraHoja, Boton, Chip, Desplegable, Editable, Hoja, NotaCreditos, Pregunta, Ventana, cx, descargar, imprimir, tinte } from '../components/ui'
import { useCurriculo, type AreaCurriculo } from '../curriculo/cargar'
import type { Nivel } from '../curriculo/catalogo'
import { ubicarCita } from '../curriculo/citas'
import { BotonInfo, Cita } from './SustentoJuego'

const COLOR = 'var(--adaptar)'
const ALUMNOS = 30
const NIVELES_LOGRO = ['Siempre', 'A veces', 'No lo hace']

// ---------- Antes de crear ----------

function ElegirOpciones({ opciones, cambiar }: { opciones: OpcionesSesion; cambiar: (o: OpcionesSesion) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Pregunta titulo="¿Cuánto dura tu clase?">
        <div className="flex flex-wrap gap-2">
          {([45, 90] as const).map((d) => (
            <Chip key={d} grande activo={opciones.duracion === d} color={COLOR} onClick={() => cambiar({ ...opciones, duracion: d })}>
              {d} min
            </Chip>
          ))}
        </div>
      </Pregunta>
      <Desplegable titulo="Más opciones">
        <div className="flex flex-col gap-2">
          <p className="font-medium">¿Qué le gusta a tu salón?</p>
          <p className="-mt-1 text-sm text-ink-soft">Lo usamos para que la motivación les llame la atención. Puedes dejarlo vacío.</p>
          <div className="flex flex-wrap items-center gap-2">
            {INTERESES.map((i) => (
              <Chip key={i} activo={opciones.interes === i} color={COLOR} onClick={() => cambiar({ ...opciones, interes: opciones.interes === i ? undefined : i })}>
                {i}
              </Chip>
            ))}
            <input
              value={INTERESES.includes(opciones.interes ?? '') ? '' : (opciones.interes ?? '')}
              onChange={(e) => cambiar({ ...opciones, interes: e.target.value || undefined })}
              placeholder="Otro: dinosaurios, música…"
              maxLength={60}
              className="h-9 min-w-0 flex-1 rounded-full border-2 border-line bg-surface px-3.5 text-sm outline-none focus:border-ink sm:max-w-64"
            />
          </div>
        </div>
      </Desplegable>
    </div>
  )
}

const PASOS_AVANCE = ['Leyendo el currículo de tu grado…', 'Eligiendo los criterios y su desempeño…', 'Armando los momentos de la clase…', 'Preparando la ficha y la escala de valoración…']

/** Lo que se ve mientras la IA escribe: cada paso se marca a medida que avanza el tiempo. */
function Avance() {
  const [paso, setPaso] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setPaso((p) => Math.min(p + 1, PASOS_AVANCE.length - 1)), 9000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-line bg-surface px-5 py-5 print:hidden" role="status">
      {PASOS_AVANCE.map((t, i) => (
        <p key={t} className={cx('flex items-center gap-2', i > paso ? 'text-ink-soft/50' : i < paso ? 'text-ink-soft' : 'font-medium')}>
          {i < paso ? (
            <Check className="size-4 text-ok" aria-hidden />
          ) : i === paso ? (
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          ) : (
            <span className="size-4" aria-hidden />
          )}
          {t}
        </p>
      ))}
      <p className="pt-1 text-sm text-ink-soft">Suele tardar menos de un minuto.</p>
    </div>
  )
}

function Fallo({ texto, reintentar }: { texto: string; reintentar: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warn/40 bg-warn/10 px-5 py-4 print:hidden" role="alert">
      <TriangleAlert className="size-5 shrink-0 text-warn" aria-hidden />
      <p className="min-w-0 flex-1">{texto} No se descontaron créditos.</p>
      <Boton variante="contorno" onClick={reintentar}>
        <RotateCcw className="size-4" aria-hidden /> Reintentar
      </Boton>
    </div>
  )
}

// ---------- La hoja ----------

/** Celda de tabla: en pantalla con borde suave; en Word, con borde negro (ver aWord). */
const td = 'border border-line p-2 align-top'
const th = 'border border-line bg-surface-2 p-2 text-left align-top font-semibold'

function Titulo({ children }: { children: ReactNode }) {
  return (
    <h3 className="rounded-md px-3 py-1.5 text-sm font-bold uppercase tracking-wide" style={{ background: tinte(COLOR, 14) }}>
      {children}
    </h3>
  )
}

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5">
      {items.map((t, i) => (
        <li key={i}>
          <Editable como="span">{t}</Editable>
        </li>
      ))}
    </ul>
  )
}

function Parte({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="font-bold uppercase underline underline-offset-2">{titulo}</h4>
      <Lista items={items} />
    </div>
  )
}

/** El "i" de cada criterio: el desempeño oficial con la parte que trabaja, resaltada. */
function InfoCriterio({ area, cita }: { area: AreaCurriculo | null; cita?: string }) {
  const { verCurriculo, ficha } = useStore()
  const u = area && cita ? ubicarCita(area, cita) : null
  if (!u || !ficha) return null
  return (
    <BotonInfo etiqueta="Desempeño" chip className="relative mt-1 print:hidden">
      <div className="flex flex-col gap-2 text-sm leading-snug">
        <p className="text-base font-semibold">Por qué cumple el Currículo Nacional</p>
        <p>
          Este criterio trabaja la competencia <strong>«{u.competencia}»</strong>, con este desempeño oficial de {ficha.grado}:
        </p>
        <Cita u={u} cita={cita} />
        <p className="flex items-start gap-1.5 font-medium text-ok">
          <BadgeCheck className="mt-px size-4 shrink-0" aria-hidden /> Lo resaltado está copiado tal cual del currículo.
        </p>
        <button type="button" onClick={() => verCurriculo(ficha.gradoId, ficha.areaId)} className="self-start text-xs text-ink-soft underline underline-offset-2 hover:text-ink">
          Ver en el currículo
        </button>
      </div>
    </BotonInfo>
  )
}

function HojaSesion({ s, area }: { s: TipoSesion; area: AreaCurriculo | null }) {
  const m = s.minutos
  return (
    <div className="flex flex-col gap-5 text-[15px] leading-relaxed">
      <header className="flex flex-col gap-1 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Sesión de aprendizaje</p>
        <Editable como="h2" className="font-display text-2xl font-bold sm:text-3xl">
          {s.titulo}
        </Editable>
        <p className="text-ink-soft">
          {s.grado} · {s.area} · {s.opciones.duracion} minutos
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <Titulo>I. Datos informativos</Titulo>
        <table className="w-full border-collapse">
          <tbody>
            {[
              ['Institución educativa', ''],
              ['Docente', ''],
              ['Fecha', ''],
              ['Grado', s.grado],
              ['Área', s.area],
              ['Duración', `${s.opciones.duracion} minutos`],
            ].map(([k, v]) => (
              <tr key={k}>
                <th className={th} style={{ width: '30%' }}>
                  {k}
                </th>
                <td className={td}>
                  <Editable como="span" className="block min-h-6">
                    {v}
                  </Editable>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-2">
        <Titulo>II. Propósitos de aprendizaje</Titulo>
        {/* Sin scroll horizontal: recortaría la ventanita del desempeño. En el celular las palabras se cortan con
            guion para que la tabla quepa y la página no se deslice de lado. */}
        <div>
          <table className="w-full border-collapse text-sm max-sm:hyphens-auto max-sm:[&_*]:[overflow-wrap:anywhere]">
            <thead>
              <tr>
                <th className={th}>Competencia</th>
                <th className={th}>Capacidades</th>
                <th className={th}>Criterios de evaluación</th>
                <th className={th}>Evidencia de aprendizaje</th>
                <th className={th}>Instrumento de evaluación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={cx(td, 'w-[16%]')}>{s.competencia}</td>
                <td className={cx(td, 'w-[24%]')}>
                  <ul className="flex list-disc flex-col gap-1 pl-4">
                    {s.capacidades.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </td>
                <td className={cx(td, 'w-[30%]')}>
                  <ul className="flex list-disc flex-col gap-2 pl-4">
                    {s.criterios.map((c, i) => (
                      <li key={i}>
                        <Editable como="span">{c.texto}</Editable>
                        <div>
                          <InfoCriterio area={area} cita={c.cita} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className={td}>
                  <Editable como="span">{s.evidencia}</Editable>
                </td>
                <td className={td}>
                  <Editable como="span">{s.instrumento}</Editable>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={th}>Enfoque transversal</th>
              <th className={th}>Valor</th>
              <th className={th}>Actitudes observables</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cx(td, 'w-[30%]')}>{s.enfoque.nombre}</td>
              <td className={cx(td, 'w-[20%]')}>{s.enfoque.valor}</td>
              <td className={td}>
                <Editable como="span">{s.enfoque.actitudes}</Editable>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-2">
        <Titulo>III. Materiales y recursos</Titulo>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={th}>¿Qué hacer antes de la sesión?</th>
              <th className={th}>¿Qué recursos o materiales se usarán?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cx(td, 'w-1/2')}>
                <Lista items={s.materiales.antes} />
              </td>
              <td className={td}>
                <Lista items={s.materiales.recursos} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-3">
        <Titulo>IV. Momentos de la sesión</Titulo>
        <h3 className="font-bold">INICIO ({m.inicio} min)</h3>
        <Parte titulo="Motivación" items={s.inicio.motivacion} />
        <Parte titulo="Saberes previos" items={s.inicio.saberesPrevios} />
        <Parte titulo="Conflicto cognitivo" items={s.inicio.conflicto} />
        <Parte titulo="Propósito de la sesión" items={[s.proposito]} />
        <Parte titulo="Criterios de evaluación" items={s.criterios.map((c) => c.texto)} />
        <Parte titulo="Normas de convivencia" items={s.inicio.normas} />

        <h3 className="border-t border-line pt-3 font-bold">DESARROLLO ({m.desarrollo} min)</h3>
        {s.desarrollo.map((d, i) => (
          <Parte key={i} titulo={d.titulo} items={d.pasos} />
        ))}

        <h3 className="border-t border-line pt-3 font-bold">CIERRE ({m.cierre} min)</h3>
        <Parte titulo="Sistematización" items={s.cierre.sistematizacion} />
        <Parte titulo="Metacognición" items={s.cierre.metacognicion} />
        <Parte titulo="Tarea" items={s.cierre.tarea} />
      </section>

      <p className="text-xs text-ink-soft">
        Referencias: Currículo Nacional de la Educación Básica y Programa Curricular de {/secundaria/i.test(s.grado) ? 'Educación Secundaria' : /inicial/i.test(s.grado) ? 'Educación Inicial' : 'Educación Primaria'} (MINEDU).
      </p>

      <section className="flex flex-col gap-3 border-t-2 border-dashed border-line pt-5 print:break-before-page print:border-0 print:pt-0" data-salto>
        <Titulo>Ficha de aplicación</Titulo>
        <Editable como="h3" className="text-center text-lg font-bold">
          {s.ficha.titulo}
        </Editable>
        <p className="[overflow-wrap:anywhere]">Nombre: ________________________________________ Fecha: ______________</p>
        <ol className="flex list-decimal flex-col gap-4 pl-5">
          {s.ficha.actividades.map((a, i) => (
            <li key={i}>
              <Editable como="span">{a.consigna}</Editable>
              {Array.from({ length: a.lineas }, (_, j) => (
                <p key={j} className="mt-3 border-b border-ink-soft/60" aria-hidden>
                  &nbsp;
                </p>
              ))}
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-2 border-t-2 border-dashed border-line pt-5 print:break-before-page print:border-0 print:pt-0" data-salto>
        <Titulo>Escala de valoración</Titulo>
        <p className="text-sm">
          <strong>Competencia:</strong> {s.competencia}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr>
                <th className={cx(th, 'w-8 text-center')} rowSpan={2}>
                  N.º
                </th>
                <th className={cx(th, 'w-48')} rowSpan={2}>
                  Nombres y apellidos
                </th>
                {s.criterios.map((c, i) => (
                  <th key={i} className={cx(th, 'font-normal')} colSpan={NIVELES_LOGRO.length}>
                    {c.texto}
                  </th>
                ))}
              </tr>
              <tr>
                {s.criterios.flatMap((_, i) =>
                  NIVELES_LOGRO.map((n) => (
                    <th key={`${i}-${n}`} className={cx(th, 'w-12 text-center text-[11px]')}>
                      {n}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ALUMNOS }, (_, i) => (
                <tr key={i}>
                  <td className={cx(td, 'py-1 text-center')}>{i + 1}</td>
                  <td className={cx(td, 'py-1')} />
                  {s.criterios.flatMap((_, j) => NIVELES_LOGRO.map((n) => <td key={`${j}-${n}`} className={cx(td, 'py-1')} />))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}

// ---------- Word ----------

const ESTILO_WORD: Record<string, string> = {
  table: 'border-collapse:collapse;width:100%;margin:4pt 0;',
  th: 'border:1px solid #000;padding:4pt;background:#e8e3f5;text-align:left;vertical-align:top;font-size:10pt;',
  td: 'border:1px solid #000;padding:4pt;vertical-align:top;font-size:10pt;',
  h2: 'font-size:16pt;text-align:center;margin:4pt 0;',
  h3: 'font-size:12pt;margin:10pt 0 4pt;',
  h4: 'font-size:11pt;margin:6pt 0 2pt;text-decoration:underline;',
  p: 'margin:2pt 0;font-size:11pt;',
  li: 'font-size:11pt;margin:1pt 0;',
}

/** La hoja tal como se ve (con lo que el docente corrigió) en un .doc que Word abre y deja editar. */
function aWord(hoja: HTMLElement, titulo: string) {
  const copia = hoja.cloneNode(true) as HTMLElement
  copia.querySelectorAll('button, .print\\:hidden').forEach((n) => n.remove())
  copia.querySelectorAll('[data-salto]').forEach((n) => n.setAttribute('style', 'page-break-before:always;'))
  copia.querySelectorAll<HTMLElement>('*').forEach((n) => {
    n.removeAttribute('contenteditable')
    n.removeAttribute('spellcheck')
    n.removeAttribute('class')
    const extra = ESTILO_WORD[n.tagName.toLowerCase()]
    if (extra) n.setAttribute('style', extra + (n.getAttribute('style') ?? ''))
  })
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${titulo.replace(/</g, '')}</title>
<style>@page{size:21cm 29.7cm;margin:2cm}body{font-family:Arial,sans-serif;font-size:11pt}</style></head>
<body>${copia.innerHTML}</body></html>`
  return new Blob(['﻿', html], { type: 'application/msword' })
}

const archivo = (titulo: string) =>
  `sesion-${titulo
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)}.doc`

// ---------- La vista ----------

const ATAJOS: { vista: Vista; texto: string; icono: typeof Music }[] = [
  { vista: 'cancion', texto: 'Agrega una canción para esta sesión', icono: Music },
  { vista: 'juego', texto: 'Agrega un juego para esta sesión', icono: Gamepad2 },
  { vista: 'examen', texto: 'Agrega un examen para esta sesión', icono: FileText },
]

export function Sesion() {
  const { ficha, resultados, guardar, creditos, avisar, ir } = useStore()
  const { ocupado, generar } = useGeneracion()
  const sesion = resultados.sesion
  const [opciones, setOpciones] = useState<OpcionesSesion>(sesion?.opciones ?? { duracion: ficha?.duracion?.startsWith('90') ? 90 : 45 })
  const [error, setError] = useState<string | null>(null)
  const [otra, setOtra] = useState(false)
  const hoja = useRef<HTMLDivElement>(null)
  const gradoId = ficha?.gradoId ?? 'primaria-1'
  const cur = useCurriculo(gradoId.split('-')[0] as Nivel, gradoId, ficha?.areaId ?? 'matematica')
  const area = cur.estado === 'listo' ? cur.area : null

  if (!ficha) return <SinTema />

  async function crear() {
    setError(null)
    const fallo = { texto: '' }
    const nueva = await generar(COSTOS.sesion, 'Sesión de aprendizaje', () =>
      api.generarSesion(ficha!, opciones).catch((e: unknown) => {
        fallo.texto = e instanceof Error ? e.message : 'No pudimos crear la sesión.'
        throw e
      }),
    )
    if (nueva) guardar('sesion', nueva)
    else if (fallo.texto) setError(fallo.texto)
  }

  function bajarWord() {
    if (hoja.current && sesion) void descargar(aWord(hoja.current, sesion.titulo), archivo(sesion.titulo), avisar)
  }

  if (!sesion) {
    return (
      <>
        <EncabezadoHerramienta id="sesion" />
        <ElegirOpciones opciones={opciones} cambiar={setOpciones} />
        <div className="flex flex-col items-start gap-2">
          <Boton tam="lg" variante="herramienta" herramienta="sesion" onClick={crear} cargando={ocupado}>
            <Sparkles className="size-5" aria-hidden /> Crear mi sesión
          </Boton>
          <p className="text-sm text-ink-soft">Con competencia, criterios, momentos, ficha para el alumno y escala de valoración. La descargas en Word.</p>
          <NotaCreditos n={COSTOS.sesion} quedan={creditos} />
        </div>
        {ocupado && <Avance />}
        {error && !ocupado && <Fallo texto={error} reintentar={crear} />}
      </>
    )
  }

  return (
    <>
      <EncabezadoHerramienta id="sesion" />

      <BarraHoja>
        <Boton variante="herramienta" herramienta="sesion" onClick={bajarWord} disabled={ocupado}>
          <Download className="size-5" aria-hidden /> Descargar en Word
        </Boton>
        <Boton variante="contorno" onClick={() => imprimir(avisar)} disabled={ocupado} aria-label="Imprimir">
          <Printer className="size-5" aria-hidden /> <span className="hidden sm:inline">Imprimir</span>
        </Boton>
        <Boton variante="contorno" onClick={() => setOtra(true)} cargando={ocupado}>
          {!ocupado && <RefreshCw className="size-5" aria-hidden />} Otra versión
        </Boton>
      </BarraHoja>
      <p className="-mt-3 text-sm text-ink-soft print:hidden">Si algo no te convence, haz clic sobre el texto y corrígelo. Lo que cambies sale en el Word y al imprimir.</p>

      {/* Si la otra versión falla, el aviso sale arriba de la hoja, donde se está mirando. */}
      {error && !ocupado && <Fallo texto={error} reintentar={crear} />}
      {ocupado ? (
        <Avance />
      ) : (
        <Hoja>
          <div ref={hoja} key={`${sesion.titulo}-${sesion.opciones.duracion}`}>
            <HojaSesion s={sesion} area={area} />
          </div>
        </Hoja>
      )}

      <section className="flex flex-col gap-3 print:hidden">
        <h2 className="font-display text-2xl font-bold">Completa tu sesión</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ATAJOS.map(({ vista, texto, icono: Icono }) => (
            <button
              key={vista}
              type="button"
              onClick={() => ir(vista)}
              className="flex items-center gap-3 rounded-2xl border-2 border-line bg-surface p-4 text-left font-medium transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <Icono className="size-6 shrink-0" style={{ color: `var(--${vista})` }} aria-hidden />
              {texto}
            </button>
          ))}
        </div>
      </section>

      <Ventana abierta={otra} cerrar={() => setOtra(false)} titulo="Otra versión de tu sesión">
        <ElegirOpciones opciones={opciones} cambiar={setOpciones} />
        <div className="flex flex-col items-start gap-2">
          <Boton
            tam="lg"
            variante="herramienta"
            herramienta="sesion"
            onClick={() => {
              setOtra(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
              void crear()
            }}
          >
            Crear otra versión
          </Boton>
          <NotaCreditos n={COSTOS.sesion} quedan={creditos} />
        </div>
      </Ventana>
    </>
  )
}
