# Supermentes

Herramientas de IA para docentes del Perú, hechas para Hack the Andes 2026 (entrega: 18 de octubre de 2026, 9:00 a. m., hora de Lima).

## El currículo es el eje

Un jurado, un director o un docente puede preguntar en cualquier momento "¿por qué esto cumple el currículo?". La respuesta no puede ser "yo creo que": tiene que ser una cita del texto oficial, mostrada en segundos. Antes de crear, ofrecer o cambiar cualquier contenido, piensa esto primero; no adivines.

- **Todo se apoya en un desempeño oficial del grado** (`packages/curriculo`, copiado de los programas curriculares del MINEDU): juegos, canciones, exámenes, crucigramas y adaptaciones. Si ningún desempeño del grado lo respalda, no se ofrece en ese grado.
- **Cita textual o no va.** Se guarda el fragmento exacto del desempeño, no un resumen, y se verifica que aparezca tal cual. Ejemplo: `apps/web/src/juegos/matematica/curriculo.ts` y `npm run verificar:curriculo` (corre también en `npm run typecheck` y falla si una cita no coincide letra por letra).
- **Lee el grado antes de tocarlo.** Para agregar o mover un grado, un nivel o un tema, abre el JSON de ese grado y lee sus desempeños. Un ejemplo: en el currículo las fracciones empiezan en 4.º, aunque "parezca" que se ven antes. Si dudas, no lo pongas y pregunta.
- **Los campos `temas` del JSON no son texto oficial:** sirven para buscar, nunca para sustentar.
- **El tema guarda sus desempeños** (`Ficha.curriculo.desempenos`, texto oficial). Lo que se cree después parte de ellos; no se vuelven a adivinar.
- **La IA cita.** Cada endpoint de `api/` recibe los desempeños del tema y debe devolver, por cada pregunta, estrofa o ítem, el desempeño que trabaja con su cita textual. El backend descarta las citas que no aparezcan tal cual en `packages/curriculo`.
- **El banco también cita.** `apps/web/src/banco` trae, por tema (hoy todo 4.º de primaria), palabras, preguntas y parejas con la cita del desempeño. En un grado con banco, todo tema debe tener al menos 2 juegos: `npm run typecheck` falla si no.
- **Canciones: solo las que están en YouTube** (`obsidian/CANCIONES.md`). La app no crea canciones ni muestra letras sin video; cada canción cita su desempeño igual que todo lo demás.
- **Se muestra con el icono "i"** (`apps/web/src/views/SustentoJuego.tsx`), en dos partes: "El tema abarca" (la competencia y el desempeño oficial) y "El juego abarca" (qué hacen los alumnos y la parte exacta del desempeño, resaltada). Las demás herramientas deben mostrar lo mismo.

## La sesión de aprendizaje: todo o nada

Para el docente, la sesión de aprendizaje solo sirve si cumple **todas** las normas del MINEDU, sin excepción: la
presenta al director y la revisa el evaluador. Una sola parte que no cumpla, por pequeña que sea, la vuelve inútil y
le hace daño al docente.

- **Cada parte se apoya en una norma o documento oficial del MINEDU** (resolución, Currículo Nacional, programa
  curricular, orientaciones o sesiones publicadas por el MINEDU), con la cita y el enlace anotados. Nada de
  hipótesis, suposiciones ni cosas que «se ven bien»: si no hay fuente oficial, esa parte no va.
- **No se fijan cantidades ni pasos que dependen del docente** (cuántos ejercicios resuelve, cuánta teoría o
  práctica): cambian según el tema, el colegio (público o privado, con libro o sin él) y el salón.
- **Si no se puede cumplir todo** (falta información, una limitación técnica, lo que sea), la sesión no se ofrece y
  **no llega a producción**. Mientras tanto, la vista lleva arriba el aviso «En construcción» y no debe usarse
  (`apps/web/src/views/Sesion.tsx`).

## Antes de trabajar

Lee:
- `obsidian/VISION.md`: qué construimos, para quién y los principios de diseño.
- `obsidian/MAPA.md`: el producto en una página (flujo, estado de cada pieza, decisiones abiertas).
- `obsidian/ESTADO.md`: dónde quedamos, qué sigue y los riesgos conocidos.
- `obsidian/HACKATHON.md`: condiciones del evento, reto de tracción y créditos gratis.
- `obsidian/MATERIALES.md`: cómo son los materiales del docente (balotario, examen, clave, material extra…) y cómo deben verse, dicho por docentes. Léelo antes de tocar exámenes o materiales.
- `obsidian/DATOS.md`: cifras con fuente (docentes, horas extra, aprendizajes, cuánto pagan, costos de IA). Úsalas en vez de inventar números.
- `README.md`: páginas, principios de diseño, endpoints y costos.

## Cómo trabajamos

- Varias personas y sesiones de Claude trabajan en paralelo: cada una en su rama y luego merge a `main`. No reescribas historia de `main` (nada de rebase ni force-push).
- **Sube seguido y por alcance chico, para no pisarnos:**
  - Antes de empezar, trae lo último: `git pull origin main`.
  - Una pieza por vez (un endpoint, una vista, una nota): al terminarla, `git pull origin main`, `npm run typecheck` y `npm run build`, merge a `main` y push. No se acumulan horas de trabajo sin subir: como máximo **cada 30 minutos**, aunque la pieza siga a medias detrás de un interruptor o sin conectar.
  - Antes de tocar un archivo, mira quién lo cambió hace poco (`git log -3 --since="2 hours ago" -- <archivo>`). Si otra sesión lo está trabajando, toca lo mínimo o coordina antes.
  - Commits chicos que digan qué cambió y por qué; nunca `--force` ni borrar trabajo ajeno para que tu merge pase.
- Producción: https://www.supermentes.app (Vercel, proyecto `supermentes`). La landing está en `/` y la app en `/app`.
- Todo en español peruano, con palabras del aula y no técnicas: el docente promedio tiene poca experiencia digital y usa laptop.
- Nos centramos en **primaria**. Los alumnos juegan en **el celular de sus papás**: el docente (en laptop) manda el link del juego al grupo de WhatsApp de las familias y los papás le prestan el celular a su hijo o hija. Todo lo que juega el alumno se diseña primero para celular en vertical (ver `apps/web/src/juegos/README.md`).
- Los temas salen del Currículo Nacional (`packages/curriculo`): no se crean temas libres ni desde fotos o archivos (ver "El currículo es el eje"). El tema se crea al instante con lo que trae el currículo y la IA completa la ficha en segundo plano: el docente nunca espera a la IA para empezar.
- Toda llamada a la IA tiene tiempo límite y un "Reintentar" visible: nada de pantallas de carga infinitas.
- **Nada de sube y baja.** Cada acción va junto a lo que cambia y a la vista: crear u "otra versión" arriba a la derecha o en una ventana (`Ventana`); descargar, imprimir y lo que cambia la hoja, en la barra pegada arriba de la hoja (`BarraHoja`, en `components/ui.tsx`); lo que tarda se ve donde aparecerá el resultado. Nunca un botón al final de la página que cambia algo de arriba.
- En `api/`, los imports relativos llevan `.js` (`from './_ia.js'`): Vercel corre Node con ESM y sin la extensión la función no carga (`FUNCTION_INVOCATION_FAILED`). `npm run typecheck` lo marca como error.
- Al terminar algo importante, actualiza `obsidian/ESTADO.md` (se reemplaza, no se acumula).
