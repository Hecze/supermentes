#!/bin/bash
# Renderiza el TikTok y los clips limpios por paso a partir de fuente/toma.mp4.
#   → $SALIDA/supermentes-tiktok.mp4 (con textos, gancho y cierre)
#   → $SALIDA/tomas/{busqueda,ficha,cancion,examen,juego}.mp4 (1080x1920, sin textos ni zoom, esperas aceleradas)
#   → $SALIDA/toma-cruda.mp4 (la grabación tal cual)
set -euo pipefail
cd "$(dirname "$0")"
SALIDA="${SALIDA:-$HOME/Downloads/supermentes-tiktok}"
mkdir -p "$SALIDA/tomas"
cargo build --release -q
cargo run -q --release --bin cortes -- fuente > /dev/null
out="$SALIDA/supermentes-tiktok.mp4"; rm -f "$out"
cargo run -q --release --bin edicion -- render -o "$out" 2>&1 | grep -v -E "^(frames|rendering|encoding|wrote|/)" || true
[ -s "$out" ] || { echo "No se generó $out"; exit 1; }
echo "→ $out ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out") s)"

# Clips limpios: los mismos tramos de src/pasos.rs (clips/paso-NN.mp4, ya acelerados), centrados sobre el
# color de fondo de la app y unidos con un fundido corto cuando un paso tiene dos tramos.
limpio(){ # nombre clip [clip]
  local nombre="$1"; shift
  local vf="scale=-2:1920:flags=lanczos,pad=1080:1920:(ow-iw)/2:0:color=0x12201a,setsar=1,format=yuv420p"
  if [ $# -eq 1 ]; then
    ffmpeg -v error -y -i "clips/$1" -vf "$vf" -c:v libx264 -crf 16 -preset slow -an "$SALIDA/tomas/$nombre.mp4"
  else
    local d; d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "clips/$1")
    ffmpeg -v error -y -i "clips/$1" -i "clips/$2" -filter_complex \
      "[0]$vf[a];[1]$vf[b];[a][b]xfade=transition=fade:duration=0.3:offset=$(echo "$d - 0.8" | bc)" \
      -c:v libx264 -crf 16 -preset slow -an "$SALIDA/tomas/$nombre.mp4"
  fi
  echo "→ $SALIDA/tomas/$nombre.mp4"
}
limpio busqueda paso-01.mp4
limpio ficha paso-02.mp4 paso-03.mp4
limpio cancion paso-04.mp4 paso-05.mp4
limpio examen paso-06.mp4 paso-07.mp4
limpio juego paso-08.mp4 paso-09.mp4
cp fuente/toma.mp4 "$SALIDA/toma-cruda.mp4"
cp fuente/pasos-relativos.tsv "$SALIDA/toma-cruda-pasos.tsv"
