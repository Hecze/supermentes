// Arma el deck como una página propia: supermentes.app/presentacion. Lee deck.json (orden y fuentes) y slides/*.html,
// y escribe apps/web/public/presentacion/index.html. Corre solo en el build de la web (apps/web/package.json), así
// editar una diapositiva aquí y hacer push la publica. Flechas, espacio o clic para avanzar; #3 abre la tercera.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const deck = JSON.parse(readFileSync(join(aqui, 'deck.json'), 'utf8'))

// Los íconos del formato de Slides (<x-icon name>) pasan a SVG de Lucide. ponytail: solo los que usa el deck hoy.
const ICONOS = {
  Users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  Home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  Globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
}
const icono = (_, nombre, estilo) => {
  if (!ICONOS[nombre]) throw new Error(`presentacion/armar.mjs: falta el ícono «${nombre}» en ICONOS`)
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${estilo}">${ICONOS[nombre]}</svg>`
}

const slides = deck.order
  .map((id) => readFileSync(join(aqui, 'slides', `${id}.html`), 'utf8').trim())
  .map((s) => s.replace(/<x-icon name="(\w+)" style="([^"]*)"><\/x-icon>/g, icono))
  .join('\n')
const fuentes = Object.values(deck.faces)
  .filter((f) => f.href)
  .map((f) => `<link rel="stylesheet" href="${f.href}">`)
  .join('\n')

const pagina = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${deck.title.replace(/—.*/, '').trim()} · presentación</title>
<link rel="icon" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
${fuentes}
<style>
  html, body { margin: 0; height: 100%; background: #111; overflow: hidden; }
  #escena { position: absolute; left: 50%; top: 50%; width: 1920px; height: 1080px; transform-origin: center; }
  section { position: absolute; inset: 0; box-sizing: border-box; }
  /* Cada diapositiva trae su display en línea: solo se ocultan las demás. */
  section:not(.activa) { display: none !important; }
  section * { margin: 0; box-sizing: border-box; }
  section ul, section ol { padding-left: 1.2em; }
  section aside { display: none !important; }
  #pie { position: fixed; right: 16px; bottom: 12px; font: 14px system-ui, sans-serif; color: #999; }
</style>
</head>
<body>
<div id="escena">
${slides}
</div>
<div id="pie"></div>
<script>
  const s = [...document.querySelectorAll('#escena > section')]
  const videos = [...document.querySelectorAll('#escena video')]
  let i = Math.min(s.length - 1, Math.max(0, (parseInt(location.hash.slice(1)) || 1) - 1))
  const mostrar = () => {
    s.forEach((x, j) => x.classList.toggle('activa', j === i))
    videos.forEach((v) => {
      if (v.closest('section').classList.contains('activa')) {
        try { v.currentTime = 0 } catch {}
        v.play().catch(() => {})
      } else {
        v.pause()
      }
    })
    document.getElementById('pie').textContent = (i + 1) + ' / ' + s.length
    history.replaceState(null, '', '#' + (i + 1))
  }
  const ajustar = () => {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080)
    document.getElementById('escena').style.transform = 'translate(-50%, -50%) scale(' + k + ')'
  }
  const ir = (d) => { i = Math.min(s.length - 1, Math.max(0, i + d)); mostrar() }
  addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown'].includes(e.key)) ir(1)
    if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) ir(-1)
  })
  addEventListener('click', (e) => ir(e.clientX < innerWidth / 3 ? -1 : 1))
  addEventListener('resize', ajustar)
  addEventListener('hashchange', () => { const n = parseInt(location.hash.slice(1)); if (n && n - 1 !== i) { i = Math.min(s.length - 1, Math.max(0, n - 1)); mostrar() } })
  ajustar(); mostrar()
</script>
</body>
</html>
`

const salida = join(aqui, '..', 'apps', 'web', 'public', 'presentacion')
mkdirSync(salida, { recursive: true })
writeFileSync(join(salida, 'index.html'), pagina)
copyFileSync(join(aqui, 'demo.mp4'), join(salida, 'demo.mp4'))
copyFileSync(join(aqui, 'demo-poster.jpg'), join(salida, 'demo-poster.jpg'))
console.log(`Presentación: ${deck.order.length} diapositivas → apps/web/public/presentacion/index.html (+ demo.mp4)`)
