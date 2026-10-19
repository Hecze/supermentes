// Las dos letras del banco para el tema (banco/banco.ts): con ritmos del Perú y su "i" con la parte exacta del
// desempeño oficial que trabajan. Tocar la tarjeta abre la letra para cantar e imprimir. La música no se crea en la
// app: cuando esté el canal de YouTube, cada letra tendrá su video (obsidian/CANCIONES.md).
import { BadgeCheck, Music } from 'lucide-react'
import type { Ficha } from '../api'
import { useStore } from '../app/store'
import { cancionDelBanco, type TemaBanco } from '../banco/banco'
import { tinte } from '../components/ui'
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

export function CancionesDelTema({ tema, ficha }: { tema: TemaBanco; ficha: Ficha }) {
  const { guardar } = useStore()
  function abrir(i: number) {
    guardar('cancion', cancionDelBanco(tema.canciones[i]))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-2xl font-bold">Letras para cantar</h2>
        <p className="text-ink-soft">De tu tema, con ritmos del Perú. Ábrela para imprimirla o mandarla por WhatsApp.</p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {tema.canciones.map((c, i) => (
          <li key={c.titulo} className="relative rounded-2xl border border-line bg-surface transition hover:bg-surface-2">
            <button type="button" onClick={() => abrir(i)} className="flex w-full flex-col gap-1 rounded-2xl py-4 pl-[4.75rem] pr-12 text-left" aria-label={`Ver la letra de «${c.titulo}»`}>
              <span className="absolute left-4 top-4 grid size-12 place-items-center rounded-full" style={{ background: tinte(COLOR, 14), color: COLOR }} aria-hidden>
                <Music className="size-5" />
              </span>
              <span className="font-display text-xl font-bold leading-tight">{c.titulo}</span>
              <span className="text-sm font-semibold capitalize" style={{ color: COLOR }}>
                {c.ritmo}
              </span>
              <span className="mt-1 flex flex-col font-display italic text-ink-soft">
                {coroDe(c.letra).map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </span>
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
