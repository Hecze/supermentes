// "¿Por qué cumple el currículo?": el icono "i" de cada juego. Con texto oficial del MINEDU dice qué competencia
// abarca el tema, qué hacen los alumnos en el juego y qué parte exacta del desempeño del grado practican.
// Pensado para leerse en voz alta en segundos, frente a un jurado o a un director.
import { BadgeCheck, Info, TriangleAlert } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Ficha } from '../api'
import { useStore, type Resultados } from '../app/store'
import { cx } from '../components/ui'
import { fundamento, normalizar } from '../curriculo/buscar'
import { useCurriculo, type AreaCurriculo } from '../curriculo/cargar'
import type { Nivel } from '../curriculo/catalogo'
import { ubicarCita, type Ubicacion } from '../curriculo/citas'
import { contenidoMatematica } from '../juegos/contenido'
import { habilidadPorId } from '../juegos/matematica/habilidades'
import { TextoMat, VisualDe } from '../juegos/motor/piezas'
import type { DefinicionJuego, Reto } from '../juegos/tipos'

type Fuente = NonNullable<Resultados['juegos']>

export type Sustento = {
  /** "4.º grado de primaria". */
  grado: string
  gradoId: string
  areaId: string
  /** "Programa Curricular de Educación Primaria". */
  programa: string
  /** La competencia del tema y su desempeño oficial (el que guardó al crearse). */
  tema: { area: string; competencia: string; desempeno: Ubicacion | null }
  fuente: 'tema' | 'calculo'
  /** Lo que se practica: "Fracciones: reconocer · Hasta octavos" o las palabras del tema. */
  practica: string
  ejemplo?: Reto
  palabras?: string[]
  /** El desempeño oficial que respalda lo que se practica; en cálculo, con la parte exacta que se cita. */
  desempeno: (Ubicacion & { cita?: string }) | null
  /** En cálculo: la práctica es de la misma competencia que el tema, o justo de su mismo desempeño. */
  mismaCompetencia: boolean
  mismoDesempeno: boolean
  /** En cálculo, si el nivel no es del grado del tema: los grados donde sí lo pide el currículo. */
  otrosGrados?: string
}

/** "3.º y 4.º de primaria", "Inicial 5 años y 1.º de primaria". */
export function textoGrados(grados: string[]) {
  const partes: string[] = []
  for (const nivel of ['inicial', 'primaria', 'secundaria']) {
    const ns = grados.filter((g) => g.startsWith(nivel)).map((g) => g.split('-')[1])
    if (!ns.length) continue
    if (nivel === 'inicial') partes.push(`Inicial ${ns.join(' y ')} años`)
    else partes.push(`${ns.map((n) => `${n}.º`).join(' y ')} de ${nivel}`)
  }
  return partes.join(' y ')
}

const nivelDe = (gradoId: string) => gradoId.split('-')[0] as Nivel

const raices = (t: string) => new Set(normalizar(t).split(/[^a-z0-9]+/).filter((p) => p.length > 4).map((p) => p.slice(0, 5)))

/**
 * El desempeño del tema: el que guardó al crearse, tal cual. Un tema sin desempeños guardados usa el de su
 * competencia que más palabras comparte con la ficha; si ninguno se parece de verdad, no se inventa uno.
 */
function desempenoDelTema(area: AreaCurriculo, ficha: Ficha, competencia: string): Ubicacion | null {
  for (const d of ficha.curriculo.desempenos ?? []) {
    const u = ubicarCita(area, d)
    if (u) return u
  }
  const c = area.competencias.find((x) => normalizar(x.nombre) === normalizar(competencia))
  if (!c) return null
  const claves = raices([ficha.titulo, ...ficha.conceptos, ...ficha.vocabulario.map((v) => v.palabra)].join(' '))
  const puntos = (d: string) => [...raices(d)].filter((r) => claves.has(r)).length
  const mejor = [...c.desempenos].sort((a, b) => puntos(b) - puntos(a))[0]
  return mejor && puntos(mejor) >= 2 ? ubicarCita(area, mejor) : null
}

