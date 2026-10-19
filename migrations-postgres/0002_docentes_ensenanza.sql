-- Dónde y qué enseña la docente ("Mi perfil"). `colegios` es JSON: [{ nombre, tipo: publico|privado, grados, cursos }]
-- (cursos vacío = todos; en un privado, también sus cursos propios como algebra). `grados` y `cursos` juntan los de
-- todos sus colegios, separados por comas, para consultas simples.
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS grados TEXT;
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS cursos TEXT;
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS colegios TEXT;
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS actualizado TEXT;

-- Lo mismo de quien usa la app sin cuenta: un id que inventa su navegador, sin su nombre.
CREATE TABLE IF NOT EXISTS docentes_sin_cuenta (
  id TEXT PRIMARY KEY,
  grados TEXT NOT NULL,
  cursos TEXT NOT NULL,
  colegios TEXT,
  creado TEXT NOT NULL,
  actualizado TEXT NOT NULL
);
ALTER TABLE docentes_sin_cuenta ADD COLUMN IF NOT EXISTS colegios TEXT;
