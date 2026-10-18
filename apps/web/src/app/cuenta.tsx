// Cuenta de la docente con Clerk, solo con Google. Se pide al mandar un juego (mockup z2hti en pen): con la cuenta,
// sus envíos se guardan en el servidor y ve los resultados desde cualquier computadora.
// Sin VITE_CLERK_PUBLISHABLE_KEY la app funciona igual que antes, sin cuentas.
import { AuthenticateWithRedirectCallback, ClerkProvider, getToken, useAuth, useClerk, useUser } from '@clerk/react'
import { useEffect, type ReactNode } from 'react'
import { sincronizarEnviados } from '../juegos/compartir/resultados'

const CLAVE_CLERK = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const CALLBACK = 'sso-callback'

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
      const callback = `${location.origin}/app/?${CALLBACK}`
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
          {children}
        </>
      )}
    </ClerkProvider>
  )
}
