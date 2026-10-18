// Verificador de los exámenes listos. Lo corre `npm run verificar:curriculo` (y `npm run typecheck`); no lo importa
// la app. Falla si:
// - la cita de un tipo de pregunta no aparece tal cual en un desempeño de su grado, o es de otra competencia;
// - un tema de un grado con banco no tiene examen listo, o un tema de Matemática tiene menos de 2 tipos con dibujos;
// - en cientos de versiones al azar, alguna pregunta sale rota: sin texto, con "NaN", alternativas repetidas, la
//   correcta fuera de rango, una pareja o palabra que no cuadra, o un dibujo más ancho que la hoja.
import type { TemaBanco } from '../banco/banco'
import type { CurriculoNivel } from '../curriculo/cargar'
import { ubicarCita } from '../curriculo/citas'
import { crearAzar } from '../juegos/motor/azar'
import { armarVersion, cantidadesPorDefecto, nuevoExamen } from './armar'
import { TIPOS, gruposDe, tiposDelTema } from './catalogo'
import type { Generado, TipoPregunta } from './tipos'

const niveles = import.meta.glob<CurriculoNivel>('../../../../packages/curriculo/data/*.json', { import: 'default', eager: true })
const bancos = import.meta.glob<TemaBanco[]>('../banco/*/*.json', { import: 'default', eager: true })

/** Mínimo de tipos con dibujos y números por tema de Matemática en un grado con exámenes. */
export const MINIMO_MATEMATICA = 2
const SEMILLAS_TIPO = 300
const SEMILLAS_TEMA = 25

const roto = (s: string) => /\bNaN\b|undefined|\[object Object\]/.test(s)

/** Qué tiene mal una pregunta, o null si está bien. */
export function problemaDe(g: Generado): string | null {
  const textos = [g.enunciado, g.pregunta ?? '', g.nota ?? '']
  if (!g.enunciado.trim()) return 'sin enunciado'
  if (g.forma === 'opciones') {
    if (g.alternativas.length < 2 || g.alternativas.length > 5) return `${g.alternativas.length} alternativas`
    if (new Set(g.alternativas.map((a) => a.trim().toLowerCase())).size !== g.alternativas.length) return `alternativas repetidas: ${g.alternativas.join(' | ')}`
    if (!(g.correcta >= 0 && g.correcta < g.alternativas.length)) return 'la correcta está fuera de rango'
    if (g.alternativas.some((a) => !a.trim())) return 'una alternativa vacía'
    textos.push(...g.alternativas)
  } else if (g.forma === 'abierta') {
    if (!g.respuesta.trim()) return 'sin respuesta'
    textos.push(g.respuesta)
  } else if (g.forma === 'unir') {
    const n = g.izquierda.length
    if (n < 3 || g.derecha.length !== n || g.solucion.length !== n) return 'las columnas de unir no cuadran'
    if (new Set(g.solucion).size !== n || g.solucion.some((x) => x < 0 || x >= n)) return 'la solución de unir no es una pareja por fila'
    textos.push(...g.izquierda, ...g.derecha)
  } else {
    if (g.frases.length !== g.respuestas.length || g.frases.length < 2) return 'frases y respuestas no cuadran'
    if (g.respuestas.some((r) => !g.palabras.includes(r))) return 'una respuesta no está en el recuadro'
    if (g.frases.some((f) => !f.includes('____'))) return 'una frase no tiene dónde escribir'
    textos.push(...g.frases, ...g.palabras)
  }
  if (textos.some(roto)) return `texto roto: ${textos.find(roto)}`
  if (g.dibujo) {
    if (!g.dibujo.svg.startsWith('<svg') || roto(g.dibujo.svg)) return 'dibujo roto'
    if (g.dibujo.ancho > 640 || g.dibujo.alto > 420) return `dibujo muy grande (${g.dibujo.ancho}×${g.dibujo.alto} px)`
    if (!g.dibujo.alt.trim()) return 'dibujo sin descripción'
  }
  return null
}

