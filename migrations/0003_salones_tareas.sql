-- Tareas por salón (obsidian/TAREAS.md). El salón y su lista son de la docente (id de Clerk): solo nombres, sin datos
-- del alumno. La tarea es siempre el Concurso con reloj; el intento guarda las respuestas para revisar y reforzar.
CREATE TABLE salones (
  id TEXT PRIMARY KEY,
  docente TEXT NOT NULL,
  grado TEXT NOT NULL,
  seccion TEXT NOT NULL,
  creado TEXT NOT NULL
);
CREATE INDEX salones_por_docente ON salones (docente);

CREATE TABLE alumnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  salon TEXT NOT NULL REFERENCES salones (id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL
);
CREATE INDEX alumnos_por_salon ON alumnos (salon, orden);

-- juego: el Concurso tal como se comparte (apps/web/src/juegos/compartir/publicado.ts), en JSON.
CREATE TABLE tareas (
  codigo TEXT PRIMARY KEY,
  docente TEXT NOT NULL,
  salon TEXT NOT NULL REFERENCES salones (id) ON DELETE CASCADE,
  tema TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT '',
  desempeno TEXT NOT NULL DEFAULT '',
  juego TEXT NOT NULL,
  segundos INTEGER NOT NULL,
  vence TEXT NOT NULL,
  creado TEXT NOT NULL
);
CREATE INDEX tareas_por_docente ON tareas (docente, creado DESC);

-- Cuenta el primer intento: la clave (tarea, alumno) deja guardar solo ese; practicar otra vez no escribe.
-- respuestas: JSON [{ pregunta, elegida, correcta }], de ahí sale "lo que más costó".
CREATE TABLE intentos (
  tarea TEXT NOT NULL REFERENCES tareas (codigo) ON DELETE CASCADE,
  alumno INTEGER NOT NULL REFERENCES alumnos (id) ON DELETE CASCADE,
  aciertos INTEGER NOT NULL,
  total INTEGER NOT NULL,
  segundos INTEGER NOT NULL,
  respuestas TEXT NOT NULL,
  fecha TEXT NOT NULL,
  PRIMARY KEY (tarea, alumno)
);
