// Qué tipos de pregunta trae el examen de cada tema. Los de Matemática se eligen a mano, leyendo el desempeño de
// cada tema (con dibujos y números que cambian); todos los temas con banco suman además los tipos del banco
// (marcar, ¿tiene razón?, unir y completar), con preguntas del tema que cambian de versión en versión.
import type { TemaBanco } from '../banco/banco'
import { normalizar } from '../curriculo/buscar'
import { TIPOS_DEL_BANCO } from './del-banco'
import { TIPOS_CALCULO } from './matematica/calculo'
import { TIPOS_NUMEROS } from './matematica/numeros'
import { GRUPO_DATOS } from './matematica/datos'
import { GRUPO_FORMA } from './matematica/forma'
import { GRUPO_FRACCIONES_MEDIDAS } from './matematica/fracciones-medidas'
import { GRUPO_OPERACIONES } from './matematica/operaciones'
import { GRUPO_REGULARIDAD } from './matematica/regularidad'
import { problemasDelTema } from './problemas'
import type { Grupo, TemaProblemas, TipoPregunta } from './tipos'

const BASE: Grupo = {
  tipos: [...TIPOS_NUMEROS, ...TIPOS_CALCULO],
  temas: {
    'La unidad de millar': ['base-diez', 'dinero-falta', 'abaco', 'calc-valor-posicional'],
    'Números de cuatro cifras': ['dinero-contar', 'abaco', 'base-diez', 'tablero', 'calc-valor-posicional'],
    'Valor posicional': ['tablero', 'abaco', 'base-diez', 'calc-valor-posicional'],
    'Comparación y orden de números': ['calc-comparar', 'dinero-contar'],
    'Redondeo a decenas': ['calc-redondeo-decena', 'calc-redondeo-centena'],
    'Problemas de multiplicación y división': ['calc-tablas', 'calc-dividir'],
    'Propiedades de la multiplicación': ['calc-tablas'],
    'Multiplicación y división': ['calc-tablas', 'calc-dividir', 'calc-dobles'],
    'La fracción como parte-todo': ['calc-fraccion-pintada', 'calc-fraccion-de'],
    'Fracciones usuales': ['calc-fraccion-pintada', 'calc-fraccion-de'],
    'Fracciones de una cantidad': ['calc-fraccion-de'],
    'Comparación de fracciones': ['calc-fraccion-pintada'],
    'Suma y resta de fracciones': ['calc-sumar-fracciones'],
    'Amplificación y simplificación de fracciones': ['calc-equivalentes'],
    'Fracciones equivalentes': ['calc-equivalentes'],
    'Kilogramo y gramo': ['calc-masa'],
    'Horas, medias horas y cuartos': ['calc-tiempo'],
    'Medidas de masa y tiempo': ['calc-masa', 'calc-tiempo'],
    'Patrones aditivos': ['calc-patron-suma'],
    'Patrones multiplicativos': ['calc-patron-multiplica'],
    'Regla de formación': ['calc-patron-suma', 'calc-patron-multiplica'],
    'Término desconocido': ['calc-ecuacion'],
    'Igualdad y término desconocido': ['calc-ecuacion'],
    'Equivalencias en la balanza': ['calc-ecuacion'],
    'El litro y fracciones de litro': ['calc-litro'],
    'Conversión de unidades de longitud': ['calc-longitud'],
  },
}

/** Los grupos de Matemática de 4.º; cada archivo de matematica/ suma el suyo. */
const GRUPOS: Record<string, Grupo[]> = {
  'primaria-4': [BASE, GRUPO_OPERACIONES, GRUPO_FRACCIONES_MEDIDAS, GRUPO_REGULARIDAD, GRUPO_FORMA, GRUPO_DATOS],
}

export const TIPOS = new Map<string, TipoPregunta>(
  [...Object.values(GRUPOS).flatMap((gs) => gs.flatMap((g) => g.tipos)), problemasDelTema, ...TIPOS_DEL_BANCO].map((t) => [t.id, t]),
)

/** Los tipos con dibujos y números del tema, en el orden en que se eligieron. */
export function tiposMatematica(gradoId: string, tema: string): TipoPregunta[] {
  const t = normalizar(tema)
  const ids: string[] = []
  for (const g of GRUPOS[gradoId] ?? []) {
    for (const [titulo, lista] of Object.entries(g.temas)) if (normalizar(titulo) === t) ids.push(...lista)
  }
  return [...new Set(ids)].map((id) => TIPOS.get(id)!).filter((x) => x?.citas?.[gradoId])
}

/**
 * Todos los tipos de pregunta que puede llevar una hoja del tema: los de dibujos y números (Matemática), los problemas
 * del tema con sus pasos y los del banco. Vacío si el tema no tiene banco ni tipos propios.
 */
export function tiposDelTema(gradoId: string, areaId: string, tema: string, banco: TemaBanco | null, problemas: TemaProblemas | null = null): TipoPregunta[] {
  const propios = areaId === 'matematica' ? tiposMatematica(gradoId, tema) : []
  const conProblemas = (problemas?.problemas.length ?? 0) >= 3 ? [problemasDelTema] : []
  if (!banco) return [...propios, ...conProblemas]
  const delBanco = TIPOS_DEL_BANCO.filter((t) => {
    // Solo los que el banco del tema puede armar (por ejemplo, hace falta tener parejas para unir).
    for (let s = 1; s <= 3; s++) if (t.generar({ azar: () => (s * 0.31) % 1, banco })) return true
    return false
  })
  return [...propios, ...conProblemas, ...delBanco]
}

/** De dónde sale la cita de un tipo: la suya para ese grado, o la del tema en el banco. */
export function citaDelTipo(tipo: TipoPregunta, gradoId: string, banco: TemaBanco | null): { area?: string; cita: string; competencia?: number } | null {
  if (tipo.citas) {
    const cita = tipo.citas[gradoId]
    return cita ? { area: tipo.area, cita, competencia: tipo.competencia } : null
  }
  return banco ? { cita: banco.cita, competencia: banco.competencia } : null
}

export const gruposDe = (gradoId: string) => GRUPOS[gradoId] ?? []
