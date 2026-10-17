#!/bin/bash
# Graba la toma del TikTok: el recorrido completo en vista de celular (390x844 a 3x) con IA real.
# Deja fuente/toma.mp4 (1170x2532, 30 fps) y fuente/pasos.tsv (segundo de cada paso y de cada toque,
# con su posición en píxeles CSS: sirve para ubicar tramos y zooms en src/pasos.rs).
# Requiere la app corriendo: npm run dev -w @supermentes/web -- --port 5180 --strictPort
# Uso: bash grabar.sh   (URL=... para otra dirección)
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
URL="${URL:-http://localhost:5180/app/}"
OUT="$DIR/fuente"; mkdir -p "$OUT"; rm -rf "$OUT/cuadros"
TSV="$OUT/pasos.tsv"
# Sesión nueva por toma: el daemon solo lee AGENT_BROWSER_ARGS al arrancar. Navegador propio, perfil limpio.
export AGENT_BROWSER_SESSION="sm-tiktok-$$"
export AGENT_BROWSER_ARGS="--force-device-scale-factor=3,--mute-audio"  # separados por coma

now(){ perl -MTime::HiRes=time -e "printf q{%.3f}, time"; }
ab(){ agent-browser "$@" >/dev/null; }
pausa(){ agent-browser wait "$1" >/dev/null; }
cap(){ echo "$(now)	$1" >> "$TSV"; }
js(){ agent-browser eval "$1" 2>/dev/null | tr -d '"'; }
# Espera (máx $2 s) a que la expresión JS sea verdadera.
hasta(){ local i; for i in $(seq 1 $((${2:-60} * 4))); do [ "$(js "!!($1)")" = "true" ] && return 0; sleep 0.25; done; echo "TIMEOUT: $1" >&2; return 1; }
q(){ jq -Rn --arg s "$1" '$s'; }

# Toque visible: lleva el elemento al centro, dibuja el círculo del dedo y lo toca. Registra x, y.
toca(){
  local t; t=$(q "$1")
  js "__busca($t)?.scrollIntoView({block:'center',behavior:'smooth'})" >/dev/null; pausa 700
  local pos; pos=$(js "__toca($t)")
  [ "$pos" = "null" ] && { echo "No encontré «$1»" >&2; return 1; }
  cap "TOCA $1	$pos"
}
# Desplaza la página (o el diálogo abierto) hasta `top` px en `ms` milisegundos, con aceleración suave.
desliza(){ js "__desliza($1,$2)" >/dev/null; pausa "$2"; }

PREP='(()=>{
  const vis=e=>e.getClientRects().length>0&&getComputedStyle(e).visibility!=="hidden";
  window.__busca=q=>{if(q[0]==="#")return document.querySelector(q);q=q.toLowerCase();const es=[...document.querySelectorAll("button,a,summary,[role=button],select,input")].filter(vis);
    return es.find(e=>(e.getAttribute("aria-label")||e.textContent||"").trim().toLowerCase()===q)||es.find(e=>(e.getAttribute("aria-label")||e.textContent||"").toLowerCase().includes(q));};
  window.__dedo=(x,y)=>{const d=document.createElement("div");Object.assign(d.style,{position:"fixed",left:x-22+"px",top:y-22+"px",width:"44px",height:"44px",borderRadius:"50%",background:"rgba(255,255,255,.55)",border:"3px solid rgba(255,255,255,.9)",boxShadow:"0 0 0 6px rgba(0,0,0,.18)",zIndex:2147483647,pointerEvents:"none",transition:"transform .45s ease-out, opacity .45s ease-out"});
    document.documentElement.appendChild(d);requestAnimationFrame(()=>requestAnimationFrame(()=>{d.style.transform="scale(1.7)";d.style.opacity="0"}));setTimeout(()=>d.remove(),600);};
  window.__toca=q=>{const e=__busca(q);if(!e)return null;const r=e.getBoundingClientRect();const x=Math.round(r.left+r.width/2),y=Math.round(r.top+r.height/2);
    __dedo(x,y);setTimeout(()=>{if(e.tagName==="SELECT"||e.tagName==="INPUT")e.focus();else e.click()},140);return x+","+y;};
  window.__desliza=(top,ms)=>{const dlg=document.querySelector("dialog[open]");const el=dlg||document.scrollingElement;const y0=el.scrollTop,t0=performance.now();
    const f=t=>{const p=Math.min(1,(t-t0)/ms),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;el.scrollTop=y0+(top-y0)*e;if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f);};
})()'

