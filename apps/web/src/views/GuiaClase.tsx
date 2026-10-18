// Guía de la clase: qué hace el docente minuto a minuto con el material que ya tiene (canción, juego, examen…).
// Se arma sin IA: los tiempos salen de reglas fijas y, si ya hay sesión, de sus minutos de inicio, desarrollo y cierre.
// Siempre suman la duración elegida.
import { Printer } from 'lucide-react'
import { useState } from 'react'
import type { Ficha, HerramientaId } from '../api'
import { HERRAMIENTAS } from '../app/herramientas'
import { useStore } from '../app/store'
import { useBanco } from '../banco/banco'
import { BarraHoja, Boton, Chip, Hoja, imprimir } from '../components/ui'

type Paso = { texto: string; ir?: HerramientaId }

/** Reparte `total` minutos desde `desde` según los pesos; redondea acumulado para que los tramos sumen exacto. */
function tramos(desde: number, total: number, pesos: number[]) {
  const suma = pesos.reduce((a, b) => a + b, 0)
  let acc = 0
  return pesos.map((p) => {
    const ini = desde + Math.round((total * acc) / suma)
    acc += p
    return [ini, desde + Math.round((total * acc) / suma)] as const
  })
}

export function GuiaClase({ ficha }: { ficha: Ficha }) {
  const { resultados, ir, avisar } = useStore()
  const banco = useBanco(ficha)
  const sesion = resultados.sesion
  const [duracion, setDuracion] = useState<45 | 90>(sesion?.opciones.duracion ?? (ficha.duracion?.startsWith('90') ? 90 : 45))
  const largo = duracion === 90
  const [cancion1, cancion2] = banco?.canciones.map((c) => c.titulo) ?? [resultados.cancion?.titulo]

  const momentos: { nombre: string; pasos: (Paso | false)[] }[] = [
    {
      nombre: 'Inicio',
      pasos: [
        { texto: cancion1 ? `Canta «${cancion1}» con la clase.` : 'Canta una canción del tema con la clase.', ir: 'cancion' },
        { texto: `Pregunta qué saben de «${ficha.titulo}» y cuéntales qué aprenderán hoy.` },
      ],
    },
    {
      nombre: 'Desarrollo',
      pasos: [
        { texto: ficha.conceptos[0] ? `Explica con un ejemplo del aula: ${ficha.conceptos[0]}` : 'Explica el tema con un ejemplo del aula.' },
        { texto: 'Jueguen el Concurso en el proyector, todos a la vez.', ir: 'juego' },
        largo && { texto: 'Resuelvan el crucigrama en parejas.', ir: 'crucigrama' },
        { texto: 'Cada uno resuelve el examen en su carpeta.', ir: 'examen' },
      ],
    },
    {
      nombre: 'Cierre',
      pasos: [
        largo && !!cancion2 && { texto: `Canten «${cancion2}» para repasar.`, ir: 'cancion' },
        { texto: 'Pregunta: «¿Qué aprendimos hoy? ¿Qué fue lo más difícil?».' },
        { texto: 'Manda el juego al WhatsApp de las familias para practicar en casa.', ir: 'juego' },
      ],
    },
  ]
  // Con sesión, los momentos duran lo mismo que en ella (en proporción si cambió la duración).
  const pesos = sesion ? [sesion.minutos.inicio, sesion.minutos.desarrollo, sesion.minutos.cierre] : [20, 65, 15]
  const bloques = tramos(0, duracion, pesos)

  return (
    <section className="flex flex-col gap-4">
      <div className="print:hidden">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Guía de la clase</h2>
        <p className="text-ink-soft">
          Qué hacer minuto a minuto con tu material.{sesion && ' Va con los tiempos de tu sesión.'}
        </p>
      </div>
      <BarraHoja>
        {([45, 90] as const).map((d) => (
          <Chip key={d} activo={duracion === d} onClick={() => setDuracion(d)}>
            {d} min
          </Chip>
        ))}
        <Boton variante="contorno" onClick={() => imprimir(avisar)} aria-label="Imprimir">
          <Printer className="size-5" aria-hidden /> <span className="hidden sm:inline">Imprimir</span>
        </Boton>
      </BarraHoja>
      <Hoja>
        <h3 className="font-display text-xl font-bold">Guía de la clase · {duracion} minutos</h3>
        {momentos.map((m, i) => {
          const [ini, fin] = bloques[i]
          const pasos = m.pasos.filter((p): p is Paso => !!p)
          const minutos = tramos(ini, fin - ini, pasos.map(() => 1))
          return (
            <div key={m.nombre} className="flex flex-col gap-2">
              <h4 className="font-semibold">
                {m.nombre} · {fin - ini} min
              </h4>
              <ol className="flex flex-col divide-y divide-line rounded-xl border border-line">
                {pasos.map((p, j) => {
                  const h = p.ir && HERRAMIENTAS[p.ir]
                  return (
                    <li key={j} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 print:break-inside-avoid">
                      <span className="w-24 shrink-0 whitespace-nowrap font-semibold tabular-nums">
                        {minutos[j][0]}–{minutos[j][1]} min
                      </span>
                      <span className="min-w-0 flex-1 basis-60">{p.texto}</span>
                      {h && (
                        <Boton variante="contorno" onClick={() => ir(h.id)}>
                          <h.icono className="size-5" style={{ color: h.color }} aria-hidden /> Abrir {h.nombre.toLowerCase()}
                        </Boton>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          )
        })}
      </Hoja>
    </section>
  )
}
