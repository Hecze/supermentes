# Presentación del pitch

Deck en vivo: https://www.supermentes.app/presentacion/ (flechas, espacio o clic; `#2` abre la solución).
Se arma con `node presentacion/armar.mjs`, que corre solo en el build: editar `slides/*.html` o el orden en
`deck.json` y hacer push lo publica. El original en Slides de claude.ai quedó como respaldo.

Por regla del evento, el deck tiene **3 diapositivas**: problema, solución y tracción.

Aquí va una copia del contenido para que quede mapeado: `deck.json` (orden y fuentes) y `slides/*.html`
(una diapositiva por archivo, con las notas para hablar en `<aside>`). Se edita aquí.

El slide `solucion` usa `demo.mp4` (30 s, 1080×1200, sin audio) y `demo-poster.jpg`; el slide `traccion` usa
`entrevista.png` (captura de la entrevista con Lucho y Yessly). `armar.mjs` copia los tres a `/presentacion/`
en el build. El video va en bucle y sin volumen.

Guion (18-oct): problema compacto con la noche en vela de Lucho y las 7 h no pagadas de la ENDO 2021; solución con el Hub que ahorra 6 de esas 7 h y el video de la demo; tracción de 5 en lista de espera, 3 entrevistados y 1 que pagó y lo usa en 2 colegios. Cierra con «Que ningún docente tenga que amanecer preparando su clase».
