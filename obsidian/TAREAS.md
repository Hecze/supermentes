---
actualizado: 2026-10-18
estado: decisiones tomadas; falta el visto bueno del prototipo para pasar a código
---

# Revisar tareas (problema 3 del ciclo)

> Sesión de producto, sin código. Encaja en el mapa nuevo (Clerk + Neon): el ciclo **planear → preparar → practicar →
> revisar → reforzar**, con salón, alumno de la lista, material con tipo, tarea e intento por desempeño. Sale de la
> entrevista con Lucho y Yessly ([[entrevistas/2026-10-18-lucho-y-yessly]], [[MATERIALES]] §7).
> Prototipo: capturas en `demos/tareas/` (1, 1b, 2, 2b, 3, 4, 5) y las pantallas de pen.dev en
> `demos/tareas/pantallas.json`.

## 1. El problema

- **Los alumnos hacen la tarea con IA** (o se la hace el hermano mayor). Lo que llega al cuaderno ya no dice qué
  aprendió el niño.
- **Revisar no alcanza.** Lucho pierde "unos 10, 15 minutos de la hora total… a veces ni siquiera reviso
  detalladamente, solamente pongo check, check, check". Tiene 1 h 20 min por curso y 5 cursos al día.
- **Necesita algo que mostrar:** "algún reporte o alguna confirmación de que ha concluido, de que llegó a aprender"
  para la supervisión, y un PDF por alumno con su anotación para el colegiado y la boleta.
- **Juegos como tarea, sí** ("no lo pueden hacer con inteligencia artificial"), pero hoy un juego no es una tarea:
  no tiene salón ni fecha, guarda el **mejor** puntaje (premia reintentar hasta acertar), el niño escribe su nombre
  como quiere y no se sabe **en qué desempeño** falló.

**La apuesta:** practicar en el celular con reloj, de modo que no dé tiempo de copiarla a ChatGPT. El intento se
corrige solo y el docente lo ve **revisado por desempeño**, con el paso siguiente a un clic: reforzar.

## 2. Para quién

- **Docente de primaria** que no sabe de tecnología, usa laptop y no lee instrucciones. Ya manda cosas al grupo de
  WhatsApp de las familias.
- **Alumno de 1.º a 6.º** en el celular de su papá o mamá, muchas veces dentro de WhatsApp. Los de 1.º y 2.º recién
  leen.
- **Papás:** si solo ven "juegos", dicen que "el profesor solamente los manda a jugar". El mensaje dice que **es la
  tarea**.

Prioridad, dicha por Lucho: primero exámenes y su resolución, después tareas. Por eso, en el orden del mapa, revisar
va tercero, después de cuentas y salones.

## 3. Dónde encaja en el ciclo

| Paso | Qué hace el docente | Objeto |
| --- | --- | --- |
| Preparar | Elige un juego del tema (ya existe) | `MATERIAL` tipo juego |
| Practicar | "Como tarea" → "Para 4.º B" → WhatsApp | `TAREA` (material + salón + segundos + vence) |
| Practicar | El niño elige su nombre y juega con reloj | `INTENTO` (alumno, puntaje, por desempeño, segundos) |
| **Revisar** | Abre la tarea en su salón: ya está corregida | Lee los `INTENTO` de la tarea |
| Reforzar | "Retomarlo en la próxima sesión" o "Repasar en el proyector" | El desempeño que falló más de la mitad |

## 4. Cómo se evita la trampa (sin prometer lo que no cumple)

- **Reloj por pregunta:** 30 s en 1.º–2.º, 20 s en 3.º–4.º y 15 s en 5.º–6.º. El Concurso ya lo tiene.
- **Cuenta el primer intento.** Puede volver a practicar, pero la revisión toma el primero.
- **Preguntas distintas por alumno:** el cálculo se genera con su semilla, y el orden y las opciones se barajan.
- **El reloj no se pausa** si sale de la app.
- **Elige su nombre de la lista:** se sabe quién fue y no hay "ana", "Ana P." y "anita".

**Lo que no resuelve:** que la haga el hermano mayor o el papá. Se dice así. Más adelante, "Comprobar en clase":
3 minutos en el proyector con el mismo desempeño, para ver si el aula responde igual que en la casa.

## 5. Qué NO se hace

- **No detectamos IA ni vigilamos al niño:** nada de cámara, micrófono ni bloquear el celular.
- **No hay cuenta para el alumno.** Elige su nombre de la lista que pegó el docente; no escribe ni entrega ningún
  dato.
- **No hay tareas abiertas** (redacción, procedimiento, foto del cuaderno): no se corrigen solas. Solo preguntas con
  respuesta correcta (`Reto`) y con la cita del desempeño del grado.
