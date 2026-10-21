// Sesión de aprendizaje: el documento que el docente presenta, con las partes y el orden de las sesiones de primaria
// que publica el MINEDU (sesion/plantilla.ts; qué sesión respalda cada parte, en obsidian/SESION.md). Se corrige con un
// clic, se imprime y se descarga en Word.
import { BadgeCheck, BookmarkCheck, Download, ExternalLink, Printer, SlidersHorizontal, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useDatosDocumento, type DatosDocumento } from '../app/documento'
import { useStore } from '../app/store'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { BarraHoja, Boton, Chip, Editable, Hoja, Pregunta, Ventana, cx, descargar, imprimir, tinte } from '../components/ui'
import { useCurriculo, type AreaCurriculo } from '../curriculo/cargar'
import type { Nivel } from '../curriculo/catalogo'
import { ubicarCita } from '../curriculo/citas'
import { useContextoSesion } from '../sesion/contexto'
import { ENFOQUES } from '../sesion/enfoques'
import { NIVELES_ESCALA, REFLEXIONES, opcionesIniciales, sesionPlantilla } from '../sesion/plantilla'
import { useRecordadas, type Recordadas } from '../sesion/recordar'
import { FORMATO_SESION, type Momento, type OpcionesSesion, type Precision, type Sesion as TipoSesion } from '../sesion/tipos'
import { BotonInfo, Cita } from './SustentoJuego'

const COLOR = 'var(--sesion)'
const ALUMNOS = 30

// ---------- Opciones ----------

function ElegirOpciones({ opciones, cambiar }: { opciones: OpcionesSesion; cambiar: (o: OpcionesSesion) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <Pregunta titulo="¿Cuánto dura tu clase?">
        <div className="flex flex-wrap gap-2">
          {([45, 90] as const).map((d) => (
            <Chip key={d} grande activo={opciones.duracion === d} color={COLOR} onClick={() => cambiar({ ...opciones, duracion: d })}>
              {d} min
            </Chip>
          ))}
        </div>
      </Pregunta>
      <Pregunta titulo="Enfoque transversal">
        <p className="-mt-2 text-sm text-ink-soft">Elige el de tu unidad. La actitud que se observa sale tal cual del Currículo Nacional.</p>
        <div className="flex flex-wrap gap-2">
          {ENFOQUES.map((e, i) => (
            <Chip key={e.nombre} activo={opciones.enfoque === i} color={COLOR} onClick={() => cambiar({ ...opciones, enfoque: i })}>
              {e.nombre.replace(/^Enfoque /, '')}
            </Chip>
          ))}
        </div>
      </Pregunta>
    </div>
  )
}

/** «90 min y Enfoque ambiental», para decirle a la docente qué se recuerda. */
const resumen = (o: OpcionesSesion) => `${o.duracion} min y ${ENFOQUES[o.enfoque].nombre}`

/** Sobre la hoja: lo que pidió recordar para sus próximas sesiones, con cómo cambiarlo u olvidarlo. */
function Recordado({ recordadas, ajustar, olvidar }: { recordadas: Recordadas; ajustar: () => void; olvidar: () => void }) {
  if (recordadas.estado === 'error') {
    return (
      <p role="status" className="-mt-3 text-sm text-ink-soft print:hidden">
        {recordadas.mensaje}
      </p>
    )
  }
  if (recordadas.estado !== 'listo' || !recordadas.opciones) return null
  return (
    <p className="-mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft print:hidden">
      <span className="inline-flex items-center gap-1.5">
        <BookmarkCheck className="size-4 shrink-0" style={{ color: COLOR }} aria-hidden />
        Tus sesiones empiezan con lo que pediste recordar: <strong className="text-ink">{resumen(recordadas.opciones)}</strong>.
      </span>
      <button type="button" onClick={ajustar} className="font-medium text-ink underline underline-offset-4">
        Cambiar
      </button>
      <button type="button" onClick={olvidar} className="font-medium text-ink underline underline-offset-4">
        Olvidar
      </button>
    </p>
  )
}

// ---------- La hoja ----------

/** Celda de tabla: en pantalla con borde suave. */
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

/** Inicio, desarrollo o cierre, con su tiempo aproximado y sus pasos por agrupamiento. */
function Momentos({ nombre, m }: { nombre: string; m: Momento }) {
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-3 first:border-t-0 first:pt-0">
      <h4 className="flex flex-wrap items-baseline justify-between gap-x-4 font-bold">
        {nombre}
        <span className="font-normal">Tiempo aproximado: {m.minutos} min</span>
      </h4>
      {m.bloques.map((b, i) => (
        <div key={i} className="flex flex-col gap-1">
          <p className="font-semibold italic">{b.titulo}</p>
          <Lista items={b.pasos} />
        </div>
      ))}
    </div>
  )
}

