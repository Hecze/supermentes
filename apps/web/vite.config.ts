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

// Tres páginas: la landing en /, la app en /app y los juegos para alumnos en /j.
// El modo "artifact" genera solo la app en un HTML para compartir el prototipo por link.
export default defineConfig(({ mode }) => {
  const vistaPrevia = mode === 'artifact'
  const paginas: Record<string, string> = vistaPrevia
    ? { app: resolve(raiz, 'app/index.html') }
    : { inicio: resolve(raiz, 'index.html'), app: resolve(raiz, 'app/index.html'), jugar: resolve(raiz, 'j/index.html') }

  return {
    plugins: [react(), tailwindcss(), rutasDelAlumno],
    base: vistaPrevia ? './' : '/',
    build: {
      rollupOptions: { input: paginas },
      ...(vistaPrevia && { outDir: 'dist-preview', assetsInlineLimit: 100_000_000, cssCodeSplit: false, modulePreload: false }),
    },
  }
})
