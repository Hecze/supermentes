// Cobertura de juegos y canciones por tema, apenas se crea el tema (sin esperar a la IA).
//   npm run cobertura                → resumen por nivel
//   npm run cobertura -- primaria-4  → resumen del grado y los temas que tienen menos de 2
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const vite = await createServer({ root: raiz, configFile: false, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false } })
try {
  const { cobertura } = await vite.ssrLoadModule('/src/juegos/cobertura.ts')
  const filas = cobertura()
  const grado = process.argv[2]
  const grupos = grado ? [[grado, filas.filter((x) => x.gradoId === grado)]] : ['primaria', 'secundaria'].map((n) => [n, filas.filter((x) => x.nivel === n)])
  for (const [nombre, f] of grupos) {
    const prom = (k) => (f.reduce((n, x) => n + x[k], 0) / Math.max(1, f.length)).toFixed(1)
    console.log(`${nombre}: ${f.length} temas · con ≥2 juegos: ${f.filter((x) => x.juegos >= 2).length} · con ≥2 canciones: ${f.filter((x) => x.canciones >= 2).length} · juegos promedio ${prom('juegos')} · canciones promedio ${prom('canciones')}`)
  }
} finally {
  await vite.close()
}
