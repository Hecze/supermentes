// Cuenta de la docente con Clerk, solo con Google. Se pide al mandar un juego (mockup z2hti en pen): con la cuenta,
// sus envíos se guardan en el servidor y ve los resultados desde cualquier computadora.
// Sin VITE_CLERK_PUBLISHABLE_KEY la app funciona igual que antes, sin cuentas.
import { AuthenticateWithRedirectCallback, ClerkProvider, getToken, useAuth, useClerk, useUser } from '@clerk/react'
import { useEffect, useState, type ReactNode } from 'react'
import { sincronizarEnviados } from '../juegos/compartir/resultados'
import { Entrar } from '../views/Entrar'

const CLAVE_CLERK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const CALLBACK = 'sso-callback'
const CLAVE_SIN_CUENTA = 'supermentes-sin-cuenta'
const callbackUrl = () => `${location.origin}/app/?${CALLBACK}`

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
  const clerk = useClerk()
  const [sinCuenta, setSinCuenta] = useState(sinCuentaGuardado)
  if (!isLoaded) return null
  if (isSignedIn || sinCuenta) return children
  return (
    <Entrar
      // Aquí no hay nada abierto que perder: se entra con redirección, que es lo más confiable.
      entrar={async () => {
        await clerk.client?.signIn.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: callbackUrl(), redirectUrlComplete: `${location.origin}/app/` })
      }}
      sinCuenta={() => {
        try {
          localStorage.setItem(CLAVE_SIN_CUENTA, '1')
        } catch {
          // Sin almacenamiento vale por esta visita.
        }
        setSinCuenta(true)
      }}
    />
  )
}

function Sincronizar() {
  const { isSignedIn } = useAuth()
  useEffect(() => {
    if (isSignedIn) tokenDeCuenta().then((t) => void (t && sincronizarEnviados(t)))
  }, [isSignedIn])
  return null
}

export function ConCuenta({ children }: { children: ReactNode }) {
  if (!CLAVE_CLERK) return children
  // La ventana de Google vuelve a /app/?sso-callback: ahí Clerk termina de entrar y la cierra.
  const callback = new URLSearchParams(location.search).has(CALLBACK)
  return (
    <ClerkProvider publishableKey={CLAVE_CLERK}>
      {callback ? (
        <AuthenticateWithRedirectCallback />
      ) : (
        <>
          <Sincronizar />
          <Puerta>{children}</Puerta>
        </>
      )}
    </ClerkProvider>
  )
}
