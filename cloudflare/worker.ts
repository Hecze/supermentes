// Supermentes en Cloudflare: la app estática (apps/web/dist) y las funciones de api/ en un solo Worker.
// Las mismas rutas que vercel.json.
import * as audio from '../api/audio.js'
import * as cancion from '../api/cancion.js'
import * as ficha from '../api/ficha.js'
import * as intentos from '../api/intentos.js'
import * as juego from '../api/juego.js'
import * as juegosCompartidos from '../api/juegos-compartidos.js'
import * as listaEspera from '../api/lista-espera.js'
import * as misEnvios from '../api/mis-envios.js'
import * as perfil from '../api/perfil.js'
import * as recursos from '../api/recursos.js'
import * as resultados from '../api/resultados.js'
import * as salones from '../api/salones.js'
import * as sesion from '../api/sesion.js'
import * as tareas from '../api/tareas.js'

type Handler = (request: Request) => Promise<Response>
const API: Record<string, Record<string, Handler>> = {
  audio,
  cancion,
  ficha,
  intentos,
  juego,
  'juegos-compartidos': juegosCompartidos,
  'lista-espera': listaEspera,
  'mis-envios': misEnvios,
  perfil,
  recursos,
  resultados,
  salones,
  sesion,
  tareas,
}

async function api(request: Request, nombre: string, ctx: ExecutionContext) {
  const fn = API[nombre]?.[request.method]
  if (!fn) return new Response('No encontrado', { status: 404 })
  // Vercel guarda en su CDN las respuestas con s-maxage (Exa, contador de la lista); aquí lo hace la Cache API.
  // ponytail: la Cache API no guarda nada en *.workers.dev, solo con dominio propio.
  if (request.method !== 'GET') return fn(request)
  const guardada = await caches.default.match(request)
  if (guardada) return guardada
  const r = await fn(request)
  const maxAge = /s-maxage=(\d+)/.exec(r.headers.get('Cache-Control') ?? '')?.[1]
  if (r.ok && maxAge) {
    const copia = new Response(r.clone().body, r)
    copia.headers.set('Cache-Control', `public, max-age=${maxAge}`)
    ctx.waitUntil(caches.default.put(request, copia))
  }
  return r
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const nombre = /^\/api\/([\w-]+)\/?$/.exec(url.pathname)?.[1]
    if (nombre) return api(request, nombre, ctx)
    // /app/sso-callback, /app/factor-one…: los pasos de entrar de Clerk viven bajo /app.
    if (/^\/app(\/[\w-]+)*\/?$/.test(url.pathname)) url.pathname = '/app/'
    // /t/CODIGO es una tarea: la abre la misma página del alumno.
    else if (/^\/[jt]\/[^/]+\/?$/.test(url.pathname)) url.pathname = '/j/'
    else return env.ASSETS.fetch(request)
    return env.ASSETS.fetch(new Request(url, request))
  },
} satisfies ExportedHandler<{ ASSETS: Fetcher }>
