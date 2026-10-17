import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { CREDITOS_MENSUALES, MODO_EJEMPLO, type AudioCancion, type Adaptacion, type Cancion, type Examen, type Ficha, type Juego } from '../api'
import { FICHA_EJEMPLO, JUEGO_EJEMPLO, examenEjemplo } from '../api/ejemplos'

export const VISTAS = ['inicio', 'ficha', 'cancion', 'examen', 'juego', 'crucigrama', 'adaptar', 'biblioteca'] as const
export type Vista = (typeof VISTAS)[number]

type Tono = 'info' | 'ok' | 'error'
export type Aviso = { id: number; texto: string; tono: Tono }
type Tema = 'light' | 'dark'

export type Resultados = {
  cancion?: Cancion
  audio?: AudioCancion
  examen?: Examen
  juego?: Juego
  adaptacion?: Adaptacion
}

type Store = {
  vista: Vista
  ir: (v: Vista) => void
  ficha: Ficha | null
  setFicha: (f: Ficha) => void
  resultados: Resultados
  guardar: <K extends keyof Resultados>(clave: K, valor: Resultados[K]) => void
  creditos: number
  gastar: (n: number) => boolean
  devolver: (n: number) => void
  avisos: Aviso[]
  avisar: (texto: string, tono?: Tono) => void
  tema: Tema
  cambiarTema: () => void
}

const Ctx = createContext<Store | null>(null)

function vistaDelHash(): Vista {
  try {
    const h = window.location.hash.replace('#', '')
    return (VISTAS as readonly string[]).includes(h) ? (h as Vista) : 'inicio'
  } catch {
    return 'inicio'
  }
}

function temaGuardado(): Tema | null {
  try {
    const t = localStorage.getItem('supermentes-tema')
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

function temaActual(): Tema {
  const attr = document.documentElement.dataset.theme
  if (attr === 'light' || attr === 'dark') return attr
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

// En modo ejemplo la app arranca con un tema a medio trabajar: examen y juego listos, canción y adaptación por crear.
const RESULTADOS_INICIALES: Resultados = MODO_EJEMPLO
  ? {
      examen: examenEjemplo({ interes: 'Fútbol', formato: 'mision' }),
      juego: JUEGO_EJEMPLO,
    }
  : {}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [vista, setVista] = useState<Vista>(vistaDelHash)
  const [ficha, setFichaState] = useState<Ficha | null>(MODO_EJEMPLO ? FICHA_EJEMPLO : null)
  const [resultados, setResultados] = useState<Resultados>(RESULTADOS_INICIALES)
  const [creditos, setCreditos] = useState(MODO_EJEMPLO ? 18 : CREDITOS_MENSUALES)
  const [avisos, setAvisos] = useState<Aviso[]>([])
  const [tema, setTema] = useState<Tema>(() => {
    const guardado = temaGuardado()
    if (guardado) document.documentElement.dataset.theme = guardado
    return guardado ?? temaActual()
  })

  useEffect(() => {
    const alCambiar = () => setVista(vistaDelHash())
    window.addEventListener('hashchange', alCambiar)
    window.addEventListener('popstate', alCambiar)
    return () => {
      window.removeEventListener('hashchange', alCambiar)
      window.removeEventListener('popstate', alCambiar)
    }
  }, [])

  const ir = useCallback((v: Vista) => {
    setVista(v)
    try {
      history.pushState(null, '', `#${v}`)
    } catch {
      // Algunos visores no permiten cambiar la URL; la navegación sigue funcionando.
    }
    window.scrollTo({ top: 0 })
  }, [])

  const setFicha = useCallback((f: Ficha) => {
    setFichaState(f)
    setResultados({})
  }, [])

  const guardar = useCallback(<K extends keyof Resultados>(clave: K, valor: Resultados[K]) => {
    setResultados((r) => ({ ...r, [clave]: valor }))
  }, [])

  const avisar = useCallback((texto: string, tono: Tono = 'info') => {
    const id = Date.now() + Math.random()
    setAvisos((a) => [...a, { id, texto, tono }])
    setTimeout(() => setAvisos((a) => a.filter((x) => x.id !== id)), 3600)
  }, [])

  const gastar = useCallback(
    (n: number) => {
      if (n === 0) return true
      if (creditos < n) {
        avisar(`Te faltan créditos: esto cuesta ${n} y te quedan ${creditos}.`, 'error')
        return false
      }
      setCreditos((c) => c - n)
      return true
    },
    [creditos, avisar],
  )

  const devolver = useCallback((n: number) => setCreditos((c) => c + n), [])

  const cambiarTema = useCallback(() => {
    const siguiente: Tema = temaActual() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = siguiente
    try {
      localStorage.setItem('supermentes-tema', siguiente)
    } catch {
      // Sin almacenamiento el tema dura solo esta visita.
    }
    setTema(siguiente)
  }, [])

  return (
    <Ctx.Provider
      value={{ vista, ir, ficha, setFicha, resultados, guardar, creditos, gastar, devolver, avisos, avisar, tema, cambiarTema }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore debe usarse dentro de StoreProvider')
  return s
}
