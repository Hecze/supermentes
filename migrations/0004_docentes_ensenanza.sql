-- Lo que enseña la docente ("Mi perfil"): sus grados y cursos, separados por comas. Cursos vacío = todos.
ALTER TABLE docentes ADD COLUMN grados TEXT;
ALTER TABLE docentes ADD COLUMN cursos TEXT;
