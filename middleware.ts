// La app en /app todavía no es pública: solo entra quien tiene el enlace /app?acceso=APP_ACCESO.
// La primera visita con el enlace deja una cookie para que la persona pueda volver sin él.
import { next } from '@vercel/functions'

export const config = { matcher: ['/app', '/app/:path*'] }

const COOKIE = 'sm_acceso'

export default function middleware(request: Request) {
  const clave = process.env.APP_ACCESO
  const url = new URL(request.url)
  if (!clave) return Response.redirect(new URL('/', url), 307)

  if (url.searchParams.get('acceso') === clave) {
    url.searchParams.delete('acceso')
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.pathname + url.search,
        'Set-Cookie': `${COOKIE}=${clave}; Path=/app; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
        'Cache-Control': 'no-store',
      },
    })
  }

  const cookies = (request.headers.get('cookie') ?? '').split(/;\s*/)
  if (cookies.includes(`${COOKIE}=${clave}`)) return next({ headers: { 'Cache-Control': 'no-store' } })

  return Response.redirect(new URL('/', url), 307)
}
