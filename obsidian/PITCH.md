---
actualizado: 2026-10-17
---

# Pitch — Hack the Andes 2026

> 3 minutos + 2 de preguntas, desde los enlaces entregados (no se conecta la laptop). Las cifras y sus
> fuentes están en [[NEGOCIO]]; el evento, en [[HACKATHON]]; qué debe funcionar, en [[MVP]].

**Presentación:** https://claude.ai/artifact/DKrH3Xuqr7huT7JMdgyd2L (10 láminas para el pitch + 5 de anexo
para preguntas). Cada lámina trae su guion en las notas del orador. Es privada hasta que Hector la comparta
desde *Share* (o la exporte a PDF / PowerPoint / Google Slides desde ahí).

## Antes de las 9:00
- [ ] Compartir la presentación con enlace público y abrirla en una **ventana privada**.
- [ ] Lámina "Tracción": reemplazar cada `[N]` (total en `/api/lista-espera`; invitados en el CSV; juegos
      compartidos en Vercel Blob, prefijo `juegos/`). Si un número es 0, quitar la fila.
- [ ] Lámina "Qué funciona hoy": si ya están `ANTHROPIC_API_KEY` y `VITE_API=real` en producción, pasar
      "Ficha, examen y letra con IA" a "Ya funciona" y mostrar la ficha en la demo.
- [ ] Ensayar con cronómetro: el guion son ~440 palabras + 30 s de demo.
- [ ] Probar la demo desde el link de producción: `/app` → 4.º de primaria → Matemática → fracciones →
      Juegos → Globos → "Enviar a las familias" (código + QR).

## Guion (3:00)
| Tiempo | Lámina | Qué decir |
| --- | --- | --- |
| 0:00 | Portada | Somos Dropout Hack. Supermentes ayuda a los docentes del Perú a crear canciones, juegos y exámenes para su clase en minutos, a partir del Currículo Nacional. |
| 0:10 | El problema | 7 de cada 10 escolares de 15 años no llegan al mínimo en matemática y solo 1 de cada 3 niños de cuarto lee bien. Una clase con juegos y canciones engancha más, pero prepararla toma horas: 2 de cada 3 docentes públicos dedican más de 3 horas por semana, fuera de su horario, a preparar clases y papeleo. Y la IA que existe está pensada para Estados Unidos. |
| 0:30 | Para quién | Son 553 mil docentes. Casi todos tienen celular, pero solo 1 de cada 4 escuelas públicas tiene internet, y 9 de cada 10 quieren aprender IA aunque solo un tercio la usó. Si algo necesita explicación, no les sirve. |
| 0:42 | La solución | Por eso no es un chat. El docente busca su tema en el currículo, elige solo lo que va a usar (canción con ritmo de cumbia o huayno, juego, examen, crucigrama o versión para inclusión) y lo imprime, lo proyecta o lo manda al WhatsApp de las familias. |
| 0:57 | Qué funciona hoy | **Demo de 30 s.** Código y QR: cualquiera puede jugar ahora, sin cuenta. Estamos terminando la IA de la ficha, el examen y la letra (el backend con Claude ya está), las preguntas del tema para los juegos y el audio. |
| 1:30 | Lo técnico | El currículo hecho datos: 2 mil desempeños y 5 mil temas, la secundaria con OCR. El cálculo de los juegos lo generan algoritmos: gratis, sin fin y siempre correcto. La IA responde validada contra un esquema, desde los desempeños del grado. |
| 1:45 | Evidencia | Quien usa IA cada semana ahorra casi 6 horas. 86 mil docentes peruanos se inscribieron al curso de IA del MINEDU. Y ya pagan: apps peruanas cobran de 5 a 50 soles por Yape, solo por sesiones en documento. Nadie hace canciones ni juegos a partir del currículo. |
| 2:05 | Modelo de negocio | El docente empieza gratis; el Pase Profe cuesta 14.90 por 30 días, por Yape. Los colegios privados pagan 120 soles por docente al año. Con el Estado, pilotos: 625 proyectos del FONDEP ya pueden comprar software. Cada material nos cuesta 3 centavos de dólar: 70% de margen. |
| 2:25 | Tracción | Hoy tenemos [N] docentes en la lista de espera y [N] juegos compartidos. En 30 días: 300 docentes, 50 que vuelvan por un segundo tema y 3 colegios piloto. |
| 2:45 | Cierre | Queremos que una clase que se canta y se juega tome minutos, no noches. Buscamos colegios piloto y docentes que lo prueben: escaneen el código. Gracias. |

## Preguntas probables
- **¿Quién paga si el docente público gana poco?** El pase cuesta el 0.4% del sueldo de entrada y ya pagan
  S/ 4.90–49.90 a apps peruanas por Yape. Pero el negocio grande es institucional: colegios privados y
  pilotos con el Estado (FONDEP, UGEL). Lámina "Quién paga y cuánto".
- **¿Y si la IA se equivoca?** Todo parte de los desempeños del grado, con salida validada contra un esquema;
  el docente revisa y corrige con un clic. No calificamos a nadie (D.S. 115-2025-PCM). Lámina "Riesgos".
- **¿Por qué no usar ChatGPT, Gemini o Khanmigo gratis?** Son chats que no parten del CNEB; el docente con
  poca experiencia digital no sabe qué pedir. Nosotros damos la canción y el juego listos. Lámina "Competencia".
- **¿Cuánto les cuesta un docente?** ~US$ 1.3 al mes con uso típico. Lámina "Lo que cuesta cada material".
- **¿Qué validaron con docentes?** Una entrevista a fondo y la lista de espera. Lo honesto es decir eso y
  mostrar qué medimos: docentes que vuelven por un segundo tema, juegos jugados, invitados.
- **¿Qué es real y qué es idea?** Real: currículo, buscador, 12 juegos con QR, crucigrama, lista de espera y
  el backend de ficha, examen y letra. Idea o en curso: audio, preguntas del tema para juegos, inclusión,
  cuentas y pagos.
