// Qué habilidades de cálculo practica un tema de matemática, a partir de su título y propósito.
// Funciona igual con las fichas de ejemplo y con las que arme la IA, sin pedirle nada más al backend.
import type { Ficha } from '../../api'
import { HABILIDADES, nivelPara, type Habilidad } from './habilidades'

export type Practica = { habilidad: string; nivel: number }

const plano = (t: string) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Los nombres específicos ganan a los generales: "fracciones equivalentes" antes que "fracciones". */
const GENERALES = new Set(['fracciones-reconocer'])

/** Solo cuenta lo que el currículo pide en ese grado: un nivel con cita del desempeño del grado. */
const delGrado = (h: Habilidad, gradoId: string) => h.niveles.some((n) => n.grados.includes(gradoId))

export function esMatematica(ficha: Pick<Ficha, 'areaId' | 'area'>) {
  return ficha.areaId === 'matematica' || plano(ficha.area).startsWith('matematica')
}

/** Habilidades del tema, de la más probable a la menos. Vacío si no es de matemática o no se reconoce. */
export function habilidadesDelTema(ficha: Ficha): Practica[] {
  if (!esMatematica(ficha)) return []
  const titulo = plano(ficha.titulo)
  const resto = plano([ficha.proposito, ...ficha.conceptos].join(' '))
  const hallazgos = HABILIDADES.filter((h) => delGrado(h, ficha.gradoId))
    .map((h) => ({ h, enTitulo: h.claves.test(titulo), enResto: h.claves.test(resto) }))
    .filter((x) => x.enTitulo || x.enResto)
  // Si el título ya dice de qué grupo es el tema ("Fracciones…"), lo que solo aparece en el resto tiene que ser del
  // mismo grupo: "un entero se divide en partes" no convierte un tema de fracciones en uno de división.
  const gruposDelTitulo = new Set(hallazgos.filter((x) => x.enTitulo).map((x) => x.h.grupo))
  const puntaje = (x: (typeof hallazgos)[number]) => (x.enTitulo ? 2 : 0) + (x.enResto ? 1 : 0) + (GENERALES.has(x.h.id) ? 0 : 0.5)
  return hallazgos
    .filter((x) => x.enTitulo || gruposDelTitulo.size === 0 || gruposDelTitulo.has(x.h.grupo))
    .sort((a, b) => puntaje(b) - puntaje(a))
    .map(({ h }) => ({ habilidad: h.id, nivel: nivelPara(h, ficha.gradoId) }))
}

/** Lo típico del grado cuando el tema no dice qué calcular (por ejemplo, geometría): un repaso de operaciones. */
export function practicaDelGrado(gradoId: string): Practica | null {
  const candidatas = /^primaria-[12]$/.test(gradoId)
      ? ['sumar']
      : /^primaria-[34]$/.test(gradoId)
        ? ['tablas']
        : /^primaria/.test(gradoId)
          ? ['fracciones-operar', 'decimales']
          : ['enteros', 'ecuaciones']
  const h = candidatas.map((id) => HABILIDADES.find((x) => x.id === id)!).find((x) => delGrado(x, gradoId))
  return h ? { habilidad: h.id, nivel: nivelPara(h, gradoId) } : null
}
