// Inicio: lo primero que ve la docente. El buscador de temas, temas de su grado listos con un clic, cómo les va
// a sus alumnos en los juegos que mandó y sus temas recientes. Nada de pantallas vacías.
import { ChevronRight, FileCheck, Gamepad2, Lightbulb, Music, Search, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useCuenta } from '../app/cuenta'
import { usePerfil } from '../app/perfil'
import { cuando, useStore } from '../app/store'
import { DOCENTE } from '../api/ejemplos'
import { tieneBanco } from '../banco/banco'
import { sugerenciasDelGrado } from '../components/NuevoTema'
import { cx } from '../components/ui'
import { GRADOS_CURRICULO, nivelDe } from '../curriculo/catalogo'
import { useCurriculo } from '../curriculo/cargar'
import { cargarResultados, type FilaResultado } from '../juegos/compartir/resultados'
import { useEnviados } from './ResultadosJuegos'

const CLAVE_GRADO = 'supermentes-grado'
const PRIMARIA = GRADOS_CURRICULO.filter((g) => g.nivel === 'primaria')

function gradoGuardado() {
  try {
    const g = localStorage.getItem(CLAVE_GRADO)
    return g && GRADOS_CURRICULO.some((x) => x.id === g) ? g : 'primaria-4'
  } catch {
    return 'primaria-4'
  }
}

const COLORES: Record<string, string> = {
  comunicacion: 'var(--cancion)',
  matematica: 'var(--examen)',
  'ciencia-y-tecnologia': 'var(--juego)',
  'personal-social': 'var(--crucigrama)',
}

function TemasDelGrado({ gradoId }: { gradoId: string }) {
  const { abrirNuevoTema } = useStore()
  const cur = useCurriculo(nivelDe(gradoId), gradoId)
  const temas = cur.estado === 'listo' ? sugerenciasDelGrado(cur.grado).filter((_, i) => i % 2 === 0) : []
  const corto = GRADOS_CURRICULO.find((g) => g.id === gradoId)?.corto ?? ''
  const listos = temas.length > 0 && temas.every((t) => tieneBanco(t.gradoId, t.areaId))

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Para tu clase de {corto}</h2>
        <p className="text-ink-soft">
          {listos ? 'Cada tema ya trae juego, canción y examen. Un clic y lo usas.' : 'Un clic y preparamos juego, canción y examen del tema.'}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {temas.map((t) => (
          <button
            key={`${t.areaId}-${t.tema}`}
            type="button"
            onClick={() => abrirNuevoTema({ texto: t.tema, gradoId: t.gradoId, areaId: t.areaId, indiceCompetencia: t.indiceCompetencia })}
            className="group flex flex-col items-start gap-3 rounded-2xl border-2 border-line bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
          >
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ color: COLORES[t.areaId], background: `color-mix(in srgb, ${COLORES[t.areaId]} 12%, transparent)` }}>
              {t.area}
            </span>
            <span className="font-display text-xl font-bold leading-tight">{t.tema}</span>
            <span className="mt-auto flex items-center gap-2 text-sm text-ink-soft">
              <Gamepad2 className="size-4 text-juego" aria-hidden />
              <Music className="size-4 text-cancion" aria-hidden />
              <FileCheck className="size-4 text-examen" aria-hidden />
              {tieneBanco(t.gradoId, t.areaId) ? 'Listo' : 'En segundos'}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

// ponytail: cada envío es una lectura de /api/resultados (cuenta para el límite de Blob); por eso solo los 3 más recientes.
const ENVIOS_A_LEER = 3

function TusAlumnos() {
  const { ir } = useStore()
  const envios = useEnviados()
  const recientes = useMemo(() => envios.slice(0, ENVIOS_A_LEER), [envios])
  const [filas, setFilas] = useState<{ tema: string; filas: FilaResultado[] }[] | null>(null)

  useEffect(() => {
    if (!recientes.length) return
    let vivo = true
    Promise.all(recientes.map((e) => cargarResultados(e).then((f) => ({ tema: e.tema, filas: f }), () => ({ tema: e.tema, filas: [] })))).then(
      (r) => vivo && setFilas(r),
    )
    return () => {
      vivo = false
    }
  }, [recientes])

  const todas = filas?.flatMap((f) => f.filas) ?? []
  const alumnos = new Set(todas.map((f) => f.id)).size
  const promedio = todas.length ? todas.reduce((s, f) => s + f.mejor.estrellas, 0) / todas.length : 0
  const flojo = (filas ?? [])
    .filter((f) => f.filas.length > 0)
    .map((f) => ({ tema: f.tema, prom: f.filas.reduce((s, x) => s + x.mejor.estrellas, 0) / f.filas.length }))
    .sort((a, b) => a.prom - b.prom)[0]

  return (
    <section className="flex flex-col gap-4 rounded-2xl border-2 border-line bg-surface p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
        <Trophy className="size-6 text-juego" aria-hidden /> Cómo les va a tus alumnos
      </h2>
      {!envios.length ? (
        <p className="text-ink-soft">Cuando mandes un juego al WhatsApp de las familias, aquí verás quién jugó y cuántas estrellas sacó.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              [filas ? String(alumnos) : '…', alumnos === 1 ? 'alumno jugó' : 'alumnos jugaron'],
              [filas ? `${promedio.toLocaleString('es-PE', { maximumFractionDigits: 1 })} ★` : '…', 'estrellas en promedio'],
              [String(envios.length), envios.length === 1 ? 'juego mandado' : 'juegos mandados'],
            ].map(([n, l]) => (
              <div key={l} className="flex flex-col rounded-xl bg-surface-2 p-3">
                <span className="font-display text-3xl font-bold tabular-nums">{n}</span>
                <span className="text-sm text-ink-soft">{l}</span>
              </div>
            ))}
          </div>
          {flojo && flojo.prom < 2 && (
            <p className="flex items-start gap-2 rounded-xl bg-warn/10 px-3 py-2.5">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
              En «{flojo.tema}» sacaron menos estrellas. Conviene repasarlo en clase.
            </p>
          )}
          <button type="button" onClick={() => ir('resultados')} className="inline-flex items-center gap-1 self-start font-medium underline underline-offset-4">
            Ver quién jugó <ChevronRight className="size-4" aria-hidden />
          </button>
        </>
      )}
    </section>
  )
}

