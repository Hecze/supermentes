import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const raiz = fileURLToPath(new URL('.', import.meta.url))
const repo = resolve(raiz, '../..')

// En desarrollo, /j/ABC234 (y la tarea /t/ABC234) abre la página del alumno, como hace vercel.json en producción.
const rutasDelAlumno: Plugin = {
  name: 'rutas-del-alumno',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url && /^\/[jt]\/[A-Za-z0-9]{6}\/?(\?.*)?$/.test(req.url)) req.url = '/j/index.html'
      next()
    })
  },
}

// En desarrollo, /api/<nombre> corre la función de Vercel de api/<nombre>.ts, como en producción.
// Las claves (OPENROUTER_API_KEY, AI_MODEL…) salen del .env.local de la raíz del repo.
const funcionesDeVercel: Plugin = {
  name: 'funciones-de-vercel',
  configureServer(server) {
    Object.assign(process.env, loadEnv('development', repo, ''))
    server.watcher.add(resolve(repo, 'api')) // para que un cambio en api/ se vea sin reiniciar
    server.middlewares.use(async (req, res, next) => {
      const nombre = req.url?.match(/^\/api\/([a-z-]+)(?:\?|$)/)?.[1]
      if (!nombre) return next()
      try {
        // Las rutas de la cuenta (perfil, salones, tareas…) viven en api/_<ruta>.ts y las atiende api/cuentas.ts,
        // como hace la reescritura de vercel.json en producción.
        const archivo = existsSync(resolve(repo, `api/${nombre}.ts`)) || !existsSync(resolve(repo, `api/_${nombre}.ts`)) ? nombre : 'cuentas'
        const modulo = await server.ssrLoadModule(resolve(repo, `api/${archivo}.ts`))
        const manejar = modulo[req.method ?? 'GET']
        if (!manejar) return void res.writeHead(405).end()
        const partes: Buffer[] = []
        for await (const parte of req) partes.push(parte as Buffer)
        const cuerpo = req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(partes)
        const respuesta: Response = await manejar(
          new Request(`http://localhost${req.url}`, { method: req.method, headers: req.headers as HeadersInit, body: cuerpo }),
        )
        res.writeHead(respuesta.status, Object.fromEntries(respuesta.headers))
        res.end(Buffer.from(await respuesta.arrayBuffer()))
      } catch (e) {
        next(e)
      }
    })
  },
}

// Tres páginas: la landing en /, la app en /app y los juegos para alumnos en /j.
// El modo "artifact" genera solo la app en un HTML para compartir el prototipo por link.
export default defineConfig(({ mode, command }) => {
  const vistaPrevia = mode === 'artifact'
  // Publicar sin VITE_API=real deja la app en datos de ejemplo (sin IA): que se vea en el log del build.
  if (command === 'build' && !vistaPrevia && (process.env.VITE_API ?? loadEnv(mode, repo, '').VITE_API) !== 'real') {
    console.warn('\n⚠️  VITE_API no es "real": esta versión sale con DATOS DE EJEMPLO (sin IA). Va en .env.production o en el entorno del build: VITE_API=real.\n')
  }
  const blobEnMemoria = command === 'serve' && !loadEnv('development', repo, '').BLOB_READ_WRITE_TOKEN
  const paginas: Record<string, string> = vistaPrevia
    ? { app: resolve(raiz, 'app/index.html') }
    : { inicio: resolve(raiz, 'index.html'), app: resolve(raiz, 'app/index.html'), jugar: resolve(raiz, 'j/index.html') }

  return {
    plugins: [react(), tailwindcss(), rutasDelAlumno, funcionesDeVercel],
    envDir: repo,
    // Sin BLOB_READ_WRITE_TOKEN en el .env.local, las funciones usan un Blob en memoria: compartir juegos, ver
    // resultados y la lista de espera se prueban sin claves y sin tocar los datos de producción.
    resolve: blobEnMemoria ? { alias: { '@vercel/blob': resolve(raiz, 'scripts/blob-en-memoria.mjs') } } : undefined,
    base: vistaPrevia ? './' : '/',
    build: {
      rollupOptions: { input: paginas },
      ...(vistaPrevia && { outDir: 'dist-preview', assetsInlineLimit: 100_000_000, cssCodeSplit: false, modulePreload: false }),
    },
  }
})
