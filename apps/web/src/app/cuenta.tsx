// Cuenta de la docente con Clerk, solo con Google. Se pide al mandar un juego (mockup z2hti en pen): con la cuenta,
// sus envíos se guardan en el servidor y ve los resultados desde cualquier computadora.
// Sin VITE_CLERK_PUBLISHABLE_KEY la app funciona igual que antes, sin cuentas.
import { esES } from '@clerk/localizations'
import { ClerkProvider, SignIn, getToken, useAuth, useClerk, useUser } from '@clerk/react'
import { useEffect, useState, type ReactNode } from 'react'
import { sincronizarEnviados } from '../juegos/compartir/resultados'
import { Entrar } from '../views/Entrar'

const CLAVE_CLERK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const CLAVE_SIN_CUENTA = 'supermentes-sin-cuenta'
// Los pasos de Clerk (vuelta de Google, código del correo…) viven bajo /app/…; cloudflare/worker.ts sirve la app ahí.
const callbackUrl = () => `${location.origin}/app/sso-callback`
const enPasoDeClerk = () => /^\/app\/[\w-]+/.test(location.pathname)

export type Cuenta = { lista: boolean; entro: boolean; nombre?: string; entrar: () => Promise<void>; salir: () => void }

const SIN_CUENTA: Cuenta = { lista: false, entro: false, entrar: async () => {}, salir: () => {} }

function useCuentaClerk(): Cuenta {
  const { isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const clerk = useClerk()
  return {
    lista: isLoaded,
    entro: !!isSignedIn,
    nombre: user?.firstName ?? user?.fullName ?? undefined,
    // Ventana emergente y no redirección: el tema abierto vive en memoria y se perdería al volver de Google.
    async entrar() {
      const callback = callbackUrl()
      const popup = window.open('', 'supermentes-google', 'width=480,height=640')
      await clerk.client?.signIn.authenticateWithPopup({ strategy: 'oauth_google', popup, redirectUrl: callback, redirectUrlComplete: callback })
    },
    salir: () => void clerk.signOut(),
  }
}

/** La hook se elige una vez por build: con o sin Clerk. */
export const useCuenta: () => Cuenta = CLAVE_CLERK ? useCuentaClerk : () => SIN_CUENTA

/** Token para la API, o null sin cuenta. */
export const tokenDeCuenta = () => (CLAVE_CLERK ? getToken().catch(() => null) : Promise.resolve(null))

function sinCuentaGuardado() {
  try {
    return localStorage.getItem(CLAVE_SIN_CUENTA) === '1'
  } catch {
    return false
  }
}

/** Sin cuenta se ve la pantalla de entrar, salvo que haya elegido "Probar sin cuenta" en este navegador. */
function Puerta({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth()
  const [sinCuenta, setSinCuenta] = useState(sinCuentaGuardado)
  if (!isLoaded) return null
  if ((isSignedIn || sinCuenta) && !enPasoDeClerk()) return children
  return (
    <Entrar
      sinCuenta={() => {
        try {
          localStorage.setItem(CLAVE_SIN_CUENTA, '1')
        } catch {
          // Sin almacenamiento vale por esta visita.
        }
        setSinCuenta(true)
      }}
    >
      <SignIn routing="path" path="/app" withSignUp forceRedirectUrl="/app/" signUpForceRedirectUrl="/app/" />
    </Entrar>
  )
}

function Sincronizar() {
  const { isSignedIn } = useAuth()
  useEffect(() => {
    if (isSignedIn) tokenDeCuenta().then((t) => void (t && sincronizarEnviados(t)))
  }, [isSignedIn])
  return null
}

// El formulario de Clerk con los colores de la app (siguen al modo claro u oscuro) y en tú, no en usted.
const APARIENCIA = {
  variables: {
    colorPrimary: 'var(--primary)',
    colorPrimaryForeground: 'var(--primary-ink)',
    colorBackground: 'var(--surface)',
    colorInput: 'var(--surface-2)',
    colorForeground: 'var(--ink)',
    colorMutedForeground: 'var(--ink-soft)',
    colorBorder: 'var(--line)',
    colorDanger: 'var(--danger)',
    fontFamily: 'Lexend, sans-serif',
    fontSize: '1rem',
    borderRadius: '0.9rem',
  },
  elements: {
    headerTitle: { fontFamily: '"Shantell Sans", cursive', fontSize: '1.75rem' },
    socialButtonsBlockButton: { border: '1px solid var(--line)', backgroundColor: 'var(--surface-2)', minHeight: '3rem' },
    dividerLine: { backgroundColor: 'var(--line)' },
    formFieldInput: { border: '1px solid var(--line)', minHeight: '3rem' },
    formButtonPrimary: { minHeight: '3rem' },
  },
}

// ponytail: esES de Clerk trata de usted; se pasa a tú con reemplazos sobre todos los textos. Si un texto queda raro,
// se corrige con una clave explícita abajo.
const A_TU: [RegExp, string][] = [
  [/\b(Ingrese|Introduzca)\b/g, 'Escribe'],
  [/\b(ingrese|introduzca)\b/g, 'escribe'],
  [/\bRevise\b/g, 'Revisa'],
  [/\bVerifique\b/g, 'Verifica'],
  [/\bContinúe\b/g, 'Continúa'],
  [/\bIntente\b/g, 'Intenta'],
  [/\bintente\b/g, 'intenta'],
  [/\brecibió\b/g, 'recibiste'],
  [/\bSu\b/g, 'Tu'],
  [/\bsu\b/g, 'tu'],
  [/\bsus\b/g, 'tus'],
]
function aTu<T>(v: T): T {
  if (typeof v === 'string') return A_TU.reduce((t, [re, r]) => t.replace(re, r), v as string) as T
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, aTu(x)])) as T
  return v
}
const ES = aTu(esES)

const LOCALIZACION = {
  ...ES,
  identityPreviewEditButton__identifier: 'Cambiar',
  unstable__errors: {
    ...ES.unstable__errors,
    zxcvbn: { ...ES.unstable__errors?.zxcvbn, goodPassword: 'Tu contraseña está bien.', couldBeStronger: 'Sirve, pero podría ser más segura.', notEnough: 'Tu contraseña es muy débil.' },
  },
  formFieldInputPlaceholder__emailAddress: 'tucorreo@ejemplo.com',
  formFieldInputPlaceholder__password: 'Tu contraseña',
  signIn: {
    ...ES.signIn,
    start: { ...ES.signIn?.start, title: 'Entra a Supermentes', titleCombined: 'Entra a Supermentes', subtitle: 'Con Google o con tu correo.', subtitleCombined: 'Con Google o con tu correo.' },
  },
  signUp: {
    ...ES.signUp,
    start: { ...ES.signUp?.start, title: 'Crea tu cuenta', subtitle: 'Es gratis y toma un minuto.' },
  },
}

export function ConCuenta({ children }: { children: ReactNode }) {
  if (!CLAVE_CLERK) return children
  return (
    <ClerkProvider
      publishableKey={CLAVE_CLERK}
      localization={LOCALIZACION}
      signInUrl="/app"
      signUpUrl="/app"
      afterSignOutUrl="/app/"
      appearance={APARIENCIA}
    >
      <Sincronizar />
      <Puerta>{children}</Puerta>
    </ClerkProvider>
  )
}
