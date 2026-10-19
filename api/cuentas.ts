// Las funciones de la cuenta de la docente (entrar con la demo, perfil, salones, tareas, intentos y envíos) en una sola
// función de Vercel: el plan Hobby permite 12 por despliegue. vercel.json reescribe /api/salones, /api/tareas… a
// /api/cuentas?ruta=…, así que para la app las rutas no cambian.
import * as entrarDemo from './_entrar-demo.js'
import * as intentos from './_intentos.js'
import * as misEnvios from './_mis-envios.js'
import * as perfil from './_perfil.js'
import * as salones from './_salones.js'
import * as tareas from './_tareas.js'

type Handler = (request: Request) => Promise<Response>

const RUTAS: Record<string, Partial<Record<string, Handler>>> = {
  'entrar-demo': entrarDemo,
  intentos,
  'mis-envios': misEnvios,
  perfil,
  salones,
  tareas,
}

function despachar(request: Request) {
  const url = new URL(request.url)
  // Con la reescritura llega ?ruta=salones; si no, la ruta original (/api/salones).
  const ruta = url.searchParams.get('ruta') ?? url.pathname.split('/').filter(Boolean).pop() ?? ''
  const fn = RUTAS[ruta]?.[request.method]
  return fn ? fn(request) : Promise.resolve(new Response('No encontrado', { status: 404 }))
}

export const GET = despachar
export const POST = despachar
