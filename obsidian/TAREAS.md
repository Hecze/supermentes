---
actualizado: 2026-10-18
estado: propuesta, falta que Harold apruebe el flujo y el prototipo
---

# Tareas que se corrigen solas

> Sesión de producto, sin código. Sale de la entrevista con Lucho y Yessly ([[entrevistas/2026-10-18-lucho-y-yessly]],
> [[MATERIALES]] §7). Reusa los juegos (`apps/web/src/juegos`) y los resultados (`api/resultados.ts`).
> Prototipo: capturas en `demos/tareas/` (1 mandar como tarea, 2 el alumno la abre, 3 pregunta con reloj, 4 entregada, 5 tarea revisada) y las pantallas de pen.dev en `demos/tareas/pantallas.json`, para pegarlas en `demos/demo-pitch.pen`.

## 1. El problema

- **Los alumnos hacen la tarea con IA** (o se la hace el hermano mayor). Lo que llega al cuaderno ya no dice qué
  aprendió el niño.
- **Revisar no alcanza.** Lucho pierde "unos 10, 15 minutos de la hora total… a veces ni siquiera reviso
  detalladamente, solamente pongo check, check, check". Tiene 1 h 20 min por curso y 5 cursos al día.
- **Necesita algo que mostrar.** Pidió "algún reporte o alguna confirmación de que ha concluido, de que llegó a
  aprender" para cuando vienen a supervisar, y el seguimiento por alumno del colegiado.
- **Juegos como tarea, sí:** casi todas las familias tienen un celular y "no lo pueden hacer con inteligencia
  artificial". Pero hoy un juego no es una tarea: no tiene fecha, guarda el **mejor** puntaje (premia reintentar
  hasta acertar) y no dice **qué pregunta falló** cada uno.

**La apuesta:** una tarea corta en el celular, con reloj por pregunta. No da tiempo de copiarla a ChatGPT, se corrige
sola y el docente recibe la lista revisada y qué reforzar.

## Dónde vive en el producto

No es una herramienta nueva ni está en [[VISION]] ni en [[MAPA]]. Es **una forma de mandar el juego que ya existe**,
para no sumar pantallas ni palabras nuevas:

- **Se manda desde Juego web (pantalla 09):** en la ventana "Manda el juego a las familias" hay dos opciones,
  **"Para practicar"** (lo de hoy) y **"Como tarea"**. No hay un botón "Dejar tarea" aparte ni un menú "Tareas".
- **Se revisa en Resultados de juegos (pantalla 12):** las tareas salen primero, con la etiqueta "Tarea" y "18 de 30
  entregaron". Al abrir una, se ve ya revisada.
- **El alumno ve lo mismo que hoy** (`/j/CODIGO`, su nombre una vez), con portada de tarea y sin poder volver atrás.

## 2. Para quién

- **Docente de primaria** (público o privado) que no sabe de tecnología, usa laptop y no va a leer instrucciones.
  Ya manda cosas al grupo de WhatsApp de las familias: eso es todo lo que tiene que saber hacer.
- **Alumno de 1.º a 6.º** en el celular de su papá o mamá, muchas veces dentro de WhatsApp, Android de gama baja.
  Los de 1.º y 2.º recién leen.
- **Papás**, que reciben el link y prestan el celular. Si solo ven "juegos", dicen que "el profesor solamente los
  manda a jugar": el mensaje tiene que decir que **es la tarea**.

## 3. Cómo se evita la trampa (sin prometer lo que no cumple)

| Truco | Qué corta | Ya existe |
| --- | --- | --- |
| **Reloj por pregunta** (30 s en 1.º–2.º, 20 s en 3.º–4.º, 15 s en 5.º–6.º) | Copiar la pregunta a ChatGPT y pegar la respuesta | Concurso ya tiene reloj |
| **Cuenta la primera vez** (después puede practicar, la nota no cambia) | Reintentar hasta acertar | Hoy guarda el mejor: cambia |
| **Cada alumno, sus números** (cálculo generado con su semilla) y orden y opciones barajados | Pasarse las respuestas por el grupo | Sí |
| **No se pausa ni se vuelve atrás**; si sale de la app, el reloj sigue | Salir a buscar la respuesta | Casi: falta que el reloj siga |

**Lo que no resuelve:** que la haga el hermano mayor o el papá. No hay forma honesta de saberlo desde un celular
prestado. Se dice así al docente y, en una versión siguiente, "Comprobar en clase": 3 minutos de Concurso
proyectado con el mismo tema, para ver si el aula responde como en la casa.

## 4. Qué NO se hace

- **No detectamos IA ni vigilamos al niño:** nada de cámara, micrófono ni "modo examen" que bloquee el celular.
- **No hay cuenta para el alumno:** solo su nombre, escrito una vez (como hoy en los juegos). Ver "Los datos del
  alumno".
- **No hay tareas abiertas** (redacción, procedimiento, foto del cuaderno): no se corrigen solas. Solo preguntas con
  respuesta correcta (`Reto`) que tengan cita del desempeño del grado.
- **No elige juego el docente en la tarea:** la tarea es siempre el Concurso (reloj, una respuesta por pregunta). Los
  otros 16 juegos siguen siendo para practicar.
- **No se convierte a AD/A/B/C ni se carga al SIAGIE** en esta versión: se muestran aciertos ("8 de 10"). Ver
  decisiones abiertas.
- **No hay lista de la clase** que el docente tenga que escribir: los nombres salen de quien entregó.
- **No hay PDF por alumno para el colegiado** todavía: es lo siguiente, una vez que existan las entregas.

