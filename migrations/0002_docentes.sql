-- Perfil de la docente (id de Clerk), del onboarding: cómo la llaman sus alumnos, su colegio y su grado.
CREATE TABLE docentes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  colegio TEXT,
  grado TEXT NOT NULL,
  creado TEXT NOT NULL
);
