// Pantalla de entrar (mockup "Entrar · pantalla propia" en pen): lo primero que ve quien abre la app sin cuenta.
// El formulario es el de Clerk (Google o correo y contraseña). "Probar sin cuenta" deja usarla igual; la cuenta se
// vuelve a ofrecer al mandar el primer juego.
import { CircleCheck, FileCheck, Gamepad2, Music } from 'lucide-react'
import type { ReactNode } from 'react'
import { Logo } from '../components/Logo'

const LO_QUE_TRAE = [
  { icono: Gamepad2, color: 'text-juego', texto: 'Juegos para el celular que mandas al WhatsApp de las familias' },
  { icono: Music, color: 'text-cancion', texto: 'Canciones con ritmos del Perú para cantar en clase' },
  { icono: FileCheck, color: 'text-examen', texto: 'Exámenes listos para imprimir, con Fila A y B' },
]

export function Entrar({ children, sinCuenta }: { children: ReactNode; sinCuenta: () => void }) {
  return (
    <main className="grid min-h-dvh bg-bg text-ink lg:grid-cols-[1fr_38rem]">
      <section className="flex flex-col gap-10 border-line bg-surface px-6 py-10 sm:px-12 lg:border-r lg:px-20 lg:py-16">
        <Logo />
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
            Tu clase de mañana,
            <br />
            lista en minutos
          </h1>
          <p className="max-w-lg text-lg text-ink-soft sm:text-xl">Juegos, canciones y exámenes con el Currículo Nacional del Perú.</p>
        </div>
        <ul className="flex flex-col gap-4">
          {LO_QUE_TRAE.map(({ icono: Icono, color, texto }) => (
            <li key={texto} className="flex items-center gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2">
                <Icono className={`size-5 ${color}`} aria-hidden />
              </span>
              {texto}
            </li>
          ))}
        </ul>
        <p className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-ok/10 px-3.5 py-2 text-sm text-ok">
          <CircleCheck className="size-4" aria-hidden /> Cada material cita el desempeño oficial de su grado
        </p>
      </section>

      <section className="flex flex-col items-center justify-center gap-5 px-6 py-12">
        {children}
        <button type="button" onClick={sinCuenta} className="font-semibold underline underline-offset-4">
          Probar sin cuenta
        </button>
        <p className="text-sm text-ink-soft">No publicamos nada en tu nombre. Es gratis.</p>
      </section>
    </main>
  )
}