## 5. El flujo

### Docente (laptop): dejar la tarea, 2 clics

1. **En Juego web toca "Mandar a las familias"**, como hoy.
2. **En la ventana elige "Como tarea"** (al lado de "Para practicar"). Aparece todo ya armado, sin preguntas que
   contestar:
   - "10 preguntas · 20 segundos cada una · cuenta la primera vez".
   - **Entregan hasta:** pasado mañana (default; se cambia con un toque en la fecha).
   - El desempeño que trabaja, con la "i".
   - Plegado: "Ver las 10 preguntas" (con "Quitar" en cada una: el docente decide).
   - El mensaje para las familias, ya escrito: *"Tarea de Matemática para Ana y sus compañeros: 10 preguntas de
     fracciones. Que la haga solito, toma 5 minutos. Es hasta el viernes."*
3. **"Enviar por WhatsApp"** (botón grande). Abre WhatsApp con el mensaje y el link. También "Copiar link".
   - **La primera vez** pide entrar con Google (Clerk), con una frase: "Para guardar las tareas de tus alumnos".
     No antes: el docente prueba todo sin cuenta.

### Alumno (celular del papá): hacerla, 1 toque

1. **Abre el link.** Portada: "Tarea de Matemática · Prof. Rosa · Fracciones". Si es la primera vez, "¿Cómo te
   llamas?" (ya existe). Abajo: "Juegas como Ana · No soy yo".
2. **"Empezar"**, con un aviso de una línea: "Tienes 20 segundos por pregunta. Hazla tú solito." Cuenta 3, 2, 1.
3. **Preguntas con reloj** (el Concurso): letra grande, 4 botones de colores, barra de tiempo.
4. **Fin:** "¡Listo! Tu profe ya recibió tu tarea. 8 de 10 ⭐⭐". Botón: "Practicar otra vez" (dice: "no cambia tu
   nota").
5. **Si vuelve a abrir el link:** "Ya entregaste tu tarea" y "Practicar". Si ya venció: "Esta tarea ya cerró", con
   practicar igual.

### Docente (laptop): revisar, 0 clics para lo importante

1. **En el menú, "Resultados de juegos"**, como hoy. Las tareas salen primero, con la etiqueta "Tarea", "18 de 30
   entregaron" y la fecha.
2. **Abre una tarea y ya está revisada:**
   - Arriba, **"Reforzar"**: las 2 preguntas que más fallaron, con su desempeño ("i"). Botón "Repasar en clase":
     abre el Concurso en el proyector con esas preguntas.
   - **La lista**: alumno, aciertos, cuánto tardó, cuándo. Ordenada por aciertos; los que no llegaron a la mitad,
     marcados para ayudarlos.
   - "Mostrar podio": los 5 mejores, para la pizarra (nunca muestra al último).
   - Un toque en un alumno: qué pregunta falló y qué respondió.

## Los datos del alumno (la tensión con la visión)

[[VISION]] dice: "No pide cuenta ni datos a los alumnos". Hoy Resultados de juegos ya guarda el nombre que escribe
el niño y su puntaje, y la tarea suma **qué respondió en cada pregunta**. Propuesta para cumplir el espíritu de esa
regla:

- **Sin cuenta, sin correo, sin DNI, sin teléfono, sin foto.** Solo el nombre que el niño escribe (puede ser solo el
  nombre de pila) y sus respuestas a esa tarea.
- **Solo lo ve su docente**, dentro de su cuenta. Nunca otro docente, nunca la biblioteca, nunca la IA.
- **Se borra solo** al cerrar el año escolar, y el docente puede borrar una tarea con sus entregas.
- **Los papás saben qué se guarda:** la portada de la tarea lo dice en una línea ("Tu profe verá tu nombre y tus
  respuestas").
- Pendiente de revisar: la ley peruana de datos personales (Ley 29733) pide reglas especiales para datos de menores.
  No está verificado si el nombre y las respuestas de la tarea necesitan el consentimiento de los papás.

Cambio propuesto en [[VISION]] (decide Harold): "No pide cuenta a los alumnos. Solo su nombre, que ve únicamente su
docente."

## 6. Qué cambia por debajo (para cuando se apruebe)

- **Clerk** para el docente (después del evento: [[MVP]] deja fuera las cuentas hasta entonces): las tareas viven en su cuenta, no en el navegador (hoy la clave de resultados se pierde
  si borra el navegador o cambia de laptop).
- **Neon (Postgres)** en lugar de Blob para tareas y entregas: sin el tope de 2.000 escrituras al mes, y cada
  entrega guarda cada respuesta. Tres tablas: `docentes` (id de Clerk), `tareas` (código, tema, grado, desempeños
  citados, preguntas, vence), `entregas` (tarea, id y nombre del alumno, respuestas, aciertos, segundos; una sola
  por alumno: la primera).
- **Juego:** Concurso en "modo tarea": manda la primera partida completa, el reloj no se pausa al salir. Los juegos
  compartidos y `api/resultados.ts` siguen igual para practicar.

## 7. Decisiones abiertas (Harold)

1. **¿AD/A/B/C o aciertos?** Primaria califica con escala literal. Propuesta: v1 aciertos; v2 el docente pone los
   cortes una vez ("de 9 a 10 es AD").
2. **¿Cuántas preguntas?** Propuesta: 10 (≈ 5 minutos). Un papá presta el celular poco rato.
3. **¿Y el hermano mayor?** Propuesta: decirlo claro y sumar "Comprobar en clase" después.
4. **¿Cambiamos la frase de [[VISION]]** sobre los datos del alumno, como se propone arriba?