function Recientes() {
  const { temas, elegirTema } = useStore()
  if (!temas.length) return null
  return (
    <section className="flex flex-col gap-2 rounded-2xl border-2 border-line bg-surface p-5 sm:p-6">
      <h2 className="font-display text-2xl font-bold">Tus temas recientes</h2>
      <ul className="flex flex-col">
        {temas.slice(0, 5).map((t) => (
          <li key={t.id} className="border-t border-line first:border-t-0">
            <button type="button" onClick={() => elegirTema(t.id)} className="group flex w-full items-center gap-3 py-3 text-left">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{t.titulo}</span>
                <span className="text-sm text-ink-soft">
                  {t.grado} · {t.area} · {cuando(t.fecha)}
                </span>
              </span>
              <ChevronRight className="size-5 text-ink-soft transition group-hover:translate-x-0.5" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Inicio() {
  const { abrirNuevoTema, temas } = useStore()
  const { nombre } = useCuenta()
  const { perfil } = usePerfil()
  const [gradoId, setGradoId] = useState(gradoGuardado)

  function elegirGrado(id: string) {
    setGradoId(id)
    try {
      localStorage.setItem(CLAVE_GRADO, id)
    } catch {
      // Sin almacenamiento el grado dura esta visita.
    }
  }

  return (
    <>
      <header className="flex flex-col gap-4">
        <p className="text-lg text-ink-soft">Hola, {perfil?.nombre ?? (nombre ? `profe ${nombre}` : DOCENTE.saludo)} 👋</p>
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">¿Qué tema toca mañana?</h1>
        <button
          type="button"
          onClick={() => abrirNuevoTema({ gradoId })}
          className="flex w-full items-center gap-3 rounded-2xl border-2 border-ink bg-surface px-5 py-4 text-left text-lg text-ink-soft transition hover:shadow-md"
        >
          <Search className="size-6 shrink-0 text-ink" aria-hidden />
          <span className="truncate">Escribe tu tema: fracciones, los refranes, el ciclo del agua…</span>
        </button>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Tu grado">
          <span className="text-ink-soft">Tu grado:</span>
          {PRIMARIA.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => elegirGrado(g.id)}
              aria-pressed={g.id === gradoId}
              className={cx(
                'rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition',
                g.id === gradoId ? 'border-primary bg-primary text-primary-ink' : 'border-line bg-surface hover:border-ink-soft',
              )}
            >
              {g.corto}
            </button>
          ))}
        </div>
      </header>

      <TemasDelGrado gradoId={gradoId} />

      <div className={cx('grid gap-4', temas.length > 0 && 'lg:grid-cols-[1fr_26rem]')}>
        <TusAlumnos />
        <Recientes />
      </div>
    </>
  )
}
