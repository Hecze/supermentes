import { Camera, Check, FileText, LoaderCircle, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../api'
import { GRADOS } from '../app/herramientas'
import { useStore } from '../app/store'
import { Boton, cx } from './ui'

type Material = { nombre: string; url: string | null; archivo?: File; tipo: 'foto' | 'archivo' }

const PASOS = ['Leyendo lo que enviaste', 'Buscando las ideas y palabras clave', 'Preparando tu tema']

/** Ventana para crear un tema: qué vas a enseñar, para qué grado y, si quieres, el material. */
export function NuevoTema() {
  const { nuevoTemaAbierto, cerrarNuevoTema, setFicha, ir, avisar, ficha } = useStore()
  const dialogo = useRef<HTMLDialogElement>(null)
  const [texto, setTexto] = useState('')
  const [grado, setGrado] = useState(ficha?.grado ?? '4.º primaria')
  const [material, setMaterial] = useState<Material | null>(null)
  const [paso, setPaso] = useState<number | null>(null)
  const temporizadores = useRef<number[]>([])

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (nuevoTemaAbierto && !d.open) {
      setTexto('')
      setMaterial(null)
      setPaso(null)
      if (ficha) setGrado(ficha.grado)
      d.showModal()
    }
    if (!nuevoTemaAbierto && d.open) d.close()
  }, [nuevoTemaAbierto, ficha])

  useEffect(() => () => temporizadores.current.forEach((t) => window.clearTimeout(t)), [])

  const ocupado = paso !== null
  const listo = texto.trim().length > 2 || !!material

  async function crear(e: FormEvent) {
    e.preventDefault()
    if (!listo || ocupado) return
    setPaso(0)
    temporizadores.current.push(
      window.setTimeout(() => setPaso(1), 600),
      window.setTimeout(() => setPaso(2), 1200),
    )
    try {
      const nueva = await api.prepararFicha({
        tipo: material ? material.tipo : 'texto',
        texto: texto.trim() || undefined,
        archivo: material?.archivo,
        grado,
      })
      setFicha(nueva)
      cerrarNuevoTema()
      ir('ficha')
    } catch {
      avisar('No pudimos preparar el tema. Revisa tu conexión e intenta de nuevo.', 'error')
      setPaso(null)
    }
  }

  function elegirArchivo(f: File | undefined) {
    if (!f) return
    const esFoto = f.type.startsWith('image/')
    setMaterial({ nombre: f.name, url: esFoto ? URL.createObjectURL(f) : null, archivo: f, tipo: esFoto ? 'foto' : 'archivo' })
  }

  return (
    <dialog
      ref={dialogo}
      onClose={cerrarNuevoTema}
      onCancel={(e) => ocupado && e.preventDefault()}
      onClick={(e) => e.target === dialogo.current && !ocupado && cerrarNuevoTema()}
      aria-labelledby="nuevo-tema-titulo"
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/45"
    >
      <form onSubmit={crear} className="flex flex-col">
        <header className="flex items-start justify-between gap-4 px-6 pt-6">
          <div>
            <h2 id="nuevo-tema-titulo" className="font-display text-2xl font-bold">
              Nuevo tema
            </h2>
            <p className="text-ink-soft">Cuéntanos qué vas a enseñar y preparamos todo lo demás.</p>
          </div>
          {!ocupado && (
            <button type="button" onClick={cerrarNuevoTema} className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label="Cerrar">
              <X className="size-5" />
            </button>
          )}
        </header>

        {ocupado ? (
          <div className="flex flex-col gap-4 px-6 py-8 text-lg" role="status">
            {PASOS.map((p, i) => (
              <p key={p} className={cx('flex items-center gap-3', i > paso && 'text-ink-soft')}>
                {i < paso ? (
                  <Check className="size-6 text-ok" aria-hidden />
                ) : i === paso ? (
                  <LoaderCircle className="size-6 animate-spin" aria-hidden />
                ) : (
                  <span className="size-6" />
                )}
                {p}
              </p>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-6 py-6">
            <label htmlFor="nuevo-tema-texto" className="flex flex-col gap-1.5">
              <span className="font-medium">¿Qué tema vas a enseñar?</span>
              <input
                id="nuevo-tema-texto"
                autoFocus
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Ej.: Las fracciones"
                className="h-12 rounded-xl border-2 border-line bg-surface px-4 text-lg focus:border-ink focus:outline-none"
              />
            </label>

            <label htmlFor="nuevo-tema-grado" className="flex flex-col gap-1.5">
              <span className="font-medium">Grado</span>
              <select
                id="nuevo-tema-grado"
                value={grado}
                onChange={(e) => setGrado(e.target.value)}
                className="h-12 rounded-xl border-2 border-line bg-surface px-3 text-lg focus:border-ink focus:outline-none"
              >
                {GRADOS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>

            <div className="flex flex-col gap-2">
              <p className="font-medium">
                ¿Tienes material del tema? <span className="font-normal text-ink-soft">(opcional)</span>
              </p>
              <p className="-mt-1 text-sm text-ink-soft">Una foto de la página del libro o tu sesión de clase. Así usamos tus mismos ejemplos.</p>
              {material ? (
                <div className="flex items-center gap-3 rounded-xl border-2 border-line px-3 py-2">
                  {material.url ? (
                    <img src={material.url} alt="" className="h-12 w-9 rounded object-cover" />
                  ) : material.tipo === 'foto' ? (
                    <Camera className="size-5 text-examen" aria-hidden />
                  ) : (
                    <FileText className="size-5 text-examen" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">{material.nombre}</span>
                  <button type="button" onClick={() => setMaterial(null)} className="rounded-lg p-1 text-ink-soft hover:text-ink" aria-label="Quitar material">
                    <X className="size-5" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      htmlFor="nuevo-tema-foto"
                      className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-line font-medium hover:bg-surface-2"
                    >
                      <Camera className="size-5" aria-hidden /> Foto del libro
                      <input id="nuevo-tema-foto" type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => elegirArchivo(e.target.files?.[0])} />
                    </label>
                    <label
                      htmlFor="nuevo-tema-archivo"
                      className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-line font-medium hover:bg-surface-2"
                    >
                      <FileText className="size-5" aria-hidden /> Archivo
                      <input
                        id="nuevo-tema-archivo"
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,image/*"
                        className="sr-only"
                        onChange={(e) => elegirArchivo(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaterial({ nombre: 'Página 48 del libro de Matemática', url: null, tipo: 'foto' })}
                    className="self-start text-sm text-ink-soft underline underline-offset-4 hover:text-ink"
                  >
                    Probar con una foto de ejemplo
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {!ocupado && (
          <footer className="flex justify-end gap-2 border-t border-line px-6 py-4">
            <Boton variante="suave" onClick={cerrarNuevoTema}>
              Cancelar
            </Boton>
            <Boton type="submit" disabled={!listo}>
              Crear tema
            </Boton>
          </footer>
        )}
      </form>
    </dialog>
  )
}
