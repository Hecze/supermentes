-- Juegos que mandó cada docente (id de Clerk). La clave le deja ver los resultados de sus alumnos.
CREATE TABLE envios (
  docente TEXT NOT NULL,
  codigo TEXT NOT NULL,
  clave TEXT NOT NULL,
  juego TEXT NOT NULL,
  tema TEXT NOT NULL DEFAULT '',
  grado TEXT,
  practica TEXT,
  fecha TEXT NOT NULL,
  PRIMARY KEY (docente, codigo)
);
CREATE INDEX envios_por_fecha ON envios (docente, fecha DESC);
