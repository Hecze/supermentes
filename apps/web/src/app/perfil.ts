// Perfil de la docente con cuenta: cómo la llaman, su colegio y su grado. Sale del onboarding y se guarda en el
// navegador y en su cuenta (/api/perfil, tabla docentes), así no se lo volvemos a preguntar en otra computadora.
import { useEffect, useState } from 'react'
import { tokenDeCuenta, useCuenta } from './cuenta'

export type Perfil = { nombre: string; colegio?: string; grado: string }

const CLAVE = 'supermentes-perfil'
const EVENTO = 'supermentes-perfil'

function perfilLocal(): Perfil | null {
  try {
    const p = JSON.parse(localStorage.getItem(CLAVE) ?? 'null') as Perfil | null
    return p?.nombre && p.grado ? p : null
  } catch {
    return null
  }
}

function guardarLocal(p: Perfil) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(p))
    // El inicio abre con este grado (ver views/Inicio.tsx).
    localStorage.setItem('supermentes-grado', p.grado)
  } catch {
    // Sin almacenamiento vale por esta visita.
  }
  window.dispatchEvent(new Event(EVENTO))
}

export function guardarPerfil(p: Perfil) {
  guardarLocal(p)
  tokenDeCuenta().then((t) => {
    if (t) void fetch('/api/perfil', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify(p) }).catch(() => {})
  })
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
      .then((d) => d?.perfil && guardarLocal(d.perfil))
      .catch(() => {})
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [entro])

  return { perfil, cargando }
}
