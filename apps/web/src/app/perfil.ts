// Perfil de la docente: cómo la llaman, su colegio y lo que enseña (grados y cursos). Sale del onboarding y de
// "Mi perfil"; se guarda en el navegador y, con cuenta, en /api/perfil (tabla docentes), así no se lo volvemos a
// preguntar en otra computadora. Lo que enseña también vale sin cuenta: el buscador de temas abre con eso.
import { useEffect, useState } from 'react'
import { GRADOS_DOCENTE, cursosDe } from '../curriculo/catalogo'
import { tokenDeCuenta, useCuenta } from './cuenta'

export type Perfil = { nombre: string; colegio?: string; grado: string; grados?: string[]; cursos?: string[] }

/** Grados y cursos que enseña la docente. `cursos` vacío = todos los cursos (lo normal en primaria). */
export type Ensenanza = { grados: string[]; cursos: string[] }

/** 4.º de primaria, todos los cursos: el grado con más contenido listo (banco, hojas y canciones). */
export const ENSENANZA_INICIAL: Ensenanza = { grados: ['primaria-4'], cursos: [] }

const CLAVE = 'supermentes-perfil'
const CLAVE_ENSENANZA = 'supermentes-ensenanza'
const EVENTO = 'supermentes-perfil'

/** Solo grados y cursos que existen (sin inicial), en el orden del currículo. */
export function ensenanzaValida(e: Partial<Ensenanza> | null | undefined): Ensenanza | null {
  const grados = GRADOS_DOCENTE.filter((g) => e?.grados?.includes(g.id)).map((g) => g.id)
  if (!grados.length) return null
  const cursos = cursosDe(grados)
    .filter((a) => e?.cursos?.includes(a.id))
    .map((a) => a.id)
  return { grados, cursos }
}

function leer<T>(clave: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(clave) ?? 'null') as T | null
  } catch {
    return null
  }
}

function perfilLocal(): Perfil | null {
  const p = leer<Perfil>(CLAVE)
  return p?.nombre && p.grado ? p : null
}

/** El grado que se elegía antes en el inicio (un solo grado, sin cursos). */
function gradoAntiguo(): string[] {
  try {
    const g = localStorage.getItem('supermentes-grado')
    return g ? [g] : []
  } catch {
    return []
  }
}

/** Lo que enseña, de este navegador; si nunca lo eligió, el grado del onboarding o 4.º de primaria. */
export function ensenanzaGuardada(): Ensenanza {
  const p = perfilLocal()
  return (
    ensenanzaValida(leer<Ensenanza>(CLAVE_ENSENANZA)) ??
    ensenanzaValida({ grados: p ? [p.grado] : gradoAntiguo(), cursos: [] }) ??
    ENSENANZA_INICIAL
  )
}

function guardarLocal(p: Perfil | null, e?: Ensenanza) {
  try {
    if (p) localStorage.setItem(CLAVE, JSON.stringify(p))
    if (e) localStorage.setItem(CLAVE_ENSENANZA, JSON.stringify(e))
  } catch {
    // Sin almacenamiento vale por esta visita.
  }
  window.dispatchEvent(new Event(EVENTO))
}

function subir(p: Perfil) {
  tokenDeCuenta().then((t) => {
    if (t) void fetch('/api/perfil', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify(p) }).catch(() => {})
  })
}

export function guardarPerfil(p: Perfil) {
  const e = ensenanzaValida({ grados: p.grados ?? [p.grado], cursos: p.cursos ?? [] }) ?? ensenanzaGuardada()
  const completo = { ...p, grado: e.grados[0], grados: e.grados, cursos: e.cursos }
  guardarLocal(completo, e)
  subir(completo)
}

/** Guarda lo que enseña; con cuenta también va al perfil del servidor. */
export function guardarEnsenanza(e: Ensenanza) {
  const valida = ensenanzaValida(e)
  if (!valida) return
  const p = perfilLocal()
  if (!p) return guardarLocal(null, valida)
  guardarPerfil({ ...p, grados: valida.grados, cursos: valida.cursos })
}

/** El perfil, buscándolo en la cuenta si este navegador no lo tiene. `cargando` mientras se pregunta. */
export function usePerfil() {
  const { entro } = useCuenta()
  const [perfil, setPerfil] = useState(perfilLocal)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const actualizar = () => setPerfil(perfilLocal())
    window.addEventListener(EVENTO, actualizar)
    return () => window.removeEventListener(EVENTO, actualizar)
  }, [])

  useEffect(() => {
    if (!entro || perfilLocal()) return
    let vivo = true
    setCargando(true)
    tokenDeCuenta()
      .then((t) => (t ? fetch('/api/perfil', { headers: { Authorization: `Bearer ${t}` } }) : null))
      .then((r) => (r?.ok ? (r.json() as Promise<{ perfil: Perfil | null }>) : null))
      .then((d) => {
        if (!d?.perfil) return
        const e = ensenanzaValida({ grados: d.perfil.grados?.length ? d.perfil.grados : [d.perfil.grado], cursos: d.perfil.cursos ?? [] })
        guardarLocal(d.perfil, e ?? undefined)
      })
      .catch(() => {})
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [entro])

  return { perfil, cargando }
}

/** Lo que enseña la docente, al día con "Mi perfil". */
export function useEnsenanza(): Ensenanza {
  const [e, setE] = useState(ensenanzaGuardada)
  useEffect(() => {
    const actualizar = () => setE(ensenanzaGuardada())
    window.addEventListener(EVENTO, actualizar)
    return () => window.removeEventListener(EVENTO, actualizar)
  }, [])
  return e
}
