import {
  ArrowRight,
  BookMarked,
  Camera,
  CircleCheck,
  FileText,
  Gamepad2,
  Grid3x3,
  Laptop,
  Music,
  PenLine,
  Printer,
  QrCode,
  SlidersHorizontal,
  type LucideProps,
} from 'lucide-react'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Logo } from '../components/Logo'
import { cx } from '../components/ui'
import { Collage } from './Collage'
import { Bienvenida, FormularioCompleto, FormularioCorreo, contarLista, leerOrigen, leerRegistro, type Registro } from './ListaEspera'

const tinte = (color: string, pct: number) => `color-mix(in oklab, ${color} ${pct}%, transparent)`

function Contenedor({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('gutter mx-auto w-full max-w-6xl', className)}>{children}</div>
}

function Titulo({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cx('font-display text-4xl font-bold leading-[1.1] sm:text-5xl', className)}>{children}</h2>
}

const PASOS = [
  {
    titulo: 'Crea tu tema',
    texto: 'Búscalo en el Currículo Nacional: el grado y el curso vienen con él.',
    color: 'var(--examen)',
  },
  {
    titulo: 'Elige lo que necesitas',
    texto: 'Un examen, una práctica, un balotario, una canción, un juego o un crucigrama. Solo lo que vas a usar.',
    color: 'var(--cancion)',
  },
  {
    titulo: 'Imprime, proyecta o comparte',
    texto: 'Todo sale listo para el aula: en papel, en la pizarra digital o por WhatsApp.',
    color: 'var(--juego)',
  },
]

const HERRAMIENTAS: { nombre: string; texto: string; color: string; icono: ComponentType<LucideProps>; ancho?: boolean }[] = [
  {
    nombre: 'Examen, práctica y balotario',
    texto: 'Listos para imprimir apenas abres tu tema, con su clave: la respuesta y los pasos de cada pregunta. Otra versión con otros números cuando quieras, y Fila A y B para que no se copien.',
    color: 'var(--examen)',
    icono: FileText,
    ancho: true,
  },
  {
    nombre: 'Canción',
    texto: 'Letras pegadizas con las palabras de tu tema, en cumbia, huayno o con una melodía que ya conocen.',
    color: 'var(--cancion)',
    icono: Music,
  },
  {
    nombre: 'Juegos',
    texto: 'Memoria, carrera de preguntas y adivina la palabra. Se proyectan o se abren con un QR, sin cuentas.',
    color: 'var(--juego)',
    icono: Gamepad2,
  },
  {
    nombre: 'Crucigrama',
    texto: 'Con tus palabras y tus pistas, del tamaño que quieras. Imprímelo o descárgalo como imagen.',
    color: 'var(--crucigrama)',
    icono: Grid3x3,
  },
]

const AULA: { titulo: string; texto: string; icono: ComponentType<LucideProps> }[] = [
  { titulo: 'Alineado al CNEB', texto: 'Cada tema se conecta con las competencias y capacidades del Currículo Nacional.', icono: BookMarked },
  { titulo: 'Sin un equipo por alumno', texto: 'Todo se imprime en blanco y negro. Los juegos se proyectan o se abren con un QR.', icono: Printer },
  { titulo: 'Tú decides el contenido', texto: 'La app sugiere; tú eliges las palabras, las preguntas y el tono.', icono: SlidersHorizontal },
  { titulo: 'Con su clave', texto: 'Cada hoja trae su clave con la respuesta y los pasos de cada pregunta, para corregir rápido.', icono: CircleCheck },
  { titulo: 'Los alumnos entran sin cuenta', texto: 'Escanean el QR o abren el enlace que mandas por WhatsApp. Nada que instalar.', icono: QrCode },
  { titulo: 'Hecho para tu laptop', texto: 'Pensado para preparar la clase con calma en la computadora y llevarla impresa o proyectada.', icono: Laptop },
]

const PREGUNTAS = [
  {
    p: '¿Necesito saber de tecnología?',
    r: 'No. Cada pantalla te hace una sola pregunta y tiene un botón principal. Si sabes escribir un mensaje, puedes usar Supermentes.',
  },
  {
    p: '¿Mis alumnos necesitan celular o cuenta?',
    r: 'No. Todo se puede imprimir. Los juegos se proyectan en clase o se abren con un QR, sin crear cuentas.',
  },
  {
    p: '¿La IA reemplaza mi trabajo?',
    r: 'No. Tú eliges el tema, las palabras y el contenido; la herramienta te ahorra el tiempo de armar el material. Antes de imprimir puedes corregir cualquier texto.',
  },
  {
    p: '¿Cuándo estará listo?',
    r: 'Lo estamos construyendo ahora mismo. A quienes estén en la lista de espera les escribiremos primero cuando abramos.',
  },
  {
    p: '¿Qué hacen con mis datos?',
    r: 'Solo usamos tu correo para avisarte cuando abramos. No lo compartimos con nadie.',
  },
]

