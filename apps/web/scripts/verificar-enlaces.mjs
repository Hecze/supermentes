// Comprueba que cada enlace de Más recursos (src/recursos/recursos.json) siga abriendo. Necesita internet; no corre
// en el build. Uso: npm run verificar:enlaces   (si un enlace cambió, se corrige en recursos.json con la fecha nueva).
import { readFile } from 'node:fs/promises'

const recursos = JSON.parse(await readFile(new URL('../src/recursos/recursos.json', import.meta.url), 'utf8'))
const enlaces = [
  ...new Map(recursos.flatMap((r) => [r.url, r.pdf, ...(r.partes ?? []).map((p) => p.url)].filter(Boolean).map((url) => [url, { url, titulo: r.titulo }]))).values(),
]

async function abre(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(30_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Supermentes; revisión de enlaces)' },
    })
    await res.body?.cancel()
    return res.ok ? null : `HTTP ${res.status}`
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

const fallas = []
for (let i = 0; i < enlaces.length; i += 6) {
  const lote = enlaces.slice(i, i + 6)
  const res = await Promise.all(lote.map((e) => abre(e.url)))
  res.forEach((error, j) => error && fallas.push(`${lote[j].titulo}: ${lote[j].url} (${error})`))
}
if (fallas.length) {
  console.error(`✗ ${fallas.length} de ${enlaces.length} enlaces no abren:\n- ${fallas.join('\n- ')}`)
  process.exitCode = 1
} else {
  console.log(`✓ Los ${enlaces.length} enlaces de Más recursos abren.`)
}
