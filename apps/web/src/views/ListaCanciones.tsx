// Las canciones del tema en una sola lista, para proyectar en clase o mandar al grupo de WhatsApp de las familias.
// Solo videos de YouTube: los del canal de Supermentes y los de otros canales van juntos; el canal dice de quién es.
// Cada una trae su "i" con el desempeño oficial del grado que trabaja, citado tal cual.
import { BadgeCheck, Copy, ExternalLink, Play, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Ficha } from '../api'
import { useStore } from '../app/store'
import { cancionesDelTema, useCanciones, type CancionExistente } from '../canciones/catalogo'
import { Boton, Desplegable } from '../components/ui'
import { ubicarCita } from '../curriculo/citas'
import { useCurriculo } from '../curriculo/cargar'
import { nivelDe } from '../curriculo/catalogo'
import { Bloque, BotonInfo, Cita, useSustento, type Sustento } from './SustentoJuego'

const enlace = (id: string) => `https://youtu.be/${id}`

/** Por qué la canción cumple el currículo: lo que abarca el tema y la parte exacta del desempeño que trabaja. */
function SustentoCancion({ c, s, ficha }: { c: CancionExistente; s: Sustento | null; ficha: Ficha }) {
  const { verCurriculo } = useStore()
  const cur = useCurriculo(nivelDe(ficha.gradoId), ficha.gradoId, c.area)
  const cita = c.grados[ficha.gradoId]
  const u = cur.estado === 'listo' && cur.area && cita ? ubicarCita(cur.area, cita) : null
  const mismoDesempeno = !!u && u.desempeno === s?.tema.desempeno?.desempeno
  return (
    <div className="flex flex-col gap-3 text-sm leading-snug">
      <div>
        <p className="text-base font-semibold">Por qué cumple el Currículo Nacional</p>
        <p className="text-ink-soft">
          {s?.tema.area ?? ficha.area} · {s?.grado ?? ficha.grado}
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
        {c.resumen}
        {u && <Cita u={u} cita={cita} />}
        {u && (
          <span className="mt-1.5 flex items-start gap-1.5 font-medium text-ok">
            <BadgeCheck className="mt-px size-4 shrink-0" aria-hidden />
            {mismoDesempeno
              ? 'Es justo lo resaltado del desempeño del tema.'
              : c.area === ficha.areaId
                ? `Es justo lo resaltado, de la competencia «${u.competencia}» del mismo grado.`
                : `Es justo lo resaltado, de ${cur.estado === 'listo' && cur.area ? cur.area.nombre : 'otro curso'} (competencia «${u.competencia}») del mismo grado.`}
          </span>
        )}
      </Bloque>
      <p className="border-t border-line pt-2 text-xs text-ink-soft">
        Texto copiado tal cual del programa curricular (MINEDU); la cita se verifica letra por letra.{' '}
        <button type="button" onClick={() => verCurriculo(ficha.gradoId, c.area)} className="underline underline-offset-2 hover:text-ink">
          Ver en el currículo
        </button>
      </p>
    </div>
  )
}

