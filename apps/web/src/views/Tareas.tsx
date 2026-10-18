// Tareas por salón (obsidian/TAREAS.md, capturas en demos/tareas/): asignar el Concurso a un salón (pantallas 1 y 1b)
// y revisarlo ya corregido, con qué reforzar (pantalla 5). El alumno la hace en alumno/Tarea.tsx.
import { ArrowLeft, CalendarDays, CalendarPlus, CircleAlert, Copy, FileDown, ListChecks, Lock, MessageCircle, Pencil, Presentation, Send, ShieldCheck, Target, Timer, Trophy, Users, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Ficha } from '../api'
import { tokenDeCuenta, useCuenta } from '../app/cuenta'
import { usePerfil } from '../app/perfil'
import { useStore, type Vista } from '../app/store'
import { Boton, cx, imprimir } from '../components/ui'
import type { Publicado } from '../juegos/compartir/publicado'
import { dia, enlaceTarea, nombreSalon, type Salon, type TareaRevisada } from '../juegos/compartir/tareas'

const VERDE = 'var(--juego)'
const MEDALLAS = ['🥇', '🥈', '🥉']

async function conCuenta<T>(ruta: string, cuerpo?: unknown): Promise<T> {
  const token = await tokenDeCuenta()
  const r = await fetch(ruta, {
    method: cuerpo ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  const datos = (await r.json().catch(() => ({}))) as T & { error?: string }
  if (!r.ok) throw new Error(datos.error ?? 'No pudimos conectarnos. Intenta de nuevo.')
  return datos
}

/** Lo mismo que calcula api/tareas.ts: 30 s en 1.º–2.º, 20 s en 3.º–4.º y 15 s desde 5.º. */
function segundosDe(grado: string) {
  const [nivel, n] = grado.split('-')
  if (nivel === 'primaria') return Number(n) <= 2 ? 30 : Number(n) <= 4 ? 20 : 15
  return nivel === 'secundaria' ? 15 : 30
}

/** El viernes que viene (AAAA-MM-DD). */
function proximoViernes() {
  const d = new Date()
  do d.setDate(d.getDate() + 1)
  while (d.getDay() !== 5)
  return d.toLocaleDateString('en-CA')
}

// ---------- Pantalla 1b: el salón, la primera vez ----------

function NuevoSalon({ ficha, listo, cancelar }: { ficha: Ficha; listo: (s: Salon) => void; cancelar?: () => void }) {
  const { avisar } = useStore()
  const [seccion, setSeccion] = useState('')
  const [lista, setLista] = useState('')
  const [guardando, setGuardando] = useState(false)
  const nombres = [...new Set(lista.split('\n').map((n) => n.replace(/\t/g, ' ').trim()).filter((n) => n.length >= 2))]
  const salon = nombreSalon(ficha.gradoId, seccion.trim().toUpperCase() || '…')

  async function guardar() {
    setGuardando(true)
    try {
      const { salon } = await conCuenta<{ salon: Salon }>('/api/salones', { grado: ficha.gradoId, seccion: seccion.trim().toUpperCase(), alumnos: nombres })
      listo(salon)
    } catch (e) {
      avisar((e as Error).message, 'error')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-2xl font-bold">¿Para qué salón es la tarea?</h3>
        <p className="text-ink-soft">Solo esta vez. Así cada niño elige su nombre y tú sabes quién la hizo.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
          Grado
          <input value={ficha.grado} readOnly className="h-12 rounded-xl border border-line bg-surface-2 px-3 text-base text-ink" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
          Sección
          <input value={seccion} onChange={(e) => setSeccion(e.target.value.slice(0, 12))} placeholder="B" autoFocus className="h-12 rounded-xl border border-line bg-surface px-3 text-base text-ink" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Pega aquí la lista de tus alumnos</span>
        <span className="text-sm text-ink-soft">Cópiala de tu registro, de Excel o de WhatsApp. Un nombre por línea.</span>
        <textarea
          value={lista}
          onChange={(e) => setLista(e.target.value)}
          rows={7}
          placeholder={'Ana Quispe\nDiego Mamani\nJoaquín Rojas\n…'}
          className="rounded-xl border-2 border-line bg-surface p-3 text-base focus:border-[var(--juego)] focus:outline-none"
        />
      </label>
      {nombres.length > 0 && (
        <p className="font-semibold" style={{ color: VERDE }}>
          ✓ {nombres.length === 1 ? '1 alumno' : `${nombres.length} alumnos`}
        </p>
      )}
      <Boton variante="herramienta" herramienta="juego" tam="lg" onClick={guardar} cargando={guardando} disabled={!seccion.trim() || !nombres.length}>
        Guardar {salon} y seguir
      </Boton>
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Lock className="size-4 shrink-0" aria-hidden /> Solo nombres. Nada de DNI, teléfonos ni correos. Solo tú los ves.
      </p>
      {cancelar && (
        <button type="button" onClick={cancelar} className="self-start text-sm font-medium text-ink-soft underline-offset-4 hover:underline">
          Volver
        </button>
      )}
    </section>
  )
}

// ---------- Pantalla 1: como tarea ----------

export function AsignarTarea({ ficha, publicado, desempeno }: { ficha: Ficha; publicado: Publicado; desempeno: string }) {
  const { avisar } = useStore()
  const { perfil } = usePerfil()
  const [salones, setSalones] = useState<Salon[] | null>(null)
  const [elegido, setElegido] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [cambiando, setCambiando] = useState(false)
  const [vence, setVence] = useState(proximoViernes)
  const [codigo, setCodigo] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const fecha = useRef<HTMLInputElement>(null)

  useEffect(() => {
    conCuenta<{ salones: Salon[] }>('/api/salones').then(
      ({ salones }) => {
        setSalones(salones)
        const delGrado = salones.find((s) => s.grado === ficha.gradoId)
        if (delGrado) setElegido(delGrado.id)
        else setNuevo(true)
      },
      (e: Error) => avisar(e.message, 'error'),
    )
  }, [ficha.gradoId, avisar])

  if (!salones) return <p className="py-6 text-ink-soft">Buscando tus salones…</p>

  if (nuevo) {
    return (
      <NuevoSalon
        ficha={ficha}
        cancelar={salones.length ? () => setNuevo(false) : undefined}
        listo={(s) => {
          setSalones([s, ...salones])
          setElegido(s.id)
          setNuevo(false)
          setCambiando(false)
          setCodigo(null)
        }}
      />
    )
  }

  const salon = salones.find((s) => s.id === elegido) ?? salones[0]
  const nombre = nombreSalon(salon.grado, salon.seccion)
  const segundos = segundosDe(ficha.gradoId)
  const enlace = enlaceTarea(codigo ?? '······')
  const mensaje = `📝 Tarea de ${ficha.area} para ${nombre}: 10 preguntas de «${ficha.titulo}». Toma 5 minutos y es hasta el ${dia(vence, true)}. Que la haga solito o solita: así sé en qué ayudarle. ${enlace}${perfil?.nombre ? `\n— ${perfil.nombre}` : ''}`

  async function crear() {
    if (codigo) return codigo
    try {
      const { codigo: c } = await conCuenta<{ codigo: string }>('/api/tareas', { salon: salon.id, publicado, area: ficha.area, desempeno, vence })
      setCodigo(c)
      return c
    } catch (e) {
      avisar((e as Error).message, 'error')
      return null
    }
  }

  async function asignar() {
    // La pestaña se abre ya, con el clic: si se abre después de esperar al servidor, el navegador la bloquea.
    const pestana = window.open('', '_blank')
    setEnviando(true)
    const c = await crear()
    setEnviando(false)
    if (!c) return pestana?.close()
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje.replace(enlace, enlaceTarea(c)))}`
    if (pestana) pestana.location.href = url
    else avisar('Tarea asignada. Toca «Enviar por WhatsApp».', 'ok')
  }

  async function copiar() {
    const c = await crear()
    if (!c) return
    try {
      await navigator.clipboard.writeText(enlaceTarea(c))
      avisar('Link copiado.', 'ok')
    } catch {
      avisar(`Copia este link: ${enlaceTarea(c)}`)
    }
  }

  return (
    <section className="flex flex-col gap-4">
      {cambiando ? (
        <div className="flex flex-col gap-2 rounded-2xl border-2 border-line p-3">
          {salones.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setElegido(s.id)
                setCambiando(false)
                setCodigo(null)
              }}
              className={cx('flex items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-surface-2', s.id === salon.id && 'bg-surface-2 font-semibold')}
            >
              {nombreSalon(s.grado, s.seccion)} <span className="text-sm text-ink-soft">{s.alumnos} alumnos</span>
            </button>
          ))}
          <button type="button" onClick={() => setNuevo(true)} className="rounded-xl px-3 py-2 text-left font-semibold hover:bg-surface-2" style={{ color: VERDE }}>
            + Otro salón
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-line px-4 py-3">
          <Users className="size-6 shrink-0" style={{ color: VERDE }} aria-hidden />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-lg font-semibold">Para {nombre}</span>
            <span className="text-sm text-ink-soft">{salon.alumnos} alumnos · cada uno elige su nombre de tu lista</span>
          </span>
          <button type="button" onClick={() => setCambiando(true)} className="font-semibold" style={{ color: VERDE }}>
            Cambiar
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="flex flex-col gap-1 rounded-2xl bg-surface-2 p-3 sm:p-4">
          <ListChecks className="size-5" style={{ color: VERDE }} aria-hidden />
          <strong className="font-display text-2xl">10</strong>
          <span className="text-sm text-ink-soft">preguntas con reloj</span>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl bg-surface-2 p-3 sm:p-4">
          <Timer className="size-5" style={{ color: VERDE }} aria-hidden />
          <strong className="font-display text-2xl">{segundos} s</strong>
          <span className="text-sm text-ink-soft">por pregunta</span>
        </div>
        <div className="relative">
          <button type="button" onClick={() => fecha.current?.showPicker?.()} className="flex size-full flex-col gap-1 rounded-2xl bg-surface-2 p-3 text-left sm:p-4">
            <CalendarDays className="size-5" style={{ color: VERDE }} aria-hidden />
            <strong className="font-display text-2xl">{dia(vence)}</strong>
            <span className="flex items-center gap-1 text-sm text-ink-soft">
              entregan hasta <Pencil className="size-3.5" aria-hidden />
            </span>
          </button>
          <input
            ref={fecha}
            type="date"
            value={vence}
            min={new Date().toLocaleDateString('en-CA')}
            onChange={(e) => {
              if (!e.target.value) return
              setVence(e.target.value)
              setCodigo(null)
            }}
            className="pointer-events-none absolute bottom-0 left-0 size-px opacity-0"
            tabIndex={-1}
            aria-label="Entregan hasta"
          />
        </div>
      </div>

      <p className="flex items-start gap-2 text-ink-soft">
        <ShieldCheck className="mt-0.5 size-5 shrink-0" style={{ color: VERDE }} aria-hidden />
        Cuenta la primera vez. Con reloj no da tiempo de copiarla a ChatGPT, y a cada niño le salen las preguntas en otro orden.
      </p>

      <div className="rounded-2xl bg-[#dcf8c6] p-4 text-[#111b21]">
        <p className="mb-1 text-xs font-semibold text-[#1f7a3d]">Así llega al grupo de WhatsApp</p>
        <p className="whitespace-pre-line">{mensaje}</p>
      </div>

      {codigo ? (
        <>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-5 text-lg font-semibold text-on-tool hover:opacity-90"
            style={{ background: VERDE }}
          >
            <MessageCircle className="size-6" aria-hidden /> Enviar por WhatsApp
          </a>
          <p className="text-center text-ink-soft">Listo: la tarea es de {nombre}. La verás revisada en «Revisar».</p>
        </>
      ) : (
        <Boton variante="herramienta" herramienta="juego" tam="lg" onClick={asignar} cargando={enviando}>
          <Send className="size-6" aria-hidden /> Asignar a {nombre} y enviar por WhatsApp
        </Boton>
      )}
      <Boton variante="contorno" onClick={copiar}>
        <Copy className="size-4" aria-hidden /> Copiar link
      </Boton>

      {desempeno && (
        <p className="text-sm text-ink-soft">
          Trabaja «{desempeno}», desempeño de {ficha.grado}.
        </p>
      )}
    </section>
  )
}

// ---------- Revisar: tareas por salón ----------

export function useTareas() {
  const { entro } = useCuenta()
  const [tareas, setTareas] = useState<TareaRevisada[] | null>(null)
  useEffect(() => {
    if (!entro) return
    conCuenta<{ tareas: TareaRevisada[] }>('/api/tareas').then(
      (d) => setTareas(d.tareas),
      () => setTareas([]),
    )
  }, [entro])
  return tareas
}

/** La lista en "Revisar": cada salón con sus tareas y cuántos entregaron. */
export function TareasPorSalon({ tareas, abrir }: { tareas: TareaRevisada[]; abrir: (t: TareaRevisada) => void }) {
  const salones = useMemo(() => {
    const grupos = new Map<string, TareaRevisada[]>()
    for (const t of tareas) grupos.set(t.salon, [...(grupos.get(t.salon) ?? []), t])
    return [...grupos.values()]
  }, [tareas])
  if (!tareas.length) return null
  return (
    <>
      <h2 className="font-display text-4xl font-bold">Tareas por salón</h2>
      {salones.map((lista) => (
        <section key={lista[0].salon} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
          <header className="flex items-center gap-2 px-4 py-3">
            <Users className="size-5" style={{ color: VERDE }} aria-hidden />
            <h3 className="text-lg font-semibold">{nombreSalon(lista[0].grado, lista[0].seccion)}</h3>
            <span className="text-ink-soft">· {lista[0].alumnos.length} alumnos</span>
          </header>
          {lista.map((t) => (
            <button key={t.codigo} type="button" onClick={() => abrir(t)} className="flex items-center gap-3 border-t border-line px-4 py-3 text-left hover:bg-surface-2">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">{t.tema}</span>
                <span className="text-sm text-ink-soft">
                  Tarea de {t.area} · hasta el {dia(t.vence)}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <strong>
                  {t.intentos.length} de {t.alumnos.length}
                </strong>
                <span className="block text-sm text-ink-soft">entregaron</span>
              </span>
            </button>
          ))}
        </section>
      ))}
    </>
  )
}

const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-PE', { weekday: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).replace('.', '')

/** Pantalla 5: la tarea ya revisada, qué reforzar y quién falta. */
export function RevisarTarea({ tarea, volver }: { tarea: TareaRevisada; volver: () => void }) {
  const { avisar, temas, elegirTema, ir } = useStore()
  const [podio, setPodio] = useState(false)
  const salon = nombreSalon(tarea.grado, tarea.seccion)
  const nombreDe = (id: number) => tarea.alumnos.find((a) => a.id === id)?.nombre ?? 'Alumno'
  const filas = [...tarea.intentos].sort((a, b) => b.aciertos - a.aciertos || a.segundos - b.segundos)
  const faltan = tarea.alumnos.filter((a) => !tarea.intentos.some((i) => i.alumno === a.id))
  const total = tarea.intentos[0]?.total ?? 10
  const promedio = filas.length ? Math.round(filas.reduce((s, i) => s + i.aciertos, 0) / filas.length) : 0
  const bajoMitad = filas.filter((i) => i.aciertos < i.total / 2).length
  const cerro = new Date(`${tarea.vence}T23:59:59`) < new Date()

  // La pregunta que más costó y la respuesta equivocada que más se repitió.
  const peor = useMemo(() => {
    const porPregunta = new Map<string, { vieron: number; fallaron: number; elegidas: Map<string, number> }>()
    for (const i of tarea.intentos)
      for (const r of i.respuestas) {
        const p = porPregunta.get(r.pregunta) ?? { vieron: 0, fallaron: 0, elegidas: new Map() }
        p.vieron++
        if (r.elegida !== r.correcta) {
          p.fallaron++
          p.elegidas.set(r.elegida, (p.elegidas.get(r.elegida) ?? 0) + 1)
        }
        porPregunta.set(r.pregunta, p)
      }
    const [pregunta, p] = [...porPregunta].sort(([, a], [, b]) => b.fallaron / b.vieron - a.fallaron / a.vieron || b.fallaron - a.fallaron)[0] ?? []
    if (!pregunta || !p?.fallaron) return null
    const elegida = [...p.elegidas].sort(([, a], [, b]) => b - a)[0][0]
    return { pregunta, ...p, elegida }
  }, [tarea])

  function abrirTema(v: Vista) {
    const t = temas.find((t) => t.titulo === tarea.tema && t.gradoId === tarea.grado)
    if (!t) return avisar(`Abre el tema «${tarea.tema}» desde Inicio para ${v === 'sesion' ? 'preparar la sesión' : 'repasarlo'}.`)
    elegirTema(t.id)
    ir(v)
  }

  const recordatorio = `Hola, familias 👋\nAún falta la tarea de ${tarea.area} «${tarea.tema}» de: ${faltan.map((a) => a.nombre).join(', ')}. Toma 5 minutos y se hace aquí: ${enlaceTarea(tarea.codigo)}\n¡Gracias!`

  return (
    <>
      <header className="flex flex-col gap-3">
        <button type="button" onClick={volver} className="flex items-center gap-1.5 self-start text-ink-soft hover:text-ink print:hidden">
          <ArrowLeft className="size-4" aria-hidden /> {salon} · Tarea de {tarea.area} · {cerro ? 'cerró' : 'cierra'} el {dia(tarea.vence)}
        </button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto font-display text-4xl font-bold">{tarea.tema}</h1>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Boton variante="contorno" onClick={() => setPodio(true)} disabled={!filas.length}>
              <Trophy className="size-5" aria-hidden /> Mostrar podio en la pizarra
            </Boton>
            <Boton variante="contorno" onClick={() => imprimir(avisar)}>
              <FileDown className="size-5" aria-hidden /> Reporte por alumno (PDF)
            </Boton>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface p-5">
          <p className="font-display text-3xl font-bold">
            {filas.length} de {tarea.alumnos.length}
          </p>
          <p className="text-sm text-ink-soft">entregaron · {cerro ? 'cerró' : 'cierra'} el {dia(tarea.vence)}</p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className="font-display text-3xl font-bold">
            {promedio} de {total}
          </p>
          <p className="text-sm text-ink-soft">aciertos en promedio</p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <p className={cx('font-display text-3xl font-bold', bajoMitad > 0 && 'text-danger')}>{bajoMitad}</p>
          <p className="text-sm text-ink-soft">no llegaron a la mitad</p>
        </div>
      </div>

      {peor && (
        <section className="flex flex-col gap-4 rounded-3xl bg-[#f8f0c8] p-5 text-[#172031]">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Target className="size-6 shrink-0" aria-hidden />
            {peor.fallaron / peor.vieron > 0.5 ? 'Para reforzar: más de la mitad falló este desempeño' : 'Para reforzar: lo que más costó'}
          </h2>
          <div className="rounded-2xl bg-white p-4">
            {tarea.desempeno && <p className="font-semibold">«…{tarea.desempeno}»</p>}
            <p className="mt-1 text-sm text-[#536075]">
              {peor.fallaron} de {peor.vieron} fallaron. Lo que más costó: «{peor.pregunta}»
              {peor.elegida ? `, la mayoría respondió «${peor.elegida}».` : ', a la mayoría se le acabó el tiempo.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button type="button" onClick={() => abrirTema('juego')} className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-[#172031] bg-white px-4 font-semibold">
              <Presentation className="size-5" aria-hidden /> Repasar en el proyector
            </button>
            <button type="button" onClick={() => abrirTema('sesion')} className="inline-flex h-11 items-center gap-2 rounded-xl px-4 font-semibold text-white" style={{ background: '#0f7f55' }}>
              <CalendarPlus className="size-5" aria-hidden /> Retomarlo en la próxima sesión
            </button>
          </div>
        </section>
      )}

      <section className="overflow-x-auto rounded-2xl bg-surface p-4">
        <table className="w-full min-w-[30rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-sm text-ink-soft">
              <th className="py-2 pr-2 font-medium">Alumno</th>
              <th className="py-2 pr-2 font-medium">Aciertos</th>
              <th className="py-2 pr-2 font-medium">Tardó</th>
              <th className="py-2 font-medium">Entregó</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((i, n) => {
              const bajo = i.aciertos < i.total / 2
              return (
                <tr key={i.alumno} className="border-b border-line">
                  <td className="py-2.5 pr-2">
                    <span className="inline-block w-7" aria-hidden>
                      {MEDALLAS[n] ?? ''}
                    </span>
                    {nombreDe(i.alumno)}
                  </td>
                  <td className={cx('py-2.5 pr-2 font-semibold', bajo && 'text-danger')}>
                    {bajo && <CircleAlert className="mr-1 inline size-4 align-[-2px]" aria-label="No llegó a la mitad" />}
                    {i.aciertos} de {i.total}
                  </td>
                  <td className="py-2.5 pr-2">{Math.max(1, Math.round(i.segundos / 60))} min</td>
                  <td className="py-2.5">{fechaHora(i.fecha)}</td>
                </tr>
              )
            })}
            {faltan.length > 0 && (
              <tr>
                <td className="py-2.5 pr-2">
                  {faltan.length === 1 ? '1 no la hizo' : `${faltan.length} no la hicieron`}: {faltan.map((a) => a.nombre.split(' ')[0]).join(', ')}
                </td>
                <td className="py-2.5 pr-2">—</td>
                <td className="py-2.5 pr-2">—</td>
                <td className="py-2.5">
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(recordatorio)}`} target="_blank" rel="noreferrer" className="font-semibold print:hidden" style={{ color: '#0f7f55' }}>
                    Recordar por WhatsApp
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Lock className="size-4 shrink-0" aria-hidden /> Solo tú ves estos resultados. Los alumnos no tienen cuenta: eligen su nombre de tu lista.
      </p>

      {podio && (
        // Los 5 mejores y nunca el último: el podio celebra, no expone.
        <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-white p-6 text-center text-[#111]" role="dialog" aria-modal aria-label="Podio">
          <button type="button" onClick={() => setPodio(false)} className="absolute right-4 top-4 grid size-12 place-items-center rounded-full bg-[#f1f2f6]" aria-label="Cerrar">
            <X className="size-6" />
          </button>
          <p className="font-display text-[clamp(28px,5vw,60px)] font-bold">¡Los mejores de {salon}!</p>
          <ol className="flex flex-col gap-3">
            {filas.slice(0, Math.min(5, Math.max(1, filas.length - 1))).map((i, n) => (
              <li key={i.alumno} className="text-[clamp(22px,3.5vw,44px)] font-semibold">
                {MEDALLAS[n] ?? `${n + 1}.`} {nombreDe(i.alumno)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}
