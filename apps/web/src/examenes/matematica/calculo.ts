// Las prácticas de cálculo de los juegos (juegos/matematica/habilidades.ts) como preguntas de examen: ya generan
// números al azar con los errores típicos como distractores, y cada nivel trae la cita del desempeño de cada grado.
import type { Fraccion } from '../../api'
import { habilidadPorId } from '../../juegos/matematica/habilidades'
import { TINTA, el, svg } from '../dibujos'
import type { Dibujo, TipoPregunta } from '../tipos'
import { alternativas } from '../util'

/** Un círculo partido en n partes con k pintadas (las fracciones de los juegos). */
export function dibujoPastel([k, n]: Fraccion): Dibujo {
  const R = 62
  const c = R + 4
  const partes =
    n <= 1
      ? el('circle', { cx: c, cy: c, r: R, fill: k >= 1 ? '#9a9a9a' : '#fff', stroke: TINTA, 'stroke-width': 2 })
      : Array.from({ length: n }, (_, i) => {
          const a0 = (i / n) * 2 * Math.PI - Math.PI / 2
          const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2
          const d = `M${c},${c} L${(c + R * Math.cos(a0)).toFixed(1)},${(c + R * Math.sin(a0)).toFixed(1)} A${R},${R} 0 0 1 ${(c + R * Math.cos(a1)).toFixed(1)},${(c + R * Math.sin(a1)).toFixed(1)} Z`
          return el('path', { d, fill: i < k ? '#9a9a9a' : '#fff', stroke: TINTA, 'stroke-width': 2, 'stroke-linejoin': 'round' })
        }).join('')
  return svg(2 * c, 2 * c, partes, `Círculo partido en ${n} partes iguales con ${k} pintadas`)
}

/**
 * Un tipo de pregunta a partir de un nivel de práctica. Solo se ofrece en los grados donde ese nivel tiene cita.
 * `enunciado`: lo que se lee antes del ejercicio, cuando la consigna sola queda corta.
 */
export function deCalculo(o: { id: string; habilidad: string; nivel: string; nombre: string; queHacen: string; enunciado?: string }): TipoPregunta {
  const h = habilidadPorId(o.habilidad)
  const nivel = h?.niveles.find((n) => n.nombre === o.nivel)
  if (!h || !nivel) throw new Error(`No existe la práctica ${o.habilidad} · ${o.nivel}`)
  return {
    id: o.id,
    nombre: o.nombre,
    queHacen: o.queHacen,
    citas: nivel.citas,
    area: 'matematica',
    cambia: 'numeros',
    generar({ azar }) {
      const r = nivel.generar(azar)
      const alt = alternativas(azar, r.respuesta, r.distractores, 4)
      if (!alt) return null
      const dibujo = r.visual?.tipo === 'fraccion' ? dibujoPastel(r.visual.partes) : undefined
      if (r.visual && !dibujo) return null
      return {
        forma: 'opciones',
        clave: `${o.id}:${r.consigna ?? ''}|${r.pregunta}|${r.visual ? JSON.stringify(r.visual) : ''}`,
        enunciado: o.enunciado ?? r.consigna ?? '',
        dibujo,
        pregunta: o.enunciado ? [r.consigna, r.pregunta].filter(Boolean).join(': ') : r.pregunta,
        ...alt,
      }
    },
  }
}

