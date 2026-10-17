import type { IncomingMessage } from 'node:http'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const raiz = fileURLToPath(new URL('.', import.meta.url))

// En desarrollo, /j/ABC234 abre la página del alumno, como hace vercel.json en producción.
const rutasDelAlumno: Plugin = {
  name: 'rutas-del-alumno',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url && /^\/j\/[A-Za-z0-9]{6}\/?(\?.*)?$/.test(req.url)) req.url = '/j/index.html'
      next()
    })
  },
}

/**
 * En desarrollo, las funciones de juegos compartidos y resultados corren dentro de Vite con un Vercel Blob
 * en memoria (scripts/blob-en-memoria.mjs): así se prueba compartir y ver resultados sin claves de Vercel.
 */
const apiDeJuegosLocal: Plugin = {
  name: 'api-de-juegos-local',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const nombre = /^\/api\/(juegos-compartidos|resultados)(\?|$)/.exec(req.url ?? '')?.[1]
      if (!nombre) return next()
      try {
        const modulo = (await server.ssrLoadModule(resolve(raiz, `../../api/${nombre}.ts`))) as Record<string, (r: Request) => Promise<Response>>
        const atender = modulo[req.method ?? 'GET']
        if (!atender) {
          res.statusCode = 405
          return res.end()
        }
        const cuerpo = req.method === 'GET' || req.method === 'HEAD' ? undefined : await leerCuerpo(req)
        const respuesta = await atender(new Request(`http://localhost${req.url}`, { method: req.method, body: cuerpo, headers: { 'content-type': req.headers['content-type'] ?? 'application/json' } }))
        res.statusCode = respuesta.status
        respuesta.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await respuesta.arrayBuffer()))
      } catch (e) {
        next(e)
      }
    })
  },
}

function leerCuerpo(req: IncomingMessage) {
  return new Promise<string>((ok, mal) => {
    let datos = ''
    req.on('data', (parte) => (datos += parte))
    req.on('end', () => ok(datos))
    req.on('error', mal)
  })
}

// Tres páginas: la landing en /, la app en /app y los juegos para alumnos en /j.
// El modo "artifact" genera solo la app en un HTML para compartir el prototipo por link.
export default defineConfig(({ mode, command }) => {
  const vistaPrevia = mode === 'artifact'
  const paginas: Record<string, string> = vistaPrevia
    ? { app: resolve(raiz, 'app/index.html') }
    : { inicio: resolve(raiz, 'index.html'), app: resolve(raiz, 'app/index.html'), jugar: resolve(raiz, 'j/index.html') }

  return {
    plugins: [react(), tailwindcss(), rutasDelAlumno, apiDeJuegosLocal],
    resolve: command === 'serve' ? { alias: { '@vercel/blob': resolve(raiz, 'scripts/blob-en-memoria.mjs') } } : undefined,
    base: vistaPrevia ? './' : '/',
    build: {
      rollupOptions: { input: paginas },
      ...(vistaPrevia && { outDir: 'dist-preview', assetsInlineLimit: 100_000_000, cssCodeSplit: false, modulePreload: false }),
    },
  }
})
