#!/bin/bash
# Arma un MP4 de 30 fps con los cuadros de grabador-cdp.mjs, desde el segundo epoch <inicio>.
# Uso: armar-video.sh <carpeta-cuadros> <inicio> <salida.mp4>
# Descarta los cuadros sueltos de otro tamaño (al arrancar `record --cursor` sale alguno a 1x).
set -euo pipefail
dir="$1"; t0="$2"; out="$3"
medida=$(tail -1 "$dir/cuadros.tsv" | cut -f3)
awk -F'\t' -v t0="$t0" -v dir="$dir" -v medida="$medida" '
  $3 == medida { n++; ts[n] = $1; f[n] = $2 }
  END {
    print "ffconcat version 1.0"
    for (i = 1; i <= n; i++) {
      if (i < n && ts[i + 1] <= t0) continue            # cuadros de antes del inicio
      ini = (ts[i] < t0) ? t0 : ts[i]
      dur = (i < n) ? ts[i + 1] - ini : 1 / 30
      printf "file %s/%s\nduration %.4f\n", dir, f[i], dur
    }
    printf "file %s/%s\n", dir, f[n]
  }' "$dir/cuadros.tsv" > "$dir/lista.ffconcat"
ffmpeg -v error -y -f concat -safe 0 -i "$dir/lista.ffconcat" -vf "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2:out_range=tv,format=yuv420p" -color_range tv \
  -c:v libx264 -crf 14 -preset slow -an "$out"
