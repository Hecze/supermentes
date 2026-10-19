// Verificador del banco: cada cita tiene que aparecer letra por letra en un desempeño de su área y grado, y en los
// grados con banco todos los temas del currículo tienen que tener al menos 2 juegos apenas se crean.
// Lo corre `npm run verificar:curriculo`; no lo importa la app.
import type { Ficha } from '../api'
import { cancionesDelTema, type CancionExistente } from '../canciones/catalogo'
import canciones from '../canciones/canciones.json'
import { normalizar, temasDe } from '../curriculo/buscar'
import type { CurriculoNivel } from '../curriculo/cargar'
import { ubicarCita } from '../curriculo/citas'
import { juegosCompatibles } from '../juegos/catalogo'
import { contenidoDelTema, contenidoMatematica } from '../juegos/contenido'
import { habilidadesDelTema } from '../juegos/matematica/deducir'
import { juegoDelBanco, type TemaBanco } from './banco'

const niveles = import.meta.glob<CurriculoNivel>('../../../../packages/curriculo/data/*.json', { import: 'default', eager: true })
const archivos = import.meta.glob<TemaBanco[]>('./*/*.json', { import: 'default', eager: true })

export const MINIMO = 2

/** Juegos y canciones (de YouTube) que tiene un tema apenas se crea, como lo ve el docente (views/Juego.tsx y views/Cancion.tsx). */
export function cuantos(ficha: Ficha, t: TemaBanco | null) {
  const p = habilidadesDelTema(ficha)[0]
  const contenido = p ? contenidoMatematica(p) : contenidoDelTema(ficha, t ? juegoDelBanco(t) : undefined)
  return {
    juegos: contenido ? juegosCompatibles(contenido, ficha.gradoId).length : 0,
    canciones: cancionesDelTema(canciones as CancionExistente[], ficha).delTema.length,
  }
}

export function fichaDe(gradoId: string, grado: string, areaId: string, area: string, tema: string): Ficha {
  return {
    id: 'x',
    fecha: '',
    titulo: tema,
    gradoId,
    areaId,
    grado,
    area,
    duracion: '45 min',
    fuente: '',
    proposito: '',
    curriculo: { competencia: '', capacidad: '' },
    conceptos: [],
    vocabulario: [],
    ejemplo: '',
    errorFrecuente: '',
  }
}

/** El banco de un grado y área (por ruta: "./primaria-4/matematica.json"). */
export function bancoDe(gradoId: string, areaId: string) {
  return archivos[`./${gradoId}/${areaId}.json`] ?? null
}

export function verificarBanco() {
  const grados = new Map(Object.values(niveles).flatMap((n) => n.grados.map((g) => [g.id, g] as const)))
  const errores: string[] = []
  let citas = 0
  let temas = 0
  const conBanco = new Set<string>()

  for (const ruta of Object.keys(archivos)) {
    const [, gradoId, areaId] = ruta.match(/^\.\/([^/]+)\/([^/]+)\.json$/) ?? []
    conBanco.add(gradoId)
    const area = grados.get(gradoId)?.areas.find((a) => a.id === areaId)
    if (!area) {
      errores.push(`${ruta}: no hay currículo de ${areaId} para ${gradoId}.`)
      continue
    }
    const delCurriculo = new Set(temasDe(area).map((x) => normalizar(x.tema)))
    for (const t of archivos[ruta]) {
      citas++
      const u = ubicarCita(area, t.cita, t.competencia)
      if (!u) errores.push(`Banco ${gradoId} · «${t.tema}»: la cita no aparece tal cual en los desempeños: «${t.cita}»`)
      else if (u.numeroCompetencia !== t.competencia) errores.push(`Banco ${gradoId} · «${t.tema}»: la cita es de la competencia ${u.numeroCompetencia}, no de la ${t.competencia}.`)
      if (!delCurriculo.has(normalizar(t.tema))) errores.push(`Banco ${gradoId} · «${t.tema}»: no es un tema de ${area.nombre} en el currículo.`)
    }
  }

  // En los grados con banco, ningún tema se queda sin juegos.
  for (const gradoId of conBanco) {
    const g = grados.get(gradoId)
    if (!g) continue
    for (const a of g.areas) {
      const banco = bancoDe(gradoId, a.id)
      for (const { tema } of temasDe(a)) {
        temas++
        const t = banco?.find((x) => normalizar(x.tema) === normalizar(tema)) ?? null
        const n = cuantos(fichaDe(gradoId, g.nombre, a.id, a.nombre, tema), t)
        if (!t) errores.push(`Banco ${gradoId} · ${a.nombre}: falta el tema «${tema}».`)
        if (n.juegos < MINIMO) errores.push(`Banco ${gradoId} · «${tema}»: ${n.juegos} juegos (mínimo ${MINIMO}).`)
      }
    }
  }
  return { citas, temas, grados: [...conBanco], errores }
}