export function verificarExamenes() {
  const errores: string[] = []
  const areas = new Map(Object.values(niveles).flatMap((n) => n.grados.flatMap((g) => g.areas.map((a) => [`${g.id}|${a.id}`, a] as const))))

  // 1. Cada cita, tal cual en un desempeño de su grado y de su competencia.
  let citas = 0
  for (const t of TIPOS.values()) {
    for (const [grado, cita] of Object.entries(t.citas ?? {})) {
      if (!cita) continue
      citas++
      const area = areas.get(`${grado}|${t.area}`)
      const u = area ? ubicarCita(area, cita, t.competencia) : null
      if (!u) errores.push(`${t.nombre} (${t.id}) · ${grado}: la cita no aparece tal cual en los desempeños: «${cita}»`)
      else if (t.competencia && u.numeroCompetencia !== t.competencia) errores.push(`${t.nombre} (${t.id}) · ${grado}: la cita es de la competencia ${u.numeroCompetencia}, no de la ${t.competencia}.`)
    }
  }

  // 2. Cada tipo con dibujos y números, en cientos de semillas.
  const banco4 = bancos['../banco/primaria-4/matematica.json'] ?? []
  for (const t of TIPOS.values()) {
    if (t.cambia !== 'numeros') continue
    let nulos = 0
    for (let s = 1; s <= SEMILLAS_TIPO; s++) {
      let g: Generado | null
      try {
        g = t.generar({ azar: crearAzar(s * 2654435761), banco: banco4[0] ?? null })
      } catch (e) {
        errores.push(`${t.nombre} (${t.id}), semilla ${s}: ${(e as Error).message}`)
        break
      }
      if (!g) {
        nulos++
        continue
      }
      const p = problemaDe(g)
      if (p) {
        errores.push(`${t.nombre} (${t.id}), semilla ${s}: ${p}`)
        break
      }
    }
    if (nulos > SEMILLAS_TIPO * 0.2) errores.push(`${t.nombre} (${t.id}): no arma pregunta en ${nulos} de ${SEMILLAS_TIPO} semillas.`)
  }

  // 3. Cada tema de los grados con banco: su examen sugerido, en varias versiones.
  let temas = 0
  const grados = new Set<string>()
  for (const [ruta, lista] of Object.entries(bancos)) {
    const [, gradoId, archivo] = /\.\.\/banco\/([^/]+)\/([^/]+)\.json$/.exec(ruta) ?? []
    if (!gradoId) continue
    grados.add(gradoId)
    for (const b of lista) {
      temas++
      const tipos: TipoPregunta[] = tiposDelTema(gradoId, archivo, b.tema, b)
      const nombre = `${gradoId} · ${archivo} · «${b.tema}»`
      if (!tipos.length) {
        errores.push(`${nombre}: no tiene examen listo.`)
        continue
      }
      const conDibujos = tipos.filter((t) => t.cambia === 'numeros').length
      // Se exige cuando todos los grupos de Matemática del grado ya tienen sus tipos (matematica/*.ts).
      const completos = gruposDe(gradoId).length > 0 && gruposDe(gradoId).every((g) => g.tipos.length)
      if (archivo === 'matematica' && completos && conDibujos < MINIMO_MATEMATICA)
        errores.push(`${nombre}: tiene ${conDibujos} tipos con dibujos y números (mínimo ${MINIMO_MATEMATICA}).`)
      const porId = new Map(tipos.map((t) => [t.id, t]))
      for (let s = 1; s <= SEMILLAS_TEMA; s++) {
        const config = nuevoExamen(tipos, cantidadesPorDefecto(tipos), true, s * 40503)
        for (const fila of [0, 1] as const) {
          const v = armarVersion(config, porId, b, fila)
          if (v.items.length < Math.min(5, config.items.length)) {
            errores.push(`${nombre}, semilla ${s}: el examen salió con ${v.items.length} de ${config.items.length} preguntas.`)
            break
          }
          const mal = v.items.map((it) => [it, problemaDe(it)] as const).find(([, p]) => p)
          if (mal) {
            errores.push(`${nombre}, semilla ${s}, ${porId.get(mal[0].tipo)?.nombre}: ${mal[1]}`)
            break
          }
        }
      }
    }
  }
  return { citas, tipos: TIPOS.size, temas, grados: [...grados], errores }
}