ab set viewport 390 844 3
ab set media dark
ab open "$URL"; pausa 2500
js "$PREP" >/dev/null

node "$DIR/grabador-cdp.mjs" "$(agent-browser get cdp-url)" "$OUT/cuadros" & GRABADOR=$!; pausa 1000
echo "$(now)	START" > "$TSV"

# 2. Elige su tema del Currículo Nacional
cap "PASO tema"; pausa 1200
toca "Buscar mi tema"; pausa 1200
toca "#nuevo-tema-curso"; ab select '#nuevo-tema-curso' "Matemática"; pausa 900
toca "#nuevo-tema-buscar"; pausa 300
for c in f r a c c i o n e s; do agent-browser keyboard type "$c" >/dev/null; done; pausa 1000
toca "Fracciones usuales"; pausa 2600

# 3. La IA arma la ficha
cap "PASO ficha"
toca "Preparar tema"
hasta 'document.body.innerText.includes("¿Qué necesitas para tu clase?")' 90 && cap "LISTO ficha"; pausa 1300
# La ficha (propósito, ideas, palabras clave) está plegada al final: se abre y se recorre.
toca "Revisa lo que entendimos"; pausa 700
desliza "$(js "Math.round(document.querySelector('main details').getBoundingClientRect().top+scrollY-70)")" 1400; pausa 600
desliza "$(js "Math.round(scrollY+420)")" 2400; pausa 1200
desliza 0 900; pausa 300

# 4. Canción con ritmo de cumbia
cap "PASO cancion"
toca "Una canción"; pausa 1300
toca "Cumbia"; pausa 800
toca "Crear la canción"
hasta 'document.body.innerText.includes("Imprimir la letra")' 90 && cap "LISTO cancion"; pausa 1200
desliza 1500 5500; pausa 800

# 5. Examen de fútbol en formato misión
cap "PASO examen"
desliza 0 600
toca "Abrir menú"; pausa 900
toca "Examen gamificado"; pausa 1300
toca "Fútbol"; pausa 700
toca "Más opciones"; pausa 900
toca "Una misión con niveles"; pausa 900
toca "Crear el examen"
hasta 'document.body.innerText.includes("Ver respuestas")' 90 && cap "LISTO examen"; pausa 1200
desliza 1200 5000; pausa 800

# 6. Juego y QR
cap "PASO juego"
desliza 0 600
toca "Abrir menú"; pausa 900
toca "Juego web"; pausa 1500
toca "Globos"; pausa 1500
toca "¡Jugar!"; pausa 5000
toca "Enviar a las familias"; pausa 1200
js "document.querySelector('[aria-label=\"Mostrar el código QR en grande\"]')?.scrollIntoView({block:'center',behavior:'smooth'})" >/dev/null; pausa 3000
cap "FIN"

kill $GRABADOR; wait $GRABADOR 2>/dev/null
"$DIR/armar-video.sh" "$OUT/cuadros" "$(head -1 "$TSV" | cut -f1)" "$OUT/toma.mp4"
agent-browser close >/dev/null 2>&1 || true
# Tiempos relativos al inicio, para pasos.rs.
awk -F'\t' 'NR==1{t0=$1;next}{printf "%6.2f\t%s\t%s\t%s\n",$1-t0,$2,$3,$4}' "$TSV" > "$OUT/pasos-relativos.tsv"
cat "$OUT/pasos-relativos.tsv"
echo "$OUT/toma.mp4"