/** El "i" de cada desempeño: el texto oficial y de qué competencia es. */
function InfoDesempeno({ area, desempeno }: { area: AreaCurriculo | null; desempeno: string }) {
  const { verCurriculo, ficha } = useStore()
  const u = area ? ubicarCita(area, desempeno) : null
  if (!u || !ficha) return null
  return (
    <BotonInfo etiqueta="Desempeño" chip className="relative mt-1 print:hidden">
      <div className="flex flex-col gap-2 text-sm leading-snug">
        <p className="text-base font-semibold">Por qué cumple el Currículo Nacional</p>
        <p>
          Es un desempeño oficial de {ficha.grado} de la competencia <strong>«{u.competencia}»</strong>:
        </p>
        <Cita u={u} cita={desempeno} />
        <p className="flex items-start gap-1.5 font-medium text-ok">
          <BadgeCheck className="mt-px size-4 shrink-0" aria-hidden /> Está copiado tal cual del currículo.
        </p>
        <button type="button" onClick={() => verCurriculo(ficha.gradoId, ficha.areaId)} className="self-start text-xs text-ink-soft underline underline-offset-2 hover:text-ink">
          Ver en el currículo
        </button>
      </div>
    </BotonInfo>
  )
}

function HojaSesion({ s, area, doc }: { s: TipoSesion; area: AreaCurriculo | null; doc: DatosDocumento }) {
  return (
    <div className="flex flex-col gap-5 text-[15px] leading-relaxed">
      {/* El logo en la columna izquierda y el colegio a su derecha. Es una tabla sin bordes para que el .docx
          (lib/docx.ts) la arme igual. */}
      <header className="flex flex-col gap-3">
        <table data-sin-bordes className="w-full border-collapse">
          <tbody>
            <tr>
              {doc.logo && (
                <td className="w-24 pr-3 align-middle">
                  <img src={doc.logo} alt="" className="size-24 object-contain" />
                </td>
              )}
              <td className="text-center align-middle">
                {doc.institucion && <p className="font-semibold">{doc.institucion}</p>}
                <p className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Sesión de aprendizaje</p>
              </td>
              {doc.logo && <td className="w-24" aria-hidden />}
            </tr>
          </tbody>
        </table>
        <table data-sin-bordes className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="align-top">Grado: {s.grado}</td>
              <td className="text-right align-top">
                <Editable como="span">Unidad didáctica ___ - sesión ___</Editable>
              </td>
            </tr>
          </tbody>
        </table>
        <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">
          Título: <Editable como="span">{s.titulo}</Editable>
        </h2>
      </header>

      <section className="flex flex-col gap-2">
        <Titulo>1. Propósitos y evidencias de aprendizaje</Titulo>
        {/* Sin scroll horizontal: recortaría la ventanita del desempeño. En el celular las palabras se cortan con
            guion para que la tabla quepa y la página no se deslice de lado. */}
        <table className="w-full border-collapse text-sm max-sm:hyphens-auto max-sm:[&_*]:[overflow-wrap:anywhere]">
          <thead>
            <tr>
              <th className={th}>Competencias/capacidades</th>
              <th className={th}>Desempeños</th>
              <th className={th}>¿Qué nos dará evidencias de aprendizaje?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cx(td, 'w-[28%]')}>
                <p className="font-semibold">{s.competencia}</p>
                <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
                  {s.capacidades.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </td>
              <td className={cx(td, 'w-[44%]')}>
                <ul className="flex list-disc flex-col gap-2 pl-4">
                  {s.desempenos.map((d) => (
                    <li key={d}>
                      {d}
                      <div>
                        <InfoDesempeno area={area} desempeno={d} />
                      </div>
                    </li>
                  ))}
                </ul>
              </td>
              <td className={td}>
                <Editable>{s.evidencia}</Editable>
                <p className="mt-2 font-semibold">{s.instrumento}</p>
              </td>
            </tr>
          </tbody>
        </table>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={th}>Enfoques transversales</th>
              <th className={th}>Actitudes o acciones observables</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cx(td, 'w-[28%]')}>{s.enfoque.nombre}</td>
              <td className={td}>
                <Editable como="span">{s.enfoque.actitudes}</Editable>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-2">
        <Titulo>2. Preparación de la sesión</Titulo>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={th}>¿Qué necesitamos hacer antes de la sesión?</th>
              <th className={th}>¿Qué recursos o materiales se utilizarán en esta sesión?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cx(td, 'w-1/2')}>
                <Lista items={s.preparacion.antes} />
              </td>
              <td className={td}>
                <Lista items={s.preparacion.recursos} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex flex-col gap-3">
        <Titulo>3. Momentos de la sesión</Titulo>
        <Momentos nombre="Inicio" m={s.inicio} />
        <Momentos nombre="Desarrollo" m={s.desarrollo} />
        <Momentos nombre="Cierre" m={s.cierre} />
      </section>

      <section className="flex flex-col gap-2">
        <Titulo>4. Reflexiones sobre el aprendizaje</Titulo>
        <Lista items={REFLEXIONES} />
      </section>

      <section className="flex flex-col gap-2 border-t-2 border-dashed border-line pt-5 print:break-before-page print:border-0 print:pt-0" data-salto>
        <Titulo>Anexo 1</Titulo>
        <p className="font-semibold">Escala de valoración para la competencia «{s.competencia}»</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr>
                <th className={cx(th, 'w-48')}>Desempeños del grado</th>
                {s.desempenos.map((d) => (
                  <th key={d} className={cx(th, 'font-normal')} colSpan={NIVELES_ESCALA.length}>
                    {d}
                  </th>
                ))}
              </tr>
              <tr>
                <th className={th}>Nombres y apellidos</th>
                {s.desempenos.flatMap((d) =>
                  NIVELES_ESCALA.map((n) => (
                    <th key={`${d}-${n}`} className={cx(th, 'w-14 text-center text-[11px]')}>
                      {n}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ALUMNOS }, (_, i) => (
                <tr key={i}>
                  <td className={cx(td, 'py-1')}>{i + 1}.</td>
                  {s.desempenos.flatMap((d) => NIVELES_ESCALA.map((n) => <td key={`${d}-${n}`} className={cx(td, 'py-1')} />))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

/** Nombre del .docx de la hoja tal como se ve (con lo que el docente corrigió; ver lib/docx.ts). */
const archivo = (titulo: string) =>
  `sesion-${titulo
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)}.docx`

const AVISOS: Record<Exclude<Precision, 'ejemplo'>, string> = {
  'otro-nivel':
    'el MINEDU no tiene en línea sesiones de ejemplo de secundaria, así que el desarrollo sigue a las de primaria del mismo curso. Revísalo antes de presentarla.',
  general: 'para este curso y competencia no encontramos una sesión de ejemplo del MINEDU, así que el desarrollo es general. Revísalo antes de presentarla.',
}

/** Sobre la hoja: qué sesión del MINEDU sigue y, si no hay una de su nivel o de su curso, el aviso «formato impreciso». */
function Fuente({ s }: { s: TipoSesion }) {
  const ver = s.ejemplos[0] && (
    <a href={s.ejemplos[0]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-ink underline underline-offset-4">
      Ver una sesión del MINEDU <ExternalLink className="size-3.5" aria-hidden />
    </a>
  )
  if (s.precision !== 'ejemplo') {
    return (
      <p role="status" className="flex items-start gap-2 rounded-2xl bg-warn/12 px-4 py-3 text-warn print:hidden">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
        <span>
          <strong>Formato impreciso:</strong> {AVISOS[s.precision]} {ver}
        </span>
      </p>
    )
  }
  return (
    <p className="-mt-3 text-sm text-ink-soft print:hidden">
      Ya está armada con tu tema, con las partes de las sesiones que publica el MINEDU. Corrige cualquier texto con un clic. {ver}
    </p>
  )
}

// ---------- La vista ----------

export function Sesion() {
  const { ficha, resultados, guardar, avisar } = useStore()
  const doc = useDatosDocumento(ficha)
  // Una sesión guardada con las partes de antes se vuelve a armar.
  const sesion = resultados.sesion?.formato === FORMATO_SESION ? resultados.sesion : undefined
  const [opciones, setOpciones] = useState<OpcionesSesion>(() => sesion?.opciones ?? opcionesIniciales(ficha))
  const [otra, setOtra] = useState(false)
  const [version, setVersion] = useState(0)
  const hoja = useRef<HTMLDivElement>(null)
  const gradoId = ficha?.gradoId ?? 'primaria-1'
  const cur = useCurriculo(gradoId.split('-')[0] as Nivel, gradoId, ficha?.areaId ?? 'matematica')
  const area = cur.estado === 'listo' ? cur.area : null
  const contexto = useContextoSesion(ficha)
  // Lo que la docente pidió recordar (duración y enfoque): con eso empieza una sesión nueva.
  const { recordadas, recordar: recordarOpciones, olvidar: olvidarOpciones } = useRecordadas()
  const deMemoria = recordadas.estado === 'listo' ? recordadas.opciones : null
  const esperandoMemoria = !sesion && recordadas.estado === 'cargando'
  const [recordar, setRecordar] = useState(false)

  // La sesión se arma sola con el tema, sus desempeños y lo que ya hay del tema: no usa la IA.
  useEffect(() => {
    if (!ficha || sesion || cur.estado === 'cargando' || !contexto || esperandoMemoria) return
    if (deMemoria) setOpciones(deMemoria)
    guardar('sesion', sesionPlantilla(ficha, deMemoria ?? opciones, area, contexto))
  }, [ficha, sesion, cur.estado, area, contexto, opciones, guardar, esperandoMemoria, deMemoria])

  if (!ficha) return <SinTema />

  // Mientras se descarga lo del tema o lo recordado (un instante) no se muestra una sesión a medias.
  const actual = sesion ?? (contexto && !esperandoMemoria ? sesionPlantilla(ficha, deMemoria ?? opciones, area, contexto) : null)
  if (!actual) return <EncabezadoHerramienta id="sesion" />

  function ajustar() {
    setRecordar(deMemoria !== null)
    setOtra(true)
  }

  async function olvidar() {
    const r = await olvidarOpciones()
    avisar(r.ok ? 'Listo: ya no lo recordamos. Tus próximas sesiones empiezan con lo de siempre.' : r.mensaje, r.ok ? 'ok' : 'error')
  }

  async function aplicar() {
    if (contexto) guardar('sesion', sesionPlantilla(ficha!, opciones, area, contexto))
    setVersion((v) => v + 1)
    setOtra(false)
    // Solo si lo pidió: guardar lo nuevo, o olvidar lo que había si desmarcó «Recordar».
    if (recordar) {
      const r = await recordarOpciones(opciones)
      avisar(r.ok ? `Listo: tus próximas sesiones empezarán con ${resumen(opciones)}.` : r.mensaje, r.ok ? 'ok' : 'error')
    } else if (deMemoria) {
      await olvidar()
    }
  }

  const bajarWord = async () => {
    if (!hoja.current) return
    // Un .docx de verdad (lo abren Word, LibreOffice y Google Docs), con el logo del colegio adentro.
    const { hojaADocx } = await import('../lib/docx')
    void descargar(await hojaADocx(hoja.current, actual.titulo), archivo(actual.titulo), avisar)
  }

  return (
    <>
      <EncabezadoHerramienta id="sesion" />

      <BarraHoja>
        <Boton variante="herramienta" herramienta="sesion" onClick={bajarWord}>
          <Download className="size-5" aria-hidden /> Descargar en Word
        </Boton>
        <Boton variante="contorno" onClick={() => imprimir(avisar)} aria-label="Imprimir">
          <Printer className="size-5" aria-hidden /> <span className="hidden sm:inline">Imprimir</span>
        </Boton>
        <Boton variante="contorno" onClick={ajustar}>
          <SlidersHorizontal className="size-5" aria-hidden /> Ajustar
        </Boton>
      </BarraHoja>
      <Fuente s={actual} />
      <Recordado recordadas={recordadas} ajustar={ajustar} olvidar={olvidar} />

      <Hoja>
        <div ref={hoja} key={`${actual.opciones.duracion}-${actual.opciones.enfoque}-${version}`}>
          <HojaSesion s={actual} area={area} doc={doc} />
        </div>
      </Hoja>

      <Ventana abierta={otra} cerrar={() => setOtra(false)} titulo="Ajusta tu sesión">
        <ElegirOpciones opciones={opciones} cambiar={setOpciones} />
        {(recordadas.estado === 'listo' || recordadas.estado === 'error') && (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4">
            <input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="mt-1 size-5 shrink-0" style={{ accentColor: COLOR }} />
            <span>
              <span className="font-semibold">Recordar para mis próximas sesiones</span>
              <span className="block text-sm text-ink-soft">Tus sesiones nuevas empezarán con esta duración y este enfoque. Lo puedes cambiar u olvidar cuando quieras.</span>
            </span>
          </label>
        )}
        <div className="flex flex-col items-start gap-2">
          <Boton tam="lg" variante="herramienta" herramienta="sesion" onClick={aplicar}>
            Aplicar cambios
          </Boton>
          <p className="text-sm text-ink-soft">Se arma al instante. Lo que hayas corregido a mano en la hoja se reemplaza.</p>
        </div>
      </Ventana>
    </>
  )
}
