// Los siete enfoques transversales del Currículo Nacional, cada uno con una de sus «actitudes que se demuestran, por
// ejemplo, cuando…», copiada tal cual del CNEB (pp. 22-29, «Tratamiento del enfoque…»):
// https://www.minedu.gob.pe/curriculo/pdf/curriculo-nacional-de-la-educacion-basica.pdf

export type Enfoque = { nombre: string; actitudes: string }

export const ENFOQUES: Enfoque[] = [
  {
    nombre: 'Enfoque de derechos',
    actitudes: 'Los docentes propician y los estudiantes practican la deliberación para arribar a consensos en la reflexión sobre asuntos públicos, la elaboración de normas u otros.',
  },
  {
    nombre: 'Enfoque inclusivo o de atención a la diversidad',
    actitudes: 'Docentes y estudiantes demuestran tolerancia, apertura y respeto a todos y cada uno, evitando cualquier forma de discriminación basada en el prejuicio a cualquier diferencia.',
  },
  {
    nombre: 'Enfoque intercultural',
    actitudes: 'Los docentes y estudiantes acogen con respeto a todos, sin menospreciar ni excluir a nadie en razón de su lengua, su manera de hablar, su forma de vestir, sus costumbres o sus creencias.',
  },
  {
    nombre: 'Enfoque igualdad de género',
    actitudes: 'Docentes y estudiantes no hacen distinciones discriminatorias entre varones y mujeres.',
  },
  {
    nombre: 'Enfoque ambiental',
    actitudes: 'Docentes y estudiantes promueven la preservación de entornos saludables, a favor de la limpieza de los espacios educativos que comparten, así como de los hábitos de higiene y alimentación saludables.',
  },
  {
    nombre: 'Enfoque orientación al bien común',
    actitudes: 'Los estudiantes comparten siempre los bienes disponibles para ellos en los espacios educativos (recursos, materiales, instalaciones, tiempo, actividades, conocimientos) con sentido de equidad y justicia.',
  },
  {
    nombre: 'Enfoque búsqueda de la excelencia',
    actitudes: 'Docentes y estudiantes demuestran flexibilidad para el cambio y la adaptación a circunstancias diversas, orientados a objetivos de mejora personal o grupal.',
  },
]

/** El que más usan las sesiones de 4.º del MINEDU. */
export const ENFOQUE_INICIAL = ENFOQUES.findIndex((e) => e.nombre === 'Enfoque orientación al bien común')
