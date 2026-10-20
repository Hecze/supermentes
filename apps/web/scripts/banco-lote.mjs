// Lo que necesita quien escribe el banco de un grado y área (ver src/banco/README.md): los desempeños oficiales,
// numerados por competencia, y la lista exacta de temas con la competencia que les toca.
//   node scripts/banco-lote.mjs secundaria-1 ciencia-y-tecnologia
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const [gradoId, areaId] = process.argv.slice(2)
if (!gradoId || !areaId) {
  console.error('Uso: node scripts/banco-lote.mjs <gradoId> <areaId>')
  process.exit(1)
}

const raiz = fileURLToPath(new URL('..', import.meta.url))
const vite = await createServer({ root: raiz, configFile: false, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false } })
try {
  const { temasDe } = await vite.ssrLoadModule('/src/curriculo/buscar.ts')
  const nivel = (await import(`../../../packages/curriculo/data/${gradoId.split('-')[0]}.json`, { with: { type: 'json' } })).default
  const grado = nivel.grados.find((g) => g.id === gradoId)
  const area = grado?.areas.find((a) => a.id === areaId)
  if (!area) throw new Error(`No hay ${areaId} en ${gradoId}.`)

  const salida = [`# ${area.nombre} · ${grado.nombre} (ciclo ${grado.ciclo})`, '', 'Fuente: ' + nivel.fuente.titulo, '']
  area.competencias.forEach((c, i) => {
    salida.push(`## Competencia ${i + 1}: ${c.nombre}`, '')
    if (c.capacidades.length) salida.push('Capacidades:', ...c.capacidades.map((x) => `- ${x}`), '')
    salida.push('Desempeños (texto oficial; la cita sale de aquí, letra por letra):')
    c.desempenos.forEach((d, j) => salida.push(`${i + 1}.${j + 1}. ${d}`))
    if (!c.desempenos.length) salida.push('(sin desempeños en este grado)')
    salida.push('')
  })
  const temas = temasDe(area).map((t) => ({ tema: t.tema, ...(t.indiceCompetencia !== undefined && { competencia: t.indiceCompetencia + 1 }) }))
  salida.push(`## Temas (${temas.length}, escritos tal cual)`, '', 'Si trae `competencia`, la cita tiene que ser de esa competencia. Si no, elige la que mejor lo respalde.', '')
  salida.push(JSON.stringify(temas, null, 1))
  console.log(salida.join('\n'))
} finally {
  await vite.close()
}
