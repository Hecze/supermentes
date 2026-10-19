// Perfil de la docente: su nombre completo y dónde enseña (sus colegios, cada uno público o privado, con sus grados y
// cursos). Sale del onboarding y de "Mi perfil"; se guarda en el navegador y, al tocar «Guardar», en la base
// (/api/perfil): con cuenta, en docentes; sin cuenta, solo dónde enseña, en docentes_sin_cuenta. El buscador de temas
// abre con los grados y cursos de su colegio.
import { useEffect, useState } from 'react'
import { CURSOS_PRIVADOS, GRADOS_DOCENTE, cursosDe, nivelDe, type TipoColegio } from '../curriculo/catalogo'
import { tokenDeCuenta, useCuenta } from './cuenta'

/**
 * Un colegio donde enseña. En un privado puede tener cursos que parten un área (Álgebra, Geometría…). `numero` es el
 * N.º de la I.E. (2048), `lema` va al pie de sus hojas y `logo` es la imagen cuadrada del encabezado (ver documento.ts).
 */
export type Colegio = { nombre: string; numero?: string; lema?: string; logo?: string; tipo: TipoColegio; grados: string[]; cursos: string[] }

export type Perfil = { nombre: string; colegio?: string; grado: string; grados?: string[]; cursos?: string[]; colegios?: Colegio[] }

/** Grados y cursos con los que busca temas. `cursos` vacío = todos los cursos. */
export type Ensenanza = { grados: string[]; cursos: string[] }

/** 4.º de primaria, todos los cursos: el grado con más contenido listo (banco y hojas). */
export const ENSENANZA_INICIAL: Ensenanza = { grados: ['primaria-4'], cursos: [] }
export const COLEGIO_NUEVO: Colegio = { nombre: '', tipo: 'publico', ...ENSENANZA_INICIAL }

const CLAVE = 'supermentes-perfil'
const CLAVE_COLEGIOS = 'supermentes-colegios'
const CLAVE_ACTIVO = 'supermentes-colegio-activo'
const CLAVE_ANONIMO = 'supermentes-anonimo'
const EVENTO = 'supermentes-perfil'

/** Cursos que se pueden elegir en esos grados: las áreas del currículo y, en un privado, sus cursos propios. */
function cursosValidos(grados: string[], tipo: TipoColegio) {
  const niveles = new Set(grados.map(nivelDe))
  return [
    ...cursosDe(grados).map((a) => a.id),
    ...(tipo === 'privado' ? CURSOS_PRIVADOS.filter((c) => c.niveles.some((n) => niveles.has(n))).map((c) => c.id) : []),
  ]
}

/** Solo grados y cursos que existen (sin inicial), en el orden del catálogo. */
export function ensenanzaValida(e: Partial<Ensenanza> | null | undefined, tipo: TipoColegio = 'privado'): Ensenanza | null {
  const grados = GRADOS_DOCENTE.filter((g) => e?.grados?.includes(g.id)).map((g) => g.id)
  if (!grados.length) return null
  return { grados, cursos: cursosValidos(grados, tipo).filter((id) => e?.cursos?.includes(id)) }
}

const LOGO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/

export function colegioValido(c: Partial<Colegio> | null | undefined): Colegio | null {
  const tipo = c?.tipo === 'privado' ? 'privado' : 'publico'
  const e = ensenanzaValida(c, tipo)
  if (!e) return null
  const numero = (c?.numero ?? '').replace(/^\s*(n\.?\s*[º°o]?\.?\s*)/i, '').trim().slice(0, 12)
  const logo = c?.logo && c.logo.length <= 300_000 && LOGO.test(c.logo) ? c.logo : undefined
  const lema = (c?.lema ?? '').trim().replace(/^["“«]|["”»]$/g, '').slice(0, 120)
  return { nombre: (c?.nombre ?? '').trim().slice(0, 120), ...(numero && { numero }), ...(lema && { lema }), ...(logo && { logo }), tipo, ...e }
}

const validos = (cs: unknown) => (Array.isArray(cs) ? cs.map(colegioValido).filter((c): c is Colegio => !!c).slice(0, 6) : [])

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

/** Lo que se guardaba antes de los colegios: un grado (el inicio) o grados y cursos sueltos. */
function colegioAntiguo(p: Perfil | null): Colegio | null {
  let grado: string | null = null
  try {
    grado = localStorage.getItem('supermentes-grado')
  } catch {
    // Sin almacenamiento no hay nada de antes.
  }
  const e = leer<Ensenanza>('supermentes-ensenanza')
  return colegioValido({ nombre: p?.colegio, tipo: 'publico', grados: e?.grados ?? p?.grados ?? (p ? [p.grado] : grado ? [grado] : []), cursos: e?.cursos ?? p?.cursos ?? [] })
}