/** Arma el sustento con los datos oficiales del grado: el área del tema y, para cálculo, Matemática. */
export function useSustento(ficha: Ficha | null, fuente: Fuente): Sustento | null {
  const gradoId = ficha?.gradoId ?? 'primaria-1'
  const delTema = useCurriculo(nivelDe(gradoId), gradoId, ficha?.areaId ?? 'matematica')
  const mate = useCurriculo(nivelDe(gradoId), gradoId, 'matematica')

  return useMemo(() => {
    if (!ficha || delTema.estado !== 'listo' || !delTema.area) return null
    const area = delTema.area
    const i = area.competencias.findIndex((c) => normalizar(c.nombre) === normalizar(ficha.curriculo.competencia))
    const f = fundamento(area, ficha.titulo, undefined, i >= 0 ? i : undefined)
    const temaDesempeno = desempenoDelTema(area, ficha, f.competencia)
    const base = {
      grado: delTema.grado.nombre,
      gradoId: ficha.gradoId,
      areaId: ficha.areaId,
      programa: delTema.fuente.titulo,
      tema: { area: area.nombre, competencia: temaDesempeno?.competencia ?? f.competencia, desempeno: temaDesempeno },
    }

    if (fuente.fuente === 'tema') {
      return {
        ...base,
        fuente: 'tema' as const,
        practica: `las palabras y preguntas de «${ficha.titulo}»`,
        palabras: ficha.vocabulario.slice(0, 5).map((v) => v.palabra),
        desempeno: null,
        mismaCompetencia: true,
        mismoDesempeno: true,
      }
    }

    const h = habilidadPorId(fuente.habilidad)
    const n = h?.niveles[fuente.nivel]
    if (!h || !n) return null
    const cita = n.citas[ficha.gradoId]
    const areaMate = mate.estado === 'listo' ? mate.area : null
    const u = cita && areaMate ? ubicarCita(areaMate, cita) : null
    return {
      ...base,
      fuente: 'calculo' as const,
      practica: `${h.nombre} · ${n.nombre}`,
      ejemplo: contenidoMatematica(fuente, 3)?.retos[0],
      desempeno: u ? { ...u, cita } : null,
      mismaCompetencia: !!u && area.id === 'matematica' && normalizar(u.competencia) === normalizar(base.tema.competencia),
      mismoDesempeno: !!u && area.id === 'matematica' && u.desempeno === temaDesempeno?.desempeno,
      otrosGrados: u ? undefined : textoGrados(n.grados),
    }
  }, [delTema, mate, ficha, fuente])
}

// ---------- Botón "i" con su ventanita ----------

const ANCHO = 400

