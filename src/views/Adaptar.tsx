import { BookOpen, Check, Coffee, Eye, Hand, Lightbulb, MessagesSquare, PenLine, PieChart, Printer, Scale, Timer, type LucideProps } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { api, COSTOS, type Necesidad } from '../api'
import { useStore } from '../app/store'
import { useGeneracion } from '../app/useGeneracion'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Acciones, Boton, Desplegable, Editable, Generando, Hoja, NotaCreditos, Pregunta, cx, imprimir, tinte } from '../components/ui'

const COLOR = 'var(--adaptar)'

// Primero lo que el docente observa en el aula; el nombre técnico va después, en pequeño.
const NECESIDADES: { id: Necesidad; titulo: string; nombre: string }[] = [
  { id: 'tdah', titulo: 'Le cuesta concentrarse', nombre: 'TDAH' },
  { id: 'dislexia', titulo: 'Le cuesta leer', nombre: 'Dislexia' },
  { id: 'tea', titulo: 'Necesita rutinas y apoyos visuales', nombre: 'TEA' },
  { id: 'facil', titulo: 'Necesita textos más simples', nombre: 'Lectura fácil' },
]

// Pictogramas provisionales. En producción se reemplazan por los de ARASAAC.
const PICTOS: Record<string, ComponentType<LucideProps>> = {
  saludar: Hand,
  leer: BookOpen,
  escribir: PenLine,
  dibujar: PieChart,
  comparar: Scale,
  pausa: Coffee,
  compartir: MessagesSquare,
}

function Picto({ clave, texto }: { clave: string; texto: string }) {
  const Icono = PICTOS[clave] ?? Lightbulb
  return (
    <span className="flex w-16 shrink-0 flex-col items-center gap-1">
      <span className="grid size-12 place-items-center rounded-xl border-2 bg-surface" style={{ borderColor: COLOR, color: COLOR }}>
        <Icono className="size-6" aria-hidden />
      </span>
      <span className="text-center text-xs font-semibold leading-tight">{texto}</span>
    </span>
  )
}