- **En la tarea no se elige el juego:** siempre es el Concurso (reloj, una respuesta por pregunta). Los otros juegos
  siguen para practicar.
- **No se pide el salón para preparar:** solo al asignar una tarea (recomendación del mapa).
- **No se convierte a AD/A/B/C ni se carga al SIAGIE:** se muestran aciertos (decidido).

## 6. El flujo

### Docente: asignar (pantallas 1 y 1b)

1. En Juego web, **"Mandar a las familias"**, como hoy.
2. Elige **"Como tarea"**, al lado de "Para practicar". Ya viene armada: "10 preguntas con reloj · 20 s · hasta el
   vie 23", la fila **"Para 4.º B · 30 alumnos"**, el mensaje para las familias y la "i" con el desempeño.
3. **"Asignar a 4.º B y enviar por WhatsApp".**
   - **La primera vez** (1b): "¿Para qué salón es la tarea?". El grado viene del tema; escribe la sección y **pega
     la lista** de su registro, Excel o WhatsApp, un nombre por línea. Se ve "30 alumnos" al instante. Solo nombres.
   - **Si aún no tiene cuenta**, la pide ahí con Google (Clerk): "Para guardar las tareas de tus alumnos".

### Alumno: hacerla (pantallas 2b, 2, 3 y 4)

1. Abre el link y aparece **"¿Quién eres?"**: los nombres de su salón en botones grandes y un buscador. Los que ya
   la hicieron dicen "ya la hizo". El celular lo recuerda para la próxima vez ("Juegas como Ana · No soy yo").
2. **Portada:** "Tarea de Comunicación · Los dichos populares · de la Prof. Rosa · hasta el viernes", "10 preguntas,
   unos 5 minutos · 20 segundos cada una · Hazla tú solito o solita" y **"Empezar"**.
3. **Preguntas con reloj** (el Concurso).
4. **Fin:** "¡Listo, Ana! Tu profe ya recibió tu tarea. 8 de 10". Debajo, "Practicar otra vez" y "Practicar no
   cambia lo que recibió tu profe".

### Docente: revisar y reforzar (pantalla 5)

1. **Inicio** muestra "1 tarea por revisar" y qué reforzar (pantalla del mapa). Entra a **Mis salones → 4.º B →
   la tarea**.
2. **Ya está revisada:**
   - "24 de 30 entregaron", "7 de 10 en promedio" y "4 no llegaron a la mitad".
   - **"Para reforzar: más de la mitad falló este desempeño"**, con la cita oficial y la pregunta que más costó
     (y qué respondieron: "la tomaron al pie de la letra"). Botones: **"Retomarlo en la próxima sesión"** (va a
     Planear) y **"Repasar en el proyector"**.
   - **La lista:** alumno, aciertos, cuánto tardó y cuándo. Los que no llegaron a la mitad, marcados. "6 no la
     hicieron" con sus nombres y "Recordar por WhatsApp", algo que solo se puede saber con la lista del salón.
   - **"Mostrar podio en la pizarra"** (los 5 mejores; nunca el último) y **"Reporte por alumno (PDF)"** para el
     colegiado.

## 7. Datos (sobre el modelo del mapa)

- `TAREA`: `codigo`, `material_id` (el juego, con su contenido y desempeños), `salon_id`, `segundos_por_pregunta`
  (sale del grado) y `vence`.
- `INTENTO`: `tarea_id`, `alumno_id`, `puntaje`, `segundos`, `por_desempeno` (aciertos y total por desempeño) y su
  número de intento: **revisar lee solo el primero**. Suma `respuestas` (jsonb: pregunta, elegida, correcta), que
  es de donde salen "lo que más costó" y "qué respondieron" (decidido).
- **Alumno sin datos:** solo el nombre que pegó el docente. La lista es suya, como su registro; el niño no entrega
  nada. Se puede borrar el salón con todo.
- Pendiente de revisar: la Ley 29733 de datos personales y los menores de edad (no verificado si aplica a una lista
  de nombres del docente).
- Los resultados de "Para practicar" siguen en `api/resultados.ts` hasta migrarlos a `INTENTO`.

## 8. Decisiones (Harold, 2026-10-18)

1. **Aciertos** ("8 de 10"), no AD/A/B/C.
2. **10 preguntas** por tarea.
3. **`INTENTO` guarda `respuestas`** (pregunta, elegida, correcta): "qué reforzar" muestra la pregunta que más costó y
   qué respondieron.
4. **"Ya la hizo" sí** en la lista de nombres del alumno, sin puntajes.