/** Se abre al pasar el mouse o al enfocarlo con el teclado; un clic (o un toque en el celular) la deja fija. */
export function BotonInfo({ etiqueta, children, chip, className }: { etiqueta: string; children: ReactNode; chip?: boolean; className?: string }) {
  const [abierto, setAbierto] = useState<'paso' | 'fijo' | null>(null)
  const [lugar, setLugar] = useState({ izquierda: 0, ancho: ANCHO })
  const caja = useRef<HTMLDivElement>(null)
  const id = useId()

  function abrir(como: 'paso' | 'fijo') {
    const r = caja.current?.getBoundingClientRect()
    if (r) {
      // Hacia la izquierda del icono si cabe; si no, corrida lo justo para no tapar el menú ni salirse de la pantalla.
      const ancho = Math.min(ANCHO, window.innerWidth - 32)
      const minimo = (caja.current?.closest('main')?.getBoundingClientRect().left ?? 0) + 8
      const maximo = window.innerWidth - 16 - ancho
      const x = Math.max(Math.min(r.right - ancho, maximo), Math.min(minimo, maximo))
      setLugar({ izquierda: x - r.left, ancho })
    }
    setAbierto((a) => (a === 'fijo' ? 'fijo' : como))
  }
  const cerrarPaso = () => setAbierto((a) => (a === 'paso' ? null : a))

  useEffect(() => {
    if (abierto !== 'fijo') return
    const fuera = (e: PointerEvent) => !caja.current?.contains(e.target as Node) && setAbierto(null)
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(null)
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  return (
    <div
      ref={caja}
      className={cx(className ?? 'relative', 'inline-flex')}
      // Abierta, queda encima de las tarjetas vecinas y de sus iconos.
      style={abierto ? { zIndex: 50 } : undefined}
      onMouseEnter={() => abrir('paso')}
      onMouseLeave={cerrarPaso}
      onBlur={(e) => !caja.current?.contains(e.relatedTarget as Node) && cerrarPaso()}
    >
      <button
        type="button"
        aria-expanded={!!abierto}
        aria-controls={id}
        aria-label={chip ? undefined : etiqueta}
        onFocus={() => abrir('paso')}
        onClick={(e) => {
          e.stopPropagation()
          if (abierto === 'fijo') setAbierto(null)
          else abrir('fijo')
        }}
        className={cx(
          'inline-flex items-center gap-1.5 transition',
          chip
            ? 'rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium hover:bg-surface-2'
            : 'size-9 justify-center rounded-full bg-white/95 text-[#2b2d5c] shadow-md ring-1 ring-black/10 hover:scale-110',
        )}
      >
        <Info className={chip ? 'size-4 text-ok' : 'size-5'} aria-hidden />
        {chip && etiqueta}
      </button>
      {abierto && (
        <div id={id} role="dialog" aria-label={etiqueta} className="absolute top-full z-40 pt-2" style={{ left: lugar.izquierda, width: lugar.ancho }}>
          <div className="entrar rounded-2xl border border-line bg-surface p-4 text-left text-ink shadow-2xl">{children}</div>
        </div>
      )}
    </div>
  )
}

// ---------- Lo que se lee ----------

/** El desempeño oficial, con la parte citada resaltada. Si es largo, se muestra el inicio y la parte citada. */
function Desempeno({ texto, desde, cita }: { texto: string; desde: number; cita?: string }) {
  if (!cita) {
    const corto = texto.length > 300 ? `${texto.slice(0, texto.lastIndexOf(' ', 290))} …` : texto
    return <>«{corto}»</>
  }
  const fin = desde + cita.length
  const dosPuntos = texto.indexOf(':')
  const cabeza = dosPuntos > 0 && dosPuntos < 150 ? texto.slice(0, dosPuntos + 1) : texto.slice(0, texto.lastIndexOf(' ', 80))
  // Lo que viene antes de la cita: si está lejos del inicio, se salta con "…" hasta el comienzo de su frase.
  const frase = Math.max(texto.lastIndexOf('. ', desde - 1), texto.lastIndexOf(': ', desde - 1)) + 2
  const desdeFrase = desde - frase <= 80 ? frase : texto.indexOf(' ', desde - 50) + 1
  const antes = desde <= cabeza.length + 60 ? texto.slice(0, desde) : `${cabeza} … ${texto.slice(desdeFrase, desde)}`
  const despues = texto.length - fin <= 90 ? texto.slice(fin) : `${texto.slice(fin, texto.lastIndexOf(' ', fin + 80))} …`
  return (
    <>
      «{antes}
      <mark className="rounded bg-[#ffe08a] px-0.5 font-semibold not-italic text-[#2b2d5c]">{cita}</mark>
      {despues}»
    </>
  )
}

function Ejemplo({ r }: { r: Reto }) {
  return (
    <span className="whitespace-nowrap">
      {r.visual && (
        <span className="inline-flex align-middle">
          <VisualDe visual={r.visual} tam="1.9em" />
        </span>
      )}{' '}
      {r.pregunta ? <TextoMat texto={r.pregunta} /> : !r.visual && r.consigna}
      {' → '}
      <strong>
        <TextoMat texto={r.respuesta} />
      </strong>
    </span>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{titulo}</p>
      <div>{children}</div>
    </div>
  )
}

/** Desempeño oficial con su número; en cálculo, con la parte que se practica resaltada. */
function Cita({ u, cita }: { u: Ubicacion; cita?: string }) {
  return (
    <blockquote className="mt-1 border-l-4 border-[#ffd23f] pl-3 italic text-ink">
      <Desempeno texto={u.desempeno} desde={cita ? u.desde : 0} cita={cita} />
      <span className="mt-0.5 block text-xs not-italic text-ink-soft">
        Competencia {u.numeroCompetencia}, desempeño {u.numeroDesempeno}
      </span>
    </blockquote>
  )
}

/** El argumento completo, para leerlo en voz alta: qué abarca el tema y qué abarca el juego, con texto oficial. */
export function ContenidoSustento({ s, def }: { s: Sustento; def?: DefinicionJuego }) {
  const { verCurriculo } = useStore()
  const d = s.desempeno
  // En cálculo, si el juego practica una parte del mismo desempeño del tema, se muestra una sola vez, resaltada.
  const temaConCita = s.fuente === 'calculo' && d && s.mismoDesempeno
  return (
    <div className="flex flex-col gap-3 text-sm leading-snug">
      <div>
        <p className="text-base font-semibold">Por qué cumple el Currículo Nacional</p>
        <p className="text-ink-soft">
          {s.tema.area} · {s.grado}
        </p>
      </div>

      <Bloque titulo="El tema abarca">
        La competencia <strong>«{s.tema.competencia}»</strong>
        {s.tema.desempeno ? ', con este desempeño oficial del grado:' : '.'}
        {temaConCita ? <Cita u={d} cita={d.cita} /> : s.tema.desempeno && <Cita u={s.tema.desempeno} />}
      </Bloque>

      <Bloque titulo="El juego abarca">
        {def && (
          <>
            En <strong>{def.nombre}</strong>, {def.accion}.{' '}
          </>
        )}
        Practican{' '}
        <strong>
          <TextoMat texto={s.practica} />
        </strong>
        {s.ejemplo && (
          <>
            , por ejemplo: <Ejemplo r={s.ejemplo} />
          </>
        )}
        {s.palabras?.length ? <>: {s.palabras.join(', ')}…</> : '.'}
        {s.fuente === 'tema' && <span className="mt-1 block text-ink-soft">Salen de la ficha del tema, que se armó con ese desempeño.</span>}
        {d && !temaConCita && <Cita u={d} cita={d.cita} />}
        {d && (
          <span className="mt-1.5 flex items-start gap-1.5 font-medium text-ok">
            <BadgeCheck className="mt-px size-4 shrink-0" aria-hidden />
            {temaConCita
              ? 'Es justo lo resaltado del desempeño del tema.'
              : s.mismaCompetencia
                ? 'Es justo lo resaltado, de la misma competencia del tema.'
                : `Es justo lo resaltado, de la competencia «${d.competencia}» del mismo grado.`}
          </span>
        )}
        {s.fuente === 'calculo' && !d && s.otrosGrados && (
          <span className="mt-1.5 flex items-start gap-1.5 rounded-xl bg-warn/12 p-2.5 font-medium text-warn">
            <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden />
            Este nivel no figura en los desempeños de {s.grado}: el currículo lo pide en {s.otrosGrados}. Úsalo como repaso o reto.
          </span>
        )}
      </Bloque>

      <p className="border-t border-line pt-2 text-xs text-ink-soft">
        Texto copiado tal cual del {s.programa} (MINEDU)
        {s.fuente === 'calculo' && d ? '; cada cita se verifica letra por letra' : ''}.{' '}
        <button type="button" onClick={() => verCurriculo(s.gradoId, s.fuente === 'calculo' ? 'matematica' : s.areaId)} className="underline underline-offset-2 hover:text-ink">
          Ver en el currículo
        </button>
      </p>
    </div>
  )
}

/** El icono "i" listo para una tarjeta de juego o para la pantalla del juego. */
export function InfoCurricular({ sustento, def, chip, className }: { sustento: Sustento | null; def?: DefinicionJuego; chip?: boolean; className?: string }) {
  if (!sustento) return null
  return (
    <BotonInfo etiqueta={chip ? 'Por qué cumple el currículo' : `Por qué ${def ? `«${def.nombre}»` : 'este juego'} cumple el Currículo Nacional`} chip={chip} className={className}>
      <ContenidoSustento s={sustento} def={def} />
    </BotonInfo>
  )
}
