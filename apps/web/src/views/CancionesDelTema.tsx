// Las dos canciones del banco para el tema (banco/banco.ts): con ritmos del Perú, la letra lista y su "i" con la
// parte exacta del desempeño oficial que trabajan. Como en una app de música: ▶ la hace sonar ahí mismo
// (api/audio.ts) y tocar la tarjeta abre la letra.
import { BadgeCheck, LoaderCircle, Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api, COSTOS, textoCosto, type AudioCancion, type Ficha } from '../api'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { cancionDelBanco, type CancionBanco, type TemaBanco } from '../banco/banco'
import { ubicarCita } from '../curriculo/citas'
import { useCurriculo } from '../curriculo/cargar'
import { nivelDe } from '../curriculo/catalogo'
import { Bloque, BotonInfo, Cita, useSustento } from './SustentoJuego'

const COLOR = 'var(--cancion)'

function SustentoBanco({ tema, ficha }: { tema: TemaBanco; ficha: Ficha }) {
  const { verCurriculo } = useStore()
  const s = useSustento(ficha, { fuente: 'tema' })
  const cur = useCurriculo(nivelDe(ficha.gradoId), ficha.gradoId, ficha.areaId)
  const u = cur.estado === 'listo' && cur.area ? ubicarCita(cur.area, tema.cita, tema.competencia) : null
  const mismoDesempeno = !!u && u.desempeno === s?.tema.desempeno?.desempeno
  return (
    <div className="flex flex-col gap-3 text-sm leading-snug">
      <div>
        <p className="text-base font-semibold">Por qué cumple el Currículo Nacional</p>
        <p className="text-ink-soft">
          {ficha.area} · {s?.grado ?? ficha.grado}
        </p>
      </div>
      {s && (
        <Bloque titulo="El tema abarca">
          La competencia <strong>«{s.tema.competencia}»</strong>
          {s.tema.desempeno && !mismoDesempeno ? ', con este desempeño oficial del grado:' : '.'}
          {s.tema.desempeno && !mismoDesempeno && <Cita u={s.tema.desempeno} />}
        </Bloque>
      )}
      <Bloque titulo="La canción abarca">
        Cantan «{ficha.titulo}» con las palabras clave del tema.
        {u && <Cita u={u} cita={tema.cita} />}
        {u && (
          <span className="mt-1.5 flex items-start gap-1.5 font-medium text-ok">
            <BadgeCheck className="mt-px size-4 shrink-0" aria-hidden />
            {mismoDesempeno ? 'Es justo lo resaltado del desempeño del tema.' : `Es justo lo resaltado, de la competencia «${u.competencia}» del mismo grado.`}
          </span>
        )}
      </Bloque>
      <p className="border-t border-line pt-2 text-xs text-ink-soft">
        Texto copiado tal cual del programa curricular (MINEDU); la cita se verifica letra por letra.{' '}
        <button type="button" onClick={() => verCurriculo(ficha.gradoId, ficha.areaId)} className="underline underline-offset-2 hover:text-ink">
          Ver en el currículo
        </button>
      </p>
    </div>
  )
}

/** Las primeras líneas del coro, para reconocer la canción de un vistazo. */
function coroDe(letra: string[]) {
  const i = letra.findIndex((l) => /^\[coro/i.test(l))
  return letra.slice(i + 1).filter((l) => !l.startsWith('[')).slice(0, 2)
}

/** Las barras que suben y bajan mientras suena, como en cualquier app de música. */
function Sonando() {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0, 0.25, 0.1, 0.35].map((d, i) => (
        <span key={i} className="h-full w-[3px] origin-bottom rounded-full" style={{ background: COLOR, animation: `onda 0.8s ease-in-out ${d}s infinite` }} />
      ))}
    </span>
  )
}

// El audio ya creado de cada canción: volver a tocarla no lo pide (ni lo cobra) otra vez.
const audios = new Map<string, AudioCancion>()
const clave = (c: CancionBanco) => `${c.titulo}|${c.ritmo}`