/** El video en grande, para proyectarlo en el aula. */
function Ver({ c, cerrar }: { c: CancionExistente; cerrar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialogo.current?.showModal()
  }, [])
  return (
    <dialog
      ref={dialogo}
      onClose={cerrar}
      onClick={(e) => e.target === dialogo.current && cerrar()}
      aria-label={c.titulo}
      className="m-auto w-[min(64rem,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-black p-0 text-white backdrop:bg-black/70"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="min-w-0 truncate font-semibold">{c.titulo}</p>
        <button type="button" onClick={cerrar} className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Cerrar">
          <X className="size-5" />
        </button>
      </div>
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${c.id}?autoplay=1&rel=0`}
          title={c.titulo}
          className="size-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    </dialog>
  )
}

function Tarjeta({ c, s, ficha, ver }: { c: CancionExistente; s: Sustento | null; ficha: Ficha; ver: () => void }) {
  const { avisar } = useStore()
  async function copiar() {
    try {
      await navigator.clipboard.writeText(`${c.titulo}: ${enlace(c.id)}`)
      avisar('Link copiado. Pégalo en el grupo de WhatsApp de las familias.', 'ok')
    } catch {
      avisar(`No se pudo copiar. El link es ${enlace(c.id)}`, 'error')
    }
  }
  return (
    <li className="relative flex flex-col rounded-2xl border border-line bg-surface">
      <button type="button" onClick={ver} className="group relative aspect-video w-full overflow-hidden rounded-t-2xl bg-surface-2" aria-label={`Ver «${c.titulo}»`}>
        <img src={`https://i.ytimg.com/vi/${c.id}/mqdefault.jpg`} alt="" loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
        <span className="absolute inset-0 grid place-items-center bg-black/10 transition group-hover:bg-black/25">
          <span className="grid size-12 place-items-center rounded-full text-on-tool shadow-lg" style={{ background: 'var(--cancion)' }}>
            <Play className="ml-0.5 size-5" aria-hidden />
          </span>
        </span>
        {c.duracion && <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white tabular-nums">{c.duracion}</span>}
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="line-clamp-2 font-semibold leading-snug">{c.titulo}</p>
        <p className="text-sm text-ink-soft">
          {c.canal}
          {c.idioma === 'en' && ' · en inglés'}
        </p>
        <p className="line-clamp-2 text-sm">{c.resumen}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          <Boton tam="sm" variante="herramienta" herramienta="cancion" onClick={ver}>
            <Play className="size-4" aria-hidden /> Ver
          </Boton>
          <Boton tam="sm" variante="contorno" onClick={copiar}>
            <Copy className="size-4" aria-hidden /> Copiar link
          </Boton>
          <a
            href={enlace(c.id)}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg p-2 text-ink-soft hover:bg-surface-2 hover:text-ink"
            aria-label={`Abrir «${c.titulo}» en YouTube`}
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
      <BotonInfo etiqueta={`Por qué «${c.titulo}» cumple el Currículo Nacional`} className="absolute right-2.5 top-2.5 z-10">
        <SustentoCancion c={c} s={s} ficha={ficha} />
      </BotonInfo>
    </li>
  )
}

/** Las canciones del tema; si el tema no tiene, las del mismo grado y curso. */
export function ListaCanciones({ ficha }: { ficha: Ficha }) {
  const todas = useCanciones()
  const s = useSustento(ficha, { fuente: 'tema' })
  const [viendo, setViendo] = useState<CancionExistente | null>(null)
  if (!todas) return null
  const { delTema, otras } = cancionesDelTema(todas, ficha)
  if (!delTema.length && !otras.length) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-5 py-4 text-ink-soft">
        Todavía no tenemos canciones de {ficha.area} para {ficha.grado}. Estamos subiendo canciones de cada tema a nuestro canal.
      </p>
    )
  }

  const videos = (lista: CancionExistente[]) => lista.map((c) => <Tarjeta key={c.id} c={c} s={s} ficha={ficha} ver={() => setViendo(c)} />)
  const rejilla = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
  return (
    <section className="flex flex-col gap-4">
      <p className="text-ink-soft">
        {delTema.length
          ? 'Proyéctalas en clase o manda el link al grupo de las familias. La «i» dice qué parte del currículo trabaja cada una.'
          : `No encontramos una canción justo de «${ficha.titulo}». Estas son de ${ficha.area} para ${ficha.grado}:`}
      </p>
      <ul className={rejilla}>{videos(delTema.length ? delTema : otras)}</ul>
      {delTema.length > 0 && otras.length > 0 && (
        <Desplegable titulo={`Más canciones de ${ficha.area} para ${ficha.grado} (${otras.length})`}>
          <ul className={rejilla}>{videos(otras)}</ul>
        </Desplegable>
      )}
      {viendo && <Ver c={viendo} cerrar={() => setViendo(null)} />}
    </section>
  )
}
