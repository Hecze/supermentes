# TikTok de Supermentes

Video vertical (1080x1920, 30 fps, ~42 s, sin audio) con la app real en vista de celular: gancho,
búsqueda del tema, ficha, canción, examen, juego con QR y cierre. Adaptado del pipeline de los demos de
PeakGym (agent-browser + capturas por CDP a 3x + [fframes](https://github.com/dmtrKovalenko/fframes)).

- `grabar.sh`: graba la toma completa con IA real → `fuente/toma.mp4` (1170x2532) y
  `fuente/pasos-relativos.tsv` (segundo de cada paso y de cada toque, con su x, y en píxeles CSS).
- `src/pasos.rs`: el guion (tramos de la toma, velocidad, texto y zoom de cada paso). `src/lib.rs`: el diseño.
- `render.sh`: corta los tramos y deja todo en `~/Downloads/supermentes-tiktok/`: el video final,
  `tomas/*.mp4` (un clip limpio por paso, sin textos, para montar bajo otra narración) y la toma cruda.

## Regrabar

```bash
brew install pkg-config ffmpeg x264 x265 opus nasm ninja    # una vez
cd ~/Projects/supermentes && npm run dev -w @supermentes/web -- --port 5180 --strictPort   # en otra terminal
cd demos/tiktok
bash grabar.sh      # ~2 min; navegador propio y sin cabeza, sesión nueva por toma
./render.sh         # la primera vez compila (~2 min)
```

La IA tarda distinto en cada toma: después de regrabar, ajusta `desde` / `hasta` de `src/pasos.rs` con
los tiempos de `fuente/pasos-relativos.tsv` (`LISTO ficha`, `LISTO cancion`, …) y revisa:

```bash
cargo run --release --bin cortes -- fuente
cargo run --release --bin edicion -- timeline
cargo run --release --bin edicion -- strip all -n 16 --columns 8   # hoja de cuadros (strip.png)
```

Notas: `AGENT_BROWSER_ARGS` va separado por comas (con espacios Chrome ignora el factor 3x) y
`set viewport 390 844 3` debe llevar el 3; sin eso las capturas salen a 1x.
