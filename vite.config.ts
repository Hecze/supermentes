import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// El modo "artifact" genera un solo archivo HTML para compartir el prototipo por link.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'artifact' ? './' : '/',
  build:
    mode === 'artifact'
      ? { outDir: 'dist-preview', assetsInlineLimit: 100_000_000, cssCodeSplit: false, modulePreload: false }
      : {},
}))