/** Dónde enseña, según este navegador. Nunca vacío: si no eligió nada, 4.º de primaria. */
export function colegiosGuardados(): Colegio[] {
  const cs = validos(leer(CLAVE_COLEGIOS))
  if (cs.length) return cs
  const p = perfilLocal()
  const de = validos(p?.colegios)
  if (de.length) return de
  return [colegioAntiguo(p) ?? COLEGIO_NUEVO]
}

/** El colegio con el que abre el buscador (el último que usó). */
export function colegioActivo(): number {
  const i = Number(leer<number>(CLAVE_ACTIVO) ?? 0)
  return Number.isInteger(i) && i >= 0 && i < colegiosGuardados().length ? i : 0
}

export function elegirColegioActivo(i: number) {
  try {
    localStorage.setItem(CLAVE_ACTIVO, JSON.stringify(i))
  } catch {
    // Sin almacenamiento dura esta visita.
  }
}

/** Grados y cursos de su colegio activo: con eso abre el buscador y se elige el primer tema. */
export function ensenanzaGuardada(): Ensenanza {
  const c = colegiosGuardados()[colegioActivo()]
  return { grados: c.grados, cursos: c.cursos }
}

function guardarLocal(p: Perfil | null, colegios: Colegio[]) {
  try {
    if (p) localStorage.setItem(CLAVE, JSON.stringify(p))
    localStorage.setItem(CLAVE_COLEGIOS, JSON.stringify(colegios))
  } catch {
    // Sin almacenamiento vale por esta visita.
  }
  window.dispatchEvent(new Event(EVENTO))
}

/** Id que este navegador inventa la primera vez: así se guarda dónde enseña quien usa la app sin cuenta. */
function idSinCuenta(): string {
  try {
    let id = localStorage.getItem(CLAVE_ANONIMO)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(CLAVE_ANONIMO, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

/** Todos sus grados y cursos juntos, para la base (la verdad está en `colegios`). */
function juntos(colegios: Colegio[]): Ensenanza {
  const grados = GRADOS_DOCENTE.filter((g) => colegios.some((c) => c.grados.includes(g.id))).map((g) => g.id)
  return { grados, cursos: [...new Set(colegios.flatMap((c) => c.cursos))] }
}

/** Lo manda a la base: con cuenta, el perfil completo; sin cuenta, solo dónde enseña. `true` si se guardó. */
async function subir(p: Perfil | null, colegios: Colegio[]): Promise<boolean> {
  const todo = juntos(colegios)
  const enviar = (datos: object, token?: string | null) =>
    fetch('/api/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(datos),
    })
  try {
    const t = await tokenDeCuenta()
    if (t && p) {
      const r = await enviar({ ...p, ...todo, colegios }, t)
      // Si el servidor no reconoce la cuenta (401), igual se guarda dónde enseña, como sin cuenta.
      if (r.status !== 401) return r.ok
    }
    return (await enviar({ ...todo, colegios, anonimo: idSinCuenta() })).ok
  } catch {
    return false
  }
}

/** Guarda su nombre completo y dónde enseña, en este navegador y en la base. `true` si llegó a la base. */
export function guardarPerfil(p: Perfil, colegios: Colegio[]): Promise<boolean> {
  const cs = validos(colegios)
  const lista = cs.length ? cs : colegiosGuardados()
  const completo: Perfil = { ...p, colegio: lista[0].nombre || p.colegio, grado: lista[0].grados[0], ...juntos(lista), colegios: lista }
  guardarLocal(completo, lista)
  return subir(completo, lista)
}

/** Guarda dónde enseña, con o sin cuenta. `true` si llegó a la base. */
export function guardarColegios(colegios: Colegio[]): Promise<boolean> {
  const p = perfilLocal()
  if (p) return guardarPerfil(p, colegios)
  const cs = validos(colegios)
  if (!cs.length) return Promise.resolve(false)
  guardarLocal(null, cs)
  return subir(null, cs)
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
        const cs = validos(d.perfil.colegios)
        guardarLocal(d.perfil, cs.length ? cs : [colegioAntiguo(d.perfil) ?? COLEGIO_NUEVO])
      })
      .catch(() => {})
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [entro])

  return { perfil, cargando }
}

/** Dónde enseña, al día con "Mi perfil". */
export function useColegios(): Colegio[] {
  const [cs, setCs] = useState(colegiosGuardados)
  useEffect(() => {
    const actualizar = () => setCs(colegiosGuardados())
    window.addEventListener(EVENTO, actualizar)
    return () => window.removeEventListener(EVENTO, actualizar)
  }, [])
  return cs
}

/** Grados y cursos de su colegio activo, al día con "Mi perfil". */
export function useEnsenanza(): Ensenanza {
  const [e, setE] = useState(ensenanzaGuardada)
  useEffect(() => {
    const actualizar = () => setE(ensenanzaGuardada())
    window.addEventListener(EVENTO, actualizar)
    return () => window.removeEventListener(EVENTO, actualizar)
  }, [])
  return e
}
