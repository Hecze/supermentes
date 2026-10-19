-- Lo que enseña la docente ("Mi perfil"): sus grados y cursos, separados por comas. Cursos vacío = todos.
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS grados TEXT;
ALTER TABLE docentes ADD COLUMN IF NOT EXISTS cursos TEXT;
