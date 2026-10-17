import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const raiz = fileURLToPath(new URL('.', import.meta.url))

// Dos páginas: la landing en / y la app en /app.
// El modo "artifact" genera solo la app en un HTML para compartir el prototipo por link.
export default defineConfig(({ mode }) => {
  const vistaPrevia = mode === 'artifact'
  const paginas: Record<string, string> = vistaPrevia
    ? { app: resolve(raiz, 'app/index.html') }
    : { inicio: resolve(raiz, 'index.html'), app: resolve(raiz, 'app/index.html') }

  return {
    plugins: [react(), tailwindcss()],
    base: vistaPrevia ? './' : '/',
    build: {
      rollupOptions: { input: paginas },
      ...(vistaPrevia && { outDir: 'dist-preview', assetsInlineLimit: 100_000_000, cssCodeSplit: false, modulePreload: false }),
    },
  }
})
