// La docente que hace la petición, según su token de Clerk (Authorization: Bearer …). Necesita CLERK_SECRET_KEY.
import { verifyToken } from '@clerk/backend'

const ORIGENES = ['https://www.supermentes.app', 'https://supermentes.app', 'https://supermentes.haroldmedrano33.workers.dev', 'http://localhost:5173', 'http://localhost:8787']

/** Id de Clerk de la docente, o null si el token falta o no es válido. */
export async function docente(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '')
  if (!token || !process.env.CLERK_SECRET_KEY) return null
  try {
    const { sub } = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY, authorizedParties: ORIGENES })
    return /^user_[A-Za-z0-9]+$/.test(sub) ? sub : null
  } catch {
    return null
  }
}
