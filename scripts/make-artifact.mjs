// Junta el build de `vite build --mode artifact` en un solo HTML (dist-preview/supermentes.html)
// para publicarlo como link de vista previa del prototipo.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'dist-preview'
const html = readFileSync(join(dir, 'index.html'), 'utf8')

function match(re, what) {
  const m = html.match(re)
  if (!m) throw new Error(`No encontré ${what} en ${dir}/index.html`)
  return m
}

const title = match(/<title>[\s\S]*?<\/title>/, 'el <title>')[0]
const metas = html.match(/<meta name="claude:[^>]*>/g) ?? []
const fonts = html.match(/<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>/g) ?? []
const cssPath = match(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/, 'el CSS')[1]
const jsPath = match(/<script type="module"[^>]*src="\.\/(assets\/[^"]+\.js)"[^>]*><\/script>/, 'el JS')[1]

const css = readFileSync(join(dir, cssPath), 'utf8')
const js = readFileSync(join(dir, jsPath), 'utf8').replace(/<\/script/gi, '<\\/script')

const out = [title, ...metas, ...fonts, `<style>${css}</style>`, '<div id="root"></div>', `<script type="module">${js}</script>`].join('\n')
writeFileSync(join(dir, 'supermentes.html'), out)
console.log(`Listo: ${dir}/supermentes.html (${(out.length / 1024).toFixed(0)} KB)`)