function ElegirNecesidades({ elegidas, cambiar }: { elegidas: Necesidad[]; cambiar: (n: Necesidad[]) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {NECESIDADES.map((n) => {
        const activa = elegidas.includes(n.id)
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => cambiar(activa ? elegidas.filter((x) => x !== n.id) : [...elegidas, n.id])}
            aria-pressed={activa}
            className="flex items-center gap-3 rounded-2xl border-2 bg-surface p-4 text-left transition hover:bg-surface-2"
            style={{ borderColor: activa ? COLOR : 'var(--line)', background: activa ? tinte(COLOR, 8) : undefined }}
          >
            <span
              className="grid size-6 shrink-0 place-items-center rounded-md border-2"
              style={{ borderColor: activa ? COLOR : 'var(--line)', background: activa ? COLOR : undefined }}
              aria-hidden
            >
              {activa && <Check className="size-4 text-on-tool" />}
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-medium">{n.titulo}</span>
              <span className="text-sm text-ink-soft">{n.nombre}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function Adaptar() {
  const { ficha, resultados, guardar, avisar, creditos } = useStore()
  const { ocupado, generar } = useGeneracion()
  const adaptacion = resultados.adaptacion
  const [elegidas, setElegidas] = useState<Necesidad[]>(adaptacion?.necesidades ?? [])
  const [original, setOriginal] = useState(false)
  const [hechos, setHechos] = useState<Set<number>>(new Set())

  if (!ficha) return <SinTema />

  const material = resultados.examen ? `el examen "${resultados.examen.titulo}"` : 'la ficha de tu tema'

  async function crear() {
    const nueva = await generar(COSTOS.adaptacion, 'Versión adaptada', () => api.adaptar(ficha!, elegidas))
    if (nueva) guardar('adaptacion', nueva)
  }

  if (!adaptacion) {
    return (
      <>
        <EncabezadoHerramienta id="adaptar" />
        <Pregunta titulo="¿Qué necesita tu estudiante?">
          <p className="-mt-1 text-ink-soft">Puedes marcar varias. No hace falta poner su nombre.</p>
          <ElegirNecesidades elegidas={elegidas} cambiar={setElegidas} />
        </Pregunta>
        <div className="flex flex-col items-start gap-2">
          <Boton tam="lg" variante="herramienta" herramienta="adaptar" onClick={crear} cargando={ocupado} disabled={elegidas.length === 0}>
            Adaptar {material.startsWith('el examen') ? 'el examen' : 'mi material'}
          </Boton>
          <NotaCreditos n={COSTOS.adaptacion} quedan={creditos} />
        </div>
        {ocupado && <Generando texto="Adaptando las consignas y preparando consejos para el aula…" />}
      </>
    )
  }

  const tiene = (n: Necesidad) => adaptacion.necesidades.includes(n)

  return (
    <>
      <EncabezadoHerramienta id="adaptar" />

      {ocupado ? (
        <Generando texto="Preparando otra versión adaptada…" />
      ) : (
        <Hoja className={cx(tiene('dislexia') && 'text-lg leading-loose tracking-wide')}>
          <header className="flex flex-col gap-1">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{ficha.titulo.split(':')[0]}</h2>
            <p className="text-ink-soft">Nombre: ______________________</p>
          </header>

          {original && (
            <div className="rounded-xl bg-surface-2 p-4 text-base leading-normal tracking-normal text-ink-soft print:hidden">
              <p className="mb-1 font-semibold">Consigna original</p>
              {adaptacion.original}
            </div>
          )}

          {tiene('tea') && (
            <div className="flex flex-col gap-2">
              <p className="font-semibold">Hoy vamos a:</p>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {adaptacion.agenda.map((a) => (
                  <Picto key={a.texto} clave={a.picto} texto={a.texto} />
                ))}
              </div>
            </div>
          )}

          {tiene('tdah') && (
            <p className="inline-flex items-center gap-2 self-start rounded-full bg-surface-2 px-3 py-1 text-base">
              <Timer className="size-4" aria-hidden /> 5 minutos por paso
            </p>
          )}

          <ol className="flex flex-col gap-4">
            {adaptacion.pasos.flatMap((p, i) => {
              const texto = tiene('facil') ? p.textoFacil : p.texto
              const [primera, ...resto] = texto.split(' ')
              const item = (
                <li key={i} className="flex items-center gap-3">
                  {tiene('tea') && <Picto clave={p.picto} texto={p.picto[0].toUpperCase() + p.picto.slice(1)} />}
                  {tiene('tdah') && (
                    <input
                      id={`paso-${i}`}
                      type="checkbox"
                      checked={hechos.has(i)}
                      onChange={() => {
                        const s = new Set(hechos)
                        if (s.has(i)) s.delete(i)
                        else s.add(i)
                        setHechos(s)
                      }}
                      className="size-6 shrink-0 accent-[var(--adaptar)]"
                      aria-label={`Paso ${i + 1} hecho`}
                    />
                  )}
                  <Editable className={cx('flex-1', hechos.has(i) && 'text-ink-soft line-through')}>
                    {tiene('tdah') && <strong>Paso {i + 1}: </strong>}
                    {tiene('dislexia') ? <strong>{primera}</strong> : primera} {resto.join(' ')}
                  </Editable>
                </li>
              )
              return tiene('tdah') && i === 1
                ? [
                    item,
                    <li key="pausa" className="flex items-center gap-2 rounded-lg bg-ok/10 px-3 py-2 text-ok">
                      <Coffee className="size-5" aria-hidden /> Pausa: ponte de pie y estírate un minuto.
                    </li>,
                  ]
                : [item]
            })}
          </ol>
        </Hoja>
      )}

      <Acciones>
        <Boton variante="herramienta" herramienta="adaptar" onClick={() => imprimir(avisar)}>
          <Printer className="size-5" aria-hidden /> Imprimir
        </Boton>
        <Boton variante="contorno" onClick={() => setOriginal(!original)}>
          <Eye className="size-5" aria-hidden /> {original ? 'Ocultar original' : 'Ver original'}
        </Boton>
      </Acciones>

      <Desplegable titulo="Consejos para el aula">
        {adaptacion.necesidades.map((n) => (
          <div key={n} className="flex flex-col gap-2">
            <p className="font-semibold">{NECESIDADES.find((x) => x.id === n)?.titulo}</p>
            <ul className="flex flex-col gap-1.5">
              {adaptacion.consejos[n].map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="mt-2.5 size-1.5 shrink-0 rounded-full" style={{ background: COLOR }} aria-hidden />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className="rounded-xl bg-surface-2 p-3 text-sm text-ink-soft">
          Son orientaciones pedagógicas, no un diagnóstico. Coordina con el SAANEE, el área de psicología de tu colegio y la familia.
        </p>
      </Desplegable>

      <Desplegable titulo="Cambiar para quién es">
        <ElegirNecesidades elegidas={elegidas} cambiar={setElegidas} />
        <div className="flex flex-wrap items-center gap-3">
          <Boton onClick={crear} cargando={ocupado} disabled={elegidas.length === 0}>
            Crear otra versión
          </Boton>
          <NotaCreditos n={COSTOS.adaptacion} quedan={creditos} />
        </div>
      </Desplegable>
    </>
  )
}
