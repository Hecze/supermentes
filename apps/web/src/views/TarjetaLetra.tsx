// Una canción del banco (banco/banco.ts) en la misma lista que las de YouTube y con la misma tarjeta: por ahora es
// la letra, con ritmo del Perú y su "i" con la parte exacta del desempeño oficial que trabaja. Cuando esté en el canal
// de YouTube de Supermentes, tendrá su video (obsidian/CANCIONES.md).
import { BadgeCheck, Copy, FileText, Music } from 'lucide-react'
import type { Ficha } from '../api'
import { useStore } from '../app/store'
import { cancionDelBanco, type TemaBanco } from '../banco/banco'
import { textoDeLetra } from '../canciones/letra'
import { Boton, tinte } from '../components/ui'
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

export function TarjetaLetra({ tema, i, ficha, abrir }: { tema: TemaBanco; i: number; ficha: Ficha; abrir: () => void }) {
  const { avisar } = useStore()
  const c = tema.canciones[i]
  const cancion = cancionDelBanco(c)
  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoDeLetra(cancion))
      avisar('Letra copiada. Pégala en el grupo de WhatsApp de las familias.', 'ok')
    } catch {
      avisar('No se pudo copiar. Abre la letra y cópiala a mano.', 'error')
    }
  }
  return (
    <li className="relative flex flex-col rounded-2xl border border-line bg-surface">
      <button
        type="button"
        onClick={abrir}
        className="relative flex aspect-video w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-t-2xl px-6 text-center transition hover:brightness-95"
        style={{ background: tinte(COLOR, 12) }}
        aria-label={`Ver la letra de «${c.titulo}»`}
      >
        <Music className="mb-1.5 size-6" style={{ color: COLOR }} aria-hidden />
        {coroDe(c.letra).map((l) => (
          <span key={l} className="font-display text-lg italic leading-snug">
            {l}
          </span>
        ))}
        <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-medium text-white">Letra</span>
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="line-clamp-2 font-semibold leading-snug">{c.titulo}</p>
        <p className="text-sm text-ink-soft">Supermentes</p>
        <p className="line-clamp-2 text-sm">Para cantar «{ficha.titulo}» con ritmo de {cancion.opciones.ritmo.toLowerCase()}.</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          <Boton tam="sm" variante="herramienta" herramienta="cancion" onClick={abrir}>
            <FileText className="size-4" aria-hidden /> Ver la letra
          </Boton>
          <Boton tam="sm" variante="contorno" onClick={() => void copiar()}>
            <Copy className="size-4" aria-hidden /> Copiar letra
          </Boton>
        </div>
      </div>
      <BotonInfo etiqueta={`Por qué «${c.titulo}» cumple el Currículo Nacional`} className="absolute right-2.5 top-2.5 z-10">
        <SustentoBanco tema={tema} ficha={ficha} />
      </BotonInfo>
    </li>
  )
}
