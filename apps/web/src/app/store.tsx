import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { CREDITOS_MENSUALES, MODO_EJEMPLO, type AudioCancion, type Cancion, type Examen, type Ficha, type Juego, type Sesion } from '../api'
import { FICHA_EJEMPLO, JUEGO_EJEMPLO, TEMAS_INICIALES } from '../api/ejemplos'
import type { ConfigExamen } from '../examenes/tipos'
import { completarConIA, type EstadoCompletar } from './temaInstantaneo'

export const VISTAS = ['ficha', 'sesion', 'cancion', 'examen', 'juego', 'crucigrama', 'biblioteca', 'resultados'] as const
export type Vista = (typeof VISTAS)[number]

type Tono = 'info' | 'ok' | 'error'
export type PestanaBiblioteca = 'curriculo' | 'examenes' | 'materiales'
export type Aviso = { id: number; texto: string; tono: Tono }
type Tema = 'light' | 'dark'

export type FilaCrucigrama = { id: number; palabra: string; pista: string }

export type Resultados = {
  /** Palabras y pistas que eligió el docente. */
  crucigrama?: { filas: FilaCrucigrama[] }
  sesion?: Sesion
  cancion?: Cancion
  audio?: AudioCancion
  examen?: Examen
  /** El examen listo del tema (examenes/): qué preguntas lleva y con qué números, para volver a la misma versión. */
  examenListo?: ConfigExamen
  juego?: Juego
  /** Con qué se juega este tema: sus palabras y preguntas, o una habilidad de cálculo (src/juegos). */
  juegos?: { fuente: 'tema' } | { fuente: 'calculo'; habilidad: string; nivel: number }
}

/** Lo que la ventana de "Nuevo tema" trae ya escrito (por ejemplo, desde un tema del currículo). */
export type PrevioTema = {
  texto?: string
  gradoId?: string
  areaId?: string
  /** Índice de la competencia del tema, si se conoce. */
  indiceCompetencia?: number
  /** A dónde ir apenas se crea (por defecto, la ficha del tema). */
  destino?: Vista
}

type Store = {
  vista: Vista
  ir: (v: Vista) => void
  /** Temas de la docente, del más reciente al más antiguo. */
  temas: Ficha[]
  ficha: Ficha | null
  setFicha: (f: Ficha) => void
  /** Cambia una ficha sin elegirla (por ejemplo, cuando la IA termina de completarla). */
  actualizarFicha: (id: string, cambios: Partial<Ficha>) => void
  /** Fichas que la IA está completando o que no pudo completar (ver app/temaInstantaneo.ts). */
  completando: Record<string, EstadoCompletar>
  completarFicha: (f: Ficha) => void
  elegirTema: (id: string) => void
  nuevoTemaAbierto: boolean
  previoTema: PrevioTema | null
  abrirNuevoTema: (previo?: PrevioTema) => void
  cerrarNuevoTema: () => void
  /** Pestaña de la Biblioteca y documento del currículo que está abierto. */
  pestanaBiblioteca: PestanaBiblioteca
  setPestanaBiblioteca: (p: PestanaBiblioteca) => void
  curriculoAbierto: { gradoId: string; areaId: string } | null
  verCurriculo: (gradoId: string, areaId: string) => void
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
    return (VISTAS as readonly string[]).includes(h) ? (h as Vista) : 'ficha'
  } catch {
    return 'ficha'
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

// En modo ejemplo la docente ya tiene tres temas; en el de fracciones, el juego está listo.
const RESULTADOS_INICIALES: Record<string, Resultados> = MODO_EJEMPLO
  ? { [FICHA_EJEMPLO.id]: { juego: JUEGO_EJEMPLO } }
  : {}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [vista, setVista] = useState<Vista>(vistaDelHash)
  const [temas, setTemas] = useState<Ficha[]>(MODO_EJEMPLO ? TEMAS_INICIALES : [])
  const [fichaId, setFichaId] = useState<string | null>(MODO_EJEMPLO ? FICHA_EJEMPLO.id : null)
  const [porTema, setPorTema] = useState<Record<string, Resultados>>(RESULTADOS_INICIALES)
  const [nuevoTemaAbierto, setNuevoTemaAbierto] = useState(false)
  const [previoTema, setPrevioTema] = useState<PrevioTema | null>(null)
  const [pestanaBiblioteca, setPestanaBiblioteca] = useState<PestanaBiblioteca>('curriculo')
  const [curriculoAbierto, setCurriculoAbierto] = useState<{ gradoId: string; areaId: string } | null>(null)
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
    setTemas((lista) => [f, ...lista.filter((t) => t.id !== f.id)])
    setFichaId(f.id)
  }, [])

  const actualizarFicha = useCallback((id: string, cambios: Partial<Ficha>) => {
    setTemas((lista) => lista.map((t) => (t.id === id ? { ...t, ...cambios } : t)))
  }, [])

  const [completando, setCompletando] = useState<Record<string, EstadoCompletar>>({})
  const completarFicha = useCallback(
    (f: Ficha) =>
      void completarConIA(f, actualizarFicha, (id, e) =>
        setCompletando((c) => {
          const { [id]: _, ...resto } = c
          return e ? { ...resto, [id]: e } : resto
        }),
      ),
    [actualizarFicha],
  )

  const elegirTema = useCallback(
    (id: string) => {
      setFichaId(id)
      ir('ficha')
    },
    [ir],
  )

  const guardar = useCallback(
    <K extends keyof Resultados>(clave: K, valor: Resultados[K]) => {
      if (!fichaId) return
      setPorTema((r) => ({ ...r, [fichaId]: { ...r[fichaId], [clave]: valor } }))
    },
    [fichaId],
  )

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

  const ficha = temas.find((t) => t.id === fichaId) ?? null

  const verCurriculo = useCallback(
    (gradoId: string, areaId: string) => {
      setCurriculoAbierto({ gradoId, areaId })
      setPestanaBiblioteca('curriculo')
      ir('biblioteca')
    },
    [ir],
  )

  return (
    <Ctx.Provider
      value={{
        vista,
        ir,
        temas,
        ficha,
        setFicha,
        actualizarFicha,
        completando,
        completarFicha,
        elegirTema,
        nuevoTemaAbierto,
        previoTema,
        abrirNuevoTema: (previo?: PrevioTema) => {
          setPrevioTema(previo ?? null)
          setNuevoTemaAbierto(true)
        },
        cerrarNuevoTema: () => setNuevoTemaAbierto(false),
        pestanaBiblioteca,
        setPestanaBiblioteca,
        curriculoAbierto,
        verCurriculo,
        resultados: (fichaId && porTema[fichaId]) || {},
        guardar,
        creditos,
        gastar,
        devolver,
        avisos,
        avisar,
        tema,
        cambiarTema,
      }}
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

/** "Hoy", "Ayer", el día de la semana o la fecha corta. */
export function cuando(fecha: string) {
  const d = new Date(fecha)
  const dias = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000)
  if (dias <= 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 7) {
    const dia = d.toLocaleDateString('es-PE', { weekday: 'long' })
    return dia[0].toUpperCase() + dia.slice(1)
  }
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}