function Contador({ total }: { total: number | null }) {
  if (total === null) return null
  return (
    <p className="flex items-center gap-2 text-ink-soft">
      <span className="relative flex size-2.5" aria-hidden>
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-ok" />
      </span>
      {total > 1 ? (
        <span>
          Ya somos <strong className="text-ink tabular-nums">{total}</strong> en la lista de espera
        </span>
      ) : (
        <span>Sé de los primeros en la lista de espera</span>
      )}
    </p>
  )
}

export function Landing() {
  const [origen] = useState(leerOrigen)
  const [registro, setRegistro] = useState<Registro | null>(leerRegistro)
  const [total, setTotal] = useState<number | null>(null)
  const [nuevo, setNuevo] = useState<boolean | null>(null)

  useEffect(() => {
    contarLista().then(setTotal)
  }, [])

  function alUnirse(r: Registro, t: number | null, esNuevo: boolean) {
    // Completar el perfil no cambia si la persona era nueva o no.
    if (!registro || registro.correo !== r.correo) setNuevo(esNuevo)
    setRegistro(r)
    if (t !== null) setTotal(t)
  }

  const bienvenida = registro && <Bienvenida registro={registro} total={total} nuevo={nuevo} origen={origen} alUnirse={alUnirse} />

  return (
    <div className="overflow-x-clip">
      {/* Navegación */}
      <header className="sticky z-40 border-b border-line/70 bg-bg/85 backdrop-blur" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <Contenedor className="flex h-16 items-center justify-between gap-4">
          <a href="/" className="rounded-lg" aria-label="Supermentes, inicio">
            <Logo />
          </a>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Principal">
            <a href="#como-funciona" className="hidden rounded-lg px-3 py-2 text-ink-soft hover:text-ink md:inline">
              Cómo funciona
            </a>
            <a href="#herramientas" className="hidden rounded-lg px-3 py-2 text-ink-soft hover:text-ink md:inline">
              Herramientas
            </a>
            <a href="#unirme" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 font-semibold text-primary-ink hover:opacity-90">
              Unirme
            </a>
          </nav>
        </Contenedor>
      </header>

      {/* Portada */}
      <section className="pb-16 pt-10 sm:pt-16 lg:pb-24">
        <Contenedor className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="flex min-w-0 flex-col gap-6">
            <p className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-surface px-3 py-1 text-sm">
              <span className="size-2 rounded-full bg-cancion" aria-hidden />
              Para docentes de inicial, primaria y secundaria del Perú
            </p>
            <h1 className="font-display text-[2.5rem] font-bold leading-[1.04] tracking-tight sm:text-[3.4rem] lg:text-[3.55rem]">
              Crea canciones, juegos y exámenes para tu clase <span className="marker">en minutos</span>.
            </h1>
            <p className="max-w-xl text-lg text-ink-soft sm:text-xl">Herramientas para hacer tu clase más enganchante en minutos.</p>
            <div className="flex max-w-xl flex-col gap-3">
              {bienvenida ?? <FormularioCorreo origen={origen} alUnirse={alUnirse} />}
              {!registro && <Contador total={total} />}
            </div>
          </div>
          <Collage />
        </Contenedor>
      </section>

      {/* Con lo que ya tienes */}
      <section className="border-y border-line bg-surface">
        <Contenedor className="flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-xl font-bold">Funciona con lo que ya usas:</p>
          <ul className="flex flex-col gap-3 sm:flex-row sm:gap-8">
            {(
              [
                [Camera, 'El libro del colegio'],
                [FileText, 'Tu sesión en PDF o Word'],
                [PenLine, 'Lo que ya sabes de memoria'],
              ] as const
            ).map(([Icono, texto]) => (
              <li key={texto} className="flex items-center gap-2.5">
                <Icono className="size-5 text-ink-soft" aria-hidden />
                {texto}
              </li>
            ))}
          </ul>
        </Contenedor>
      </section>

      {/* El problema */}
      <section className="py-20 sm:py-28">
        <Contenedor className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Titulo>
            Preparar material que enganche toma horas que <span className="marker">no tienes</span>.
          </Titulo>
          <div className="flex flex-col gap-5 text-lg text-ink-soft">
            <p>
              Inventar un juego, armar un crucigrama o reescribir un examen para que tu clase se interese es trabajo extra que casi nadie ve. Y
              cuando un estudiante necesita una versión distinta, el tiempo simplemente no alcanza.
            </p>
            <p className="text-ink">
              Supermentes hace la parte pesada. Tú pones el tema y tu criterio; en minutos tienes el material listo para usar mañana.
            </p>
          </div>
        </Contenedor>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="scroll-mt-20 border-t border-line bg-surface py-20 sm:py-28">
        <Contenedor className="flex flex-col gap-12">
          <Titulo className="max-w-2xl">Así de simple</Titulo>
          <ol className="grid gap-8 md:grid-cols-3 md:gap-6">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="relative flex flex-col gap-3">
                <span
                  className="grid size-14 place-items-center rounded-2xl font-display text-2xl font-bold"
                  style={{ background: tinte(p.color, 16), color: p.color }}
                >
                  {i + 1}
                </span>
                {i < PASOS.length - 1 && (
                  <span className="absolute left-[4.5rem] right-4 top-7 hidden border-t-2 border-dashed border-line md:block" aria-hidden />
                )}
                <h3 className="font-display text-2xl font-bold">{p.titulo}</h3>
                <p className="text-lg text-ink-soft">{p.texto}</p>
              </li>
            ))}
          </ol>
        </Contenedor>
      </section>

      {/* Herramientas */}
      <section id="herramientas" className="scroll-mt-20 py-20 sm:py-28">
        <Contenedor className="flex flex-col gap-12">
          <div className="flex max-w-2xl flex-col gap-4">
            <Titulo>Cuatro herramientas. Una sola idea: que aprendan con ganas.</Titulo>
            <p className="text-lg text-ink-soft">Todas parten de tu tema, así que no tienes que explicar nada dos veces.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {HERRAMIENTAS.map((h) => (
              <article
                key={h.nombre}
                className={cx('flex flex-col gap-4 rounded-3xl border border-line p-6 sm:p-7', h.ancho && 'md:col-span-2')}
                style={{ background: `linear-gradient(160deg, ${tinte(h.color, 12)}, var(--surface) 60%)` }}
              >
                <span className="grid size-12 place-items-center rounded-2xl" style={{ background: tinte(h.color, 18), color: h.color }}>
                  <h.icono className="size-6" aria-hidden />
                </span>
                <h3 className="font-display text-2xl font-bold">{h.nombre}</h3>
                <p className="text-lg text-ink-soft">{h.texto}</p>
              </article>
            ))}
            <a
              href="#unirme"
              className="group flex flex-col justify-between gap-4 rounded-3xl border-2 border-dashed border-line p-6 transition hover:border-ink sm:p-7"
            >
              <p className="font-display text-2xl font-bold">¿Te servirían en tu clase?</p>
              <span className="inline-flex items-center gap-2 font-semibold">
                Únete a la lista de espera <ArrowRight className="size-5 transition group-hover:translate-x-0.5" aria-hidden />
              </span>
            </a>
          </div>
        </Contenedor>
      </section>

      {/* Aula peruana */}
      <section className="border-y border-line bg-surface py-20 sm:py-28">
        <Contenedor className="flex flex-col gap-12">
          <Titulo className="max-w-3xl">Pensado para el aula peruana de verdad</Titulo>
          <div className="grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {AULA.map((a) => (
              <div key={a.titulo} className="flex flex-col gap-2">
                <a.icono className="size-7" aria-hidden />
                <h3 className="text-xl font-semibold">{a.titulo}</h3>
                <p className="text-ink-soft">{a.texto}</p>
              </div>
            ))}
          </div>
        </Contenedor>
      </section>

      {/* Unirse */}
      <section id="unirme" className="scroll-mt-20 py-20 sm:py-28">
        <Contenedor>
          <div className="grid gap-10 rounded-[2rem] bg-primary p-6 text-primary-ink sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14 lg:p-14">
            <div className="flex flex-col gap-5">
              <h2 className="font-display text-4xl font-bold leading-[1.1] sm:text-5xl">Sé de los primeros en usarlo</h2>
              <p className="text-lg opacity-80">
                Únete a la lista de espera. Te avisamos apenas abramos y tendrás acceso antes que nadie.
              </p>
              {total !== null && total > 1 && (
                <p className="text-lg">
                  Ya somos <strong className="tabular-nums">{total}</strong> docentes esperando.
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-surface p-5 text-ink sm:p-6">
              {bienvenida ?? <FormularioCompleto origen={origen} alUnirse={alUnirse} />}
            </div>
          </div>
        </Contenedor>
      </section>

      {/* Preguntas */}
      <section className="pb-20 sm:pb-28">
        <Contenedor className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          <Titulo>Preguntas frecuentes</Titulo>
          <div className="flex flex-col divide-y divide-line border-y border-line">
            {PREGUNTAS.map((q) => (
              <details key={q.p} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {q.p}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-xl leading-none transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="pt-3 text-lg text-ink-soft">{q.r}</p>
              </details>
            ))}
          </div>
        </Contenedor>
      </section>

      <footer className="border-t border-line bg-surface py-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2.5rem)' }}>
        <Contenedor className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="text-sm text-ink-soft">Hecho en Lima para Hack the Andes 2026.</p>
          </div>
          <nav className="flex gap-5 text-ink-soft" aria-label="Pie de página">
            <a href="#herramientas" className="hover:text-ink">
              Herramientas
            </a>
            <a href="#unirme" className="hover:text-ink">
              Lista de espera
            </a>
          </nav>
        </Contenedor>
      </footer>
    </div>
  )
}
