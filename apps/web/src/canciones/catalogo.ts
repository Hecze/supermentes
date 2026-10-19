import { useEffect, useState } from 'react'
import type { Ficha } from '../api'
import { normalizar } from '../curriculo/buscar'

// Canciones educativas que ya existen en YouTube, para usarlas como material en clase.
//
// Cada una se ofrece solo en los grados donde un desempeño oficial la respalda: `grados` guarda, por grado, un
// fragmento copiado letra por letra de un desempeño de su área (packages/curriculo). `npm run verificar:curriculo`
// comprueba cada cita. Los `temas` vienen de las listas de temas del JSON (no oficiales): sirven para encontrarla.

export type CancionExistente = {
  /** Id del video de YouTube. */
  id: string
  titulo: string
  canal: string
  duracion?: string
  idioma: 'es' | 'en'
  /** Área del currículo (comunicacion, matematica…). */
  area: string
  /** Por grado, la cita textual del desempeño que la canción trabaja. */
  grados: Partial<Record<string, string>>
  temas: string[]
  resumen: string
}

let cache: Promise<CancionExistente[]> | null = null

/** El catálogo se descarga solo cuando se abre la pantalla de canciones. */
export function cargarCanciones() {
  cache ??= import('./canciones.json').then((m) => m.default as CancionExistente[])
  return cache
}

const raices = (t: string) =>
  new Set(
    normalizar(t)
      .split(/[^a-z0-9]+/)
      .filter((p) => p.length > 3)
      .map((p) => p.slice(0, 5)),
  )

export type CancionesDelTema = { delTema: CancionExistente[]; otras: CancionExistente[] }

/**
 * Las canciones del grado: primero las del tema (por su nombre: pesa más si está en el título de la canción),
 * después las demás del mismo curso. De otro curso del grado solo entran las que coinciden con todo el nombre
 * del tema; su «i» muestra el desempeño de su propio curso.
 */
export function cancionesDelTema(todas: CancionExistente[], ficha: Ficha): CancionesDelTema {
  const delGrado = todas.filter((c) => c.grados[ficha.gradoId])
  const titulo = normalizar(ficha.titulo)
  const claves = [...raices(ficha.titulo)]
  const puntos = (c: CancionExistente) => {
    const enTitulo = raices(c.titulo)
    const enTemas = raices(c.temas.join(' '))
    const exacto = c.temas.some((t) => normalizar(t) === titulo)
    const todas = claves.length > 0 && claves.every((k) => enTitulo.has(k) || enTemas.has(k))
    const p = (exacto ? 100 : 0) + claves.reduce((n, k) => n + (enTitulo.has(k) ? 3 : 0) + (enTemas.has(k) ? 2 : 0), 0)
    if (c.area !== ficha.areaId) return exacto || todas ? p : -1
    return p
  }
  const conPuntos = delGrado
    .map((c) => ({ c, p: puntos(c) }))
    .filter((x) => x.p >= 0)
    .sort((a, b) => b.p - a.p)
  return {
    delTema: conPuntos.filter((x) => x.p > 0).map((x) => x.c),
    otras: conPuntos.filter((x) => x.p === 0 && x.c.area === ficha.areaId).map((x) => x.c),
  }
}

/** Catálogo cargado (null mientras se descarga). */
export function useCanciones() {
  const [todas, setTodas] = useState<CancionExistente[] | null>(null)
  useEffect(() => {
    let vivo = true
    cargarCanciones().then((c) => vivo && setTodas(c))
    return () => {
      vivo = false
    }
  }, [])
  return todas
}
