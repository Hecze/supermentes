// Acceso directo para la cuenta de demostración: crea un token de Clerk y entra sin enviar código al correo.
// Solo funciona para el correo indicado. Necesita CLERK_SECRET_KEY en el Worker.
//
//   POST /api/entrar-demo  { email }  → { token }  (el navegador lo usa como estrategia "ticket" de Clerk)
import { createClerkClient } from '@clerk/backend'
import { json } from './_juegos.js'

const CORREO = 'hectorzerrillo85@gmail.com'

export async function POST(request: Request) {
  const secreto = process.env.CLERK_SECRET_KEY
  if (!secreto) return json({ error: 'Falta configurar Clerk en el servidor.' }, 500)

  let correo = ''
  try {
    const datos = (await request.json()) as { email?: unknown }
    correo = typeof datos?.email === 'string' ? datos.email.trim().toLowerCase() : ''
  } catch {
    // Sin cuerpo válido se responde igual que con otro correo.
  }
  if (correo !== CORREO) return json({ error: 'Ese correo no tiene entrada directa.' }, 403)

  try {
    const clerk = createClerkClient({ secretKey: secreto })
    const encontrado = (await clerk.users.getUserList({ emailAddress: [CORREO], limit: 1 })).data[0]
    const usuario =
      encontrado ??
      (await clerk.users.createUser({
        emailAddress: [CORREO],
        emailAddressIdentificationStatus: ['verified'],
        skipPasswordRequirement: true,
      }))
    const token = await clerk.signInTokens.createSignInToken({ userId: usuario.id, expiresInSeconds: 300 })
    return json({ token: token.token })
  } catch (e) {
    console.error('No se pudo crear el acceso directo', e)
    return json({ error: 'No pudimos entrar con esa cuenta. Intenta de nuevo.' }, 500)
  }
}
