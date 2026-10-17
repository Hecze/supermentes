# Supermentes

**Crea canciones, juegos y exámenes para tu clase en minutos, a partir del Currículo Nacional del Perú.**

- App: https://www.supermentes.app
- Repo: https://github.com/Hecze/supermentes
- Equipo: Dropout Hack (Hector Zerrillo y Harold Medrano), track Educación Escolar.

## El problema

Preparar material que enganche a los alumnos toma horas, y sin él los alumnos se distraen. Muchos docentes no tienen su clase en PDF: la saben de memoria o usan el libro que les da el colegio. Las herramientas que existen (MagicSchool, SchoolHub) están pensadas para otros países, casi siempre en inglés, y ninguna trabaja con el Currículo Nacional de Educación Básica (CNEB).

## Para quién

Docentes de inicial, primaria y secundaria del Perú, sobre todo de colegios públicos. Tienen poca experiencia digital, preparan la clase en laptop y muchas veces son los únicos del aula con celular e internet.

## Cómo funciona

1. **Busca tu tema** en el Currículo Nacional: grado, curso y tema. Cada tema llega con su competencia y sus desempeños, así que lo que se genera corresponde al grado.
2. El docente elige **solo lo que va a usar**:
   - **Juego web** para proyectar o jugar en el celular. Los alumnos entran con un código o un QR, sin cuenta.
   - **Crucigrama** con las palabras y pistas del propio docente, listo para imprimir.
   - **Canción** con ritmo peruano (cumbia, huayno, festejo).
   - **Examen gamificado**, ambientado en lo que le gusta a la clase.
   - **Adaptación para inclusión**: versión para quien le cuesta concentrarse, tiene dislexia o necesita lectura fácil.
3. Todo termina en una hoja que se imprime, se baja en PDF o se manda por WhatsApp.

No es un chatbot: se elige y se toca, no se conversa. Una pregunta y un botón por pantalla.

## Qué funciona hoy

- **Currículo Nacional completo** (Inicial, Primaria 1.º–6.º y Secundaria 1.º–5.º) como base de datos: competencias, capacidades, estándares y desempeños. Secundaria se extrajo con OCR del PDF escaneado del MINEDU.
- **Nueve juegos web** que funcionan con cualquier tema y con 22 habilidades de cálculo generadas sin IA. Se comparten de verdad: código de 6 letras y QR para los alumnos.
- **Crucigrama** generado por algoritmo con las palabras del docente.
- **Landing con lista de espera** real, con contador, enlace para invitar y registro de dónde llega cada docente.

Stack: Vite + React, funciones en Vercel y Vercel Blob para los datos. Monorepo con Turborepo. La generación con IA usa Claude con respuestas validadas contra un esquema.

## Limitaciones

- **La generación con IA está en construcción.** La ficha del tema, la canción, el examen y la adaptación todavía muestran datos de ejemplo en producción.
- **No hay audio**: la canción es solo letra. El audio con ElevenLabs está previsto.
- **No hay cuentas**: la biblioteca y los créditos viven en el navegador del docente y se pierden al cambiar de equipo.
- **El docente no ve los resultados de sus alumnos** en los juegos.
- **No está probado en un aula real** con alumnos. Hasta ahora lo hemos validado entrevistando a un docente.
- **Sin modelo de negocio decidido.** El docente de colegio público no va a pagar con tarjeta: las opciones son colegios privados, UGEL/MINEDU o un modelo gratuito con patrocinador.
- **Costo por docente sin medir** (IA y audio por cada docente activo al mes).

## Lo que no es

No reemplaza al docente, no diagnostica a ningún alumno y no les pide cuenta ni datos a los alumnos.
