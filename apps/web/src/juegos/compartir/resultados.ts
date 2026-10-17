// Resultados sin cuentas: el alumno escribe su nombre una vez en ese celular y cada partida manda su puntaje.
// El docente guarda en su laptop la clave de cada juego que envió y con ella ve quién jugó y su mejor puntaje.
import type { JuegoId, Resultado } from '../tipos'

// ---------- Alumno (en el celular de la familia) ----------

export type Alumno = { id: string; nombre: string }

const CLAVE_ALUMNO = 'supermentes-alumno'

export function alumnoGuardado(): Alumno | null {
  try {
    const a = JSON.parse(localStorage.getItem(CLAVE_ALUMNO) ?? 'null') as Alumno | null
    return a?.id && a.nombre ? a : null
  } catch {
    return null
  }
}

const CLAVE_CONOCIDOS = 'supermentes-alumnos'
const comparable = (nombre: string) => nombre.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * Un nombre nuevo es un alumno nuevo: dos hermanos pueden jugar en el mismo celular. Si vuelve a escribir un
 * nombre que este celular ya conoce, sigue siendo el mismo alumno (no aparece dos veces en la tabla del docente).
 */
export function guardarAlumno(nombre: string): Alumno {
  const limpio = nombre.trim().replace(/\s+/g, ' ').slice(0, 30)
  let conocidos: Alumno[] = []
  try {
    conocidos = (JSON.parse(localStorage.getItem(CLAVE_CONOCIDOS) ?? '[]') as Alumno[]).filter((a) => a?.id && a.nombre)
  } catch {
    // Sin lista, se crea un alumno nuevo.
  }
  const previo = conocidos.find((a) => comparable(a.nombre) === comparable(limpio))
  const alumno = { id: previo?.id ?? Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join(''), nombre: limpio }
  try {
    localStorage.setItem(CLAVE_ALUMNO, JSON.stringify(alumno))
    localStorage.setItem(CLAVE_CONOCIDOS, JSON.stringify([alumno, ...conocidos.filter((a) => a.id !== alumno.id)].slice(0, 10)))
  } catch {
    // Sin almacenamiento el nombre dura esta visita.
  }
  return alumno
}

/** Manda el puntaje de una partida. Devuelve si es su mejor puntaje, o null si no se pudo guardar. */
export async function enviarResultado(codigo: string, alumno: Alumno, juego: JuegoId, r: Resultado): Promise<boolean | null> {
  try {
    const res = await fetch('/api/resultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo, alumno, juego, puntaje: Math.max(0, Math.round(r.puntaje ?? 0)), estrellas: r.estrellas }),
    })
    if (!res.ok) return null
    return ((await res.json()) as { nuevoRecord?: boolean }).nuevoRecord ?? false
  } catch {
    return null
  }
}

// ---------- Docente (en su laptop) ----------

export type Enviado = { codigo: string; clave: string; juego: JuegoId; tema: string; fecha: string }

const CLAVE_ENVIADOS = 'supermentes-juegos-enviados'

export function enviados(): Enviado[] {
  try {
    return (JSON.parse(localStorage.getItem(CLAVE_ENVIADOS) ?? '[]') as Enviado[]).filter((e) => e.codigo && e.clave)
  } catch {
    return []
  }
}

export function guardarEnviado(e: Enviado) {
  try {
    const lista = [e, ...enviados().filter((x) => x.codigo !== e.codigo)].slice(0, 200)
    localStorage.setItem(CLAVE_ENVIADOS, JSON.stringify(lista))
    window.dispatchEvent(new Event('supermentes-enviados'))
  } catch {
    // Sin almacenamiento no se recuerdan los envíos.
  }
}

export type FilaResultado = {
  id: string
  nombre: string
  intentos: number
  mejor: { puntaje: number; estrellas: number; juego: JuegoId; fecha: string }
  ultimo: string
}

export async function cargarResultados(e: Enviado): Promise<FilaResultado[]> {
  const res = await fetch(`/api/resultados?codigo=${e.codigo}&clave=${encodeURIComponent(e.clave)}`)
  if (!res.ok) throw new Error(`El servidor respondió ${res.status}`)
  return ((await res.json()) as { alumnos: FilaResultado[] }).alumnos
}