export const TIPOS_CALCULO = [
  deCalculo({ id: 'calc-valor-posicional', habilidad: 'valor-posicional', nivel: 'Millares', nombre: '¿Qué número es?', queHacen: 'Juntan millares, centenas, decenas y unidades en un solo número.' }),
  deCalculo({ id: 'calc-comparar', habilidad: 'comparar', nivel: 'Hasta 10 000', nombre: 'Mayor, menor o igual', queHacen: 'Comparan dos números de cuatro cifras y eligen el signo >, < o =.' }),
  deCalculo({ id: 'calc-redondeo-decena', habilidad: 'redondeo', nivel: 'A la decena', nombre: 'Redondea a la decena', queHacen: 'Redondean un número a la decena más cercana.' }),
  deCalculo({ id: 'calc-redondeo-centena', habilidad: 'redondeo', nivel: 'A la centena', nombre: 'Redondea a la centena', queHacen: 'Redondean un número a la centena más cercana.' }),
  deCalculo({ id: 'calc-sumar', habilidad: 'sumar', nivel: 'Hasta 10 000', nombre: 'Suma', queHacen: 'Suman números de hasta cuatro cifras.' }),
  deCalculo({ id: 'calc-restar', habilidad: 'restar', nivel: 'Hasta 10 000', nombre: 'Resta', queHacen: 'Restan números de hasta cuatro cifras.' }),
  deCalculo({ id: 'calc-tablas', habilidad: 'tablas', nivel: 'Todas', nombre: 'Multiplica', queHacen: 'Resuelven multiplicaciones de las tablas del 2 al 10.' }),
  deCalculo({ id: 'calc-dividir', habilidad: 'dividir', nivel: 'Todas', nombre: 'Divide', queHacen: 'Resuelven divisiones exactas entre 2 y 9.' }),
  deCalculo({ id: 'calc-dobles', habilidad: 'dobles-mitades', nivel: 'Dobles y mitades hasta 100', nombre: 'Dobles y mitades', queHacen: 'Calculan el doble o la mitad de un número.' }),
  deCalculo({ id: 'calc-fraccion-pintada', habilidad: 'fracciones-reconocer', nivel: 'Hasta octavos', nombre: '¿Qué fracción está pintada?', queHacen: 'Miran un círculo partido en partes iguales y escriben la fracción pintada.' }),
  deCalculo({ id: 'calc-fraccion-de', habilidad: 'fraccion-de', nivel: 'Mitad, tercio y cuarto', nombre: 'Fracción de una cantidad', queHacen: 'Calculan la mitad, la tercera o la cuarta parte de una cantidad.' }),
  deCalculo({ id: 'calc-equivalentes', habilidad: 'fracciones-equivalentes', nivel: 'Medios, tercios y cuartos', nombre: 'Fracciones equivalentes', queHacen: 'Encuentran una fracción equivalente amplificando o simplificando.' }),
  deCalculo({ id: 'calc-sumar-fracciones', habilidad: 'fracciones-operar', nivel: 'Igual denominador', nombre: 'Suma y resta de fracciones', queHacen: 'Suman y restan fracciones con el mismo denominador.' }),
  deCalculo({ id: 'calc-ecuacion', habilidad: 'ecuaciones', nivel: 'x + a = b', nombre: 'Halla el número que falta', queHacen: 'Encuentran el término desconocido de una igualdad.' }),
  deCalculo({ id: 'calc-patron-suma', habilidad: 'secuencias', nivel: 'Sumando o restando', nombre: '¿Qué número sigue?', queHacen: 'Descubren la regla de un patrón que suma o resta y siguen la secuencia.' }),
  deCalculo({ id: 'calc-patron-multiplica', habilidad: 'secuencias', nivel: 'Multiplicando', nombre: 'Patrón que multiplica', queHacen: 'Descubren la regla de un patrón que multiplica y siguen la secuencia.' }),
  deCalculo({ id: 'calc-longitud', habilidad: 'medidas', nivel: 'Metros y centímetros', nombre: 'Metros y centímetros', queHacen: 'Convierten metros a centímetros y al revés.' }),
  deCalculo({ id: 'calc-tiempo', habilidad: 'medidas', nivel: 'Horas y minutos', nombre: 'Horas y minutos', queHacen: 'Convierten horas, medias horas y cuartos de hora a minutos.' }),
  deCalculo({ id: 'calc-masa', habilidad: 'medidas', nivel: 'Kilos y gramos', nombre: 'Kilos y gramos', queHacen: 'Convierten kilogramos a gramos y al revés.' }),
  deCalculo({ id: 'calc-litro', habilidad: 'medidas', nivel: 'Medio y cuarto de litro', nombre: 'Medio y cuarto de litro', queHacen: 'Calculan cuántos vasos de medio o cuarto de litro llenan un recipiente.' }),
]
