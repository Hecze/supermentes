// Galería para revisar a ojo los tipos de pregunta de los exámenes listos: varias versiones de cada tipo, con su
// dibujo, sus alternativas y la respuesta. No es parte de la app.
//
//   node scripts/muestras-examen.mjs <salida.html> [filtro de tipo o tema] [versiones por tipo]
//
// Luego se abre el HTML en el navegador (o se le toma una captura con Playwright).
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const [salida = 'muestras-examen.html', filtro = '', cuantas = '4'] = process.argv.slice(2)
const raiz = fileURLToPath(new URL('..', import.meta.url))
const vite = await createServer({ root: raiz, configFile: false, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false } })
try {
  const { TIPOS, gruposDe } = await vite.ssrLoadModule('/src/examenes/catalogo.ts')
  const { crearAzar } = await vite.ssrLoadModule('/src/juegos/motor/azar.ts')
  const matematica = (await import('../src/banco/primaria-4/matematica.json', { with: { type: 'json' } })).default
  const temaDe = new Map()
  for (const g of gruposDe('primaria-4')) for (const [tema, ids] of Object.entries(g.temas)) for (const id of ids) temaDe.set(id, [...(temaDe.get(id) ?? []), tema])
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
  const f = filtro.toLowerCase()
  const tipos = [...TIPOS.values()].filter((t) => !f || t.id.includes(f) || (temaDe.get(t.id) ?? []).some((x) => x.toLowerCase().includes(f)))
  let html = `<!doctype html><meta charset="utf-8"><title>Muestras de examen</title><style>
    body{font-family:Arial,sans-serif;margin:24px;background:#f5f5f5;color:#111}
    .tipo{background:#fff;border:1px solid #ccc;border-radius:12px;padding:16px;margin:0 0 24px}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:16px}
    .item{border:1px dashed #bbb;border-radius:8px;padding:12px}
    .item svg{max-width:100%;height:auto}
    .ok{color:#0a7a3d;font-weight:bold} .meta{color:#666;font-size:12px}
  </style><h1>Muestras: ${esc(filtro || 'todos los tipos')}</h1>`
  for (const t of tipos) {
    const banco = matematica.find((x) => (temaDe.get(t.id) ?? []).includes(x.tema)) ?? matematica[1]
    html += `<section class="tipo"><h2>${esc(t.nombre)} <small class="meta">${esc(t.id)} · ${esc((temaDe.get(t.id) ?? []).join(', '))}</small></h2><p class="meta">${esc(t.citas?.['primaria-4'] ?? 'cita del tema en el banco')}</p><div class="grid">`
    for (let s = 1; s <= Number(cuantas); s++) {
      let g
      try {
        g = t.generar({ azar: crearAzar(s * 7919), banco })
      } catch (e) {
        html += `<div class="item">ERROR: ${esc(e.message)}</div>`
        continue
      }
      if (!g) {
        html += `<div class="item">(null)</div>`
        continue
      }
      html += `<div class="item"><p><b>${esc(g.enunciado)}</b></p>${g.dibujo ? g.dibujo.svg : ''}`
      if (g.pregunta) html += `<p>${esc(g.pregunta)}</p>`
      if (g.forma === 'opciones') html += `<p>${g.alternativas.map((a, i) => `<span class="${i === g.correcta ? 'ok' : ''}">${String.fromCharCode(97 + i)}) ${esc(a)}</span>`).join(' &nbsp; ')}</p>`
      if (g.forma === 'abierta') html += `<p class="ok">Respuesta: ${esc(g.respuesta)} <span class="meta">(${g.espacio})</span></p>`
      if (g.forma === 'unir') html += `<p>${g.izquierda.map((x, i) => `${esc(x)} → <span class="ok">${esc(g.derecha[g.solucion[i]])}</span>`).join('<br>')}</p>`
      if (g.forma === 'completar') html += `<p>[${g.palabras.map(esc).join(' · ')}]<br>${g.frases.map((x, i) => `${esc(x)} <span class="ok">${esc(g.respuestas[i])}</span>`).join('<br>')}</p>`
      if (g.nota) html += `<p class="meta">Nota: ${esc(g.nota)}</p>`
      html += `<p class="meta">clave ${esc(g.clave)}${g.dibujo ? ` · ${g.dibujo.ancho}×${g.dibujo.alto}px · ${esc(g.dibujo.alt)}` : ''}</p></div>`
    }
    html += '</div></section>'
  }
  writeFileSync(salida, html)
  console.log(`Listo: ${tipos.length} tipos en ${salida}`)
} finally {
  await vite.close()
}