export function CancionesDelTema({ tema, ficha }: { tema: TemaBanco; ficha: Ficha }) {
  const { guardar, avisar } = useStore()
  const { generar } = useGeneracion()
  const [sonando, setSonando] = useState<number | null>(null)
  const [cargando, setCargando] = useState<number | null>(null)
  const reproductor = useRef<HTMLAudioElement | null>(null)
  const reloj = useRef<number>(0)

  function parar() {
    reproductor.current?.pause()
    reproductor.current = null
    window.clearTimeout(reloj.current)
    setSonando(null)
  }
  useEffect(() => parar, [])

  async function alternar(i: number) {
    if (sonando === i) return parar()
    parar()
    const c = tema.canciones[i]
    let a = audios.get(clave(c))
    if (!a) {
      setCargando(i)
      a = (await generar(COSTOS.audio, 'Audio', () => api.generarAudio(cancionDelBanco(c)))) ?? undefined
      setCargando(null)
      if (!a) return
      audios.set(clave(c), a)
    }
    if (a.url) {
      const r = new Audio(a.url)
      r.onended = () => setSonando(null)
      r.onerror = () => {
        setSonando(null)
        avisar('No se pudo reproducir el audio. Vuelve a intentarlo.', 'error')
      }
      reproductor.current = r
      // Tras esperar la música, el iPhone a veces no deja sonar sin otro toque: se avisa en vez de quedar callado.
      r.play().catch(() => {
        setSonando(null)
        avisar('La canción está lista: toca ▶ otra vez para escucharla.')
      })
    } else {
      // Datos de ejemplo: no hay sonido, solo se ve que "suena" un rato.
      reloj.current = window.setTimeout(() => setSonando(null), 8000)
    }
    setSonando(i)
  }

  function abrir(i: number) {
    parar()
    const c = tema.canciones[i]
    guardar('cancion', cancionDelBanco(c))
    guardar('audio', audios.get(clave(c)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-2xl font-bold">Canciones de tu tema</h2>
        <p className="text-ink-soft">Listas para cantar en clase, con ritmos del Perú.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {tema.canciones.map((c, i) => (
          <li key={c.titulo} className="relative rounded-2xl border border-line bg-surface transition hover:bg-surface-2">
            <button type="button" onClick={() => abrir(i)} className="flex w-full flex-col gap-1 rounded-2xl py-4 pl-[4.75rem] pr-12 text-left" aria-label={`Ver la letra de «${c.titulo}»`}>
              <span className="font-display text-xl font-bold leading-tight">{c.titulo}</span>
              <span className="flex items-center gap-2 text-sm font-semibold capitalize" style={{ color: COLOR }}>
                {sonando === i && <Sonando />}
                {c.ritmo}
              </span>
              <span className="mt-1 flex flex-col font-display italic text-ink-soft">
                {coroDe(c.letra).map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </span>
            </button>
            <button
              type="button"
              onClick={() => void alternar(i)}
              disabled={cargando !== null}
              className="absolute left-4 top-4 grid size-12 place-items-center rounded-full text-on-tool shadow-md transition hover:scale-105 disabled:opacity-80"
              style={{ background: COLOR }}
              aria-label={sonando === i ? `Pausar «${c.titulo}»` : `Escuchar «${c.titulo}»`}
              title={sonando === i || audios.has(clave(c)) ? undefined : `Escuchar (la primera vez usa ${textoCosto(COSTOS.audio)})`}
            >
              {cargando === i ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : sonando === i ? <Pause className="size-5" aria-hidden /> : <Play className="ml-0.5 size-5" aria-hidden />}
            </button>
            <BotonInfo etiqueta={`Por qué «${c.titulo}» cumple el Currículo Nacional`} className="absolute right-2.5 top-2.5 z-10">
              <SustentoBanco tema={tema} ficha={ficha} />
            </BotonInfo>
          </li>
        ))}
      </ul>
    </section>
  )
}
