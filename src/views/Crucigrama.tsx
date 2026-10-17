import { Eye, EyeOff, ImageDown, Plus, Printer, Shuffle, Trash2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { mejorCrucigrama, normalizar } from '../lib/crucigrama'
import { imagenCrucigrama } from '../lib/imagenCrucigrama'
import { useStore, type FilaCrucigrama } from '../app/store'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Acciones, Boton, Chip, Desplegable, Hoja, descargar, imprimir } from '../components/ui'

const COLOR = 'var(--crucigrama)'

const TAMANOS = [
  { lado: 10, nombre: 'Pequeño', detalle: '10 × 10' },
  { lado: 15, nombre: 'Mediano', detalle: '15 × 15' },
  { lado: 20, nombre: 'Grande', detalle: '20 × 20' },
]

let siguienteId = 1
const filaVacia = (palabra = '', pista = ''): FilaCrucigrama => ({ id: siguienteId++, palabra, pista })


export function Crucigrama() {
  const { ficha, avisar, resultados, guardar } = useStore()
  const [semilla, setSemilla] = useState(1)
  const [respuestas, setRespuestas] = useState(false)
  const [banco, setBanco] = useState(true)
  const porEnfocar = useRef<number | null>(null)

  // Una fila nueva recibe el foco apenas aparece, antes de que llegue la siguiente tecla.
  useLayoutEffect(() => {
    if (porEnfocar.current === null) return
    document.getElementById(`cruci-palabra-${porEnfocar.current}`)?.focus()
    porEnfocar.current = null
  })

  function enfocar(id: number) {
    const campo = document.getElementById(`cruci-palabra-${id}`)
    if (campo) campo.focus()
    else porEnfocar.current = id
  }

  const datos = resultados.crucigrama
  const filas = datos?.filas ?? []
  const lado = datos?.lado ?? 15

  // El crucigrama empieza vacío: las palabras las elige el docente.
  useEffect(() => {
    if (!datos) guardar('crucigrama', { filas: [filaVacia()], lado: 15 })
  }, [datos, guardar])

  const validas = filas.filter((f) => normalizar(f.palabra).length > 1)
  const cruci = useMemo(
    () => mejorCrucigrama(validas.map((f) => ({ palabra: f.palabra, pista: f.pista.trim() })), semilla, lado),
    // validas cambia de identidad en cada render; se recalcula solo si cambia el contenido.
    [JSON.stringify(validas.map((f) => [f.palabra, f.pista])), semilla, lado],
  )

  if (!ficha) return <SinTema />

  const usadas = new Set(filas.map((f) => normalizar(f.palabra)))
  const sugerencias = ficha.vocabulario.filter((v) => !usadas.has(normalizar(v.palabra)))
  const sinPista = cruci.ubicadas.filter((u) => !u.pista).length

  function cambiarFilas(nuevas: FilaCrucigrama[]) {
    guardar('crucigrama', { filas: nuevas, lado })
  }

  function editar(id: number, campo: 'palabra' | 'pista', valor: string) {
    cambiarFilas(filas.map((f) => (f.id === id ? { ...f, [campo]: valor } : f)))
  }

  function agregar(palabra = '', pista = '') {
    // Si la última fila está vacía, se usa esa en vez de agregar otra.
    const ultima = filas[filas.length - 1]
    if (ultima && !ultima.palabra.trim() && !ultima.pista.trim()) {
      if (!palabra) return enfocar(ultima.id)
      return cambiarFilas(filas.map((f) => (f.id === ultima.id ? { ...f, palabra, pista } : f)))
    }
    const nueva = filaVacia(palabra, pista)
    cambiarFilas([...filas, nueva])
    if (!palabra) enfocar(nueva.id)
  }

  function agregarTodas() {
    const llenas = filas.filter((f) => f.palabra.trim() || f.pista.trim())
    cambiarFilas([...llenas, ...sugerencias.map((v) => filaVacia(v.palabra, v.definicion))])
  }

  function quitar(id: number) {
    const resto = filas.filter((f) => f.id !== id)
    cambiarFilas(resto.length ? resto : [filaVacia()])
  }

  async function descargarImagen() {
    try {
      const png = await imagenCrucigrama(cruci, { conRespuestas: respuestas })
      const tema = normalizar(ficha!.titulo.split(':')[0]).toLowerCase()
      await descargar(png, `crucigrama-${tema}${respuestas ? '-respuestas' : ''}.png`, avisar)
    } catch {
      avisar('No se pudo crear la imagen. Intenta de nuevo.', 'error')
    }
  }

  const celda = Math.min(40, Math.floor(720 / Math.max(cruci.cols, 1)))
  const listas = [
    ['Horizontales', cruci.ubicadas.filter((u) => u.dir === 'horizontal')],
    ['Verticales', cruci.ubicadas.filter((u) => u.dir === 'vertical')],
  ] as const

  return (
    <>
      <EncabezadoHerramienta id="crucigrama" />

      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6 print:hidden">
        <div>
          <h2 className="font-display text-2xl font-bold">Tus palabras</h2>
          <p className="text-ink-soft">Escribe cada palabra con su pista. El crucigrama se arma solo mientras escribes.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full border-collapse">
            <thead className="bg-surface-2 text-left text-sm text-ink-soft">
              <tr>
                <th className="w-10 px-3 py-2 font-medium">#</th>
                <th className="w-[32%] border-l border-line px-3 py-2 font-medium">Palabra</th>
                <th className="border-l border-line px-3 py-2 font-medium">Pista</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={f.id} className="border-t border-line">
                  <td className="px-3 text-sm text-ink-soft tabular-nums">{i + 1}</td>
                  <td className="border-l border-line p-0">
                    <input
                      id={`cruci-palabra-${f.id}`}
                      aria-label={`Palabra ${i + 1}`}
                      value={f.palabra}
                      onChange={(e) => editar(f.id, 'palabra', e.target.value)}
                      placeholder="Ej.: numerador"
                      className="h-11 w-full bg-transparent px-3 font-medium placeholder:font-normal placeholder:text-ink-soft/60 focus:bg-surface-2 focus:outline-none"
                    />
                  </td>
                  <td className="border-l border-line p-0">
                    <input
                      aria-label={`Pista ${i + 1}`}
                      value={f.pista}
                      onChange={(e) => editar(f.id, 'pista', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (i === filas.length - 1) agregar()
                          else enfocar(filas[i + 1].id)
                        }
                      }}
                      placeholder="Ej.: Número de arriba de la fracción"
                      className="h-11 w-full bg-transparent px-3 placeholder:text-ink-soft/60 focus:bg-surface-2 focus:outline-none"
                    />
                  </td>
                  <td className="text-center">
                    <button type="button" onClick={() => quitar(f.id)} className="rounded-lg p-2 text-ink-soft hover:bg-surface-2 hover:text-danger" aria-label={`Quitar palabra ${i + 1}`}>
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => agregar()} className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left text-ink-soft hover:bg-surface-2 hover:text-ink">
            <Plus className="size-4" aria-hidden /> Agregar palabra
          </button>
        </div>

        {sugerencias.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <p className="font-medium">Sugerencias de tu tema</p>
              <button type="button" onClick={agregarTodas} className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink">
                Agregar todas
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sugerencias.map((v) => (
                <Chip key={v.palabra} onClick={() => agregar(v.palabra, v.definicion)}>
                  <Plus className="size-3.5" aria-hidden /> {v.palabra}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="font-medium">Tamaño</p>
          <div className="flex flex-wrap gap-2">
            {TAMANOS.map((t) => (
              <Chip key={t.lado} activo={lado === t.lado} color={COLOR} onClick={() => guardar('crucigrama', { filas, lado: t.lado })}>
                {t.nombre} <span className="font-normal opacity-70">{t.detalle}</span>
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {validas.length < 2 ? (
        <div className="rounded-2xl border-2 border-dashed border-line px-6 py-10 text-center text-ink-soft print:hidden">
          Escribe al menos dos palabras para ver tu crucigrama.
        </div>
      ) : (
        <>
          {cruci.sinUbicar.length > 0 && (
            <p className="rounded-xl bg-warn/10 px-4 py-3 text-warn print:hidden">
              No entraron: {cruci.sinUbicar.map((e) => e.palabra).join(', ')}. Prueba un tamaño más grande u "Otra forma".
            </p>
          )}

          <Hoja>
            <header className="flex flex-col gap-1">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">Crucigrama: {ficha.titulo.split(':')[0]}</h2>
              <p className="text-ink-soft">Nombre: ______________________ · {ficha.grado}</p>
            </header>

            <div className="overflow-x-auto pb-1">
              <div
                className="mx-auto grid w-max"
                style={{ gridTemplateColumns: `repeat(${cruci.cols}, ${celda}px)` }}
                role="img"
                aria-label={`Crucigrama de ${cruci.ubicadas.length} palabras`}
              >
                {cruci.letras.flatMap((fila, f) =>
                  fila.map((letra, c) => {
                    const numero = cruci.numeros[f][c]
                    return (
                      <div key={`${f}-${c}`} className={letra ? 'relative -ml-px -mt-px aspect-square border border-ink bg-surface' : 'aspect-square'}>
                        {numero && <span className="absolute left-0.5 top-0 text-[9px] font-semibold leading-tight">{numero}</span>}
                        {letra && respuestas && (
                          <span className="grid h-full place-items-center pt-1 font-display font-bold" style={{ color: COLOR, fontSize: celda * 0.45 }}>
                            {letra}
                          </span>
                        )}
                      </div>
                    )
                  }),
                )}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {listas.map(([titulo, lista]) => (
                <div key={titulo} className="flex flex-col gap-2">
                  <h3 className="font-semibold">{titulo}</h3>
                  <ol className="flex flex-col gap-1.5">
                    {lista.map((u) => (
                      <li key={u.palabra} className="flex gap-2">
                        <span className="w-5 shrink-0 text-right font-semibold tabular-nums" style={{ color: COLOR }}>
                          {u.numero}
                        </span>
                        <span className={u.pista ? '' : 'italic text-ink-soft'}>{u.pista || 'Falta la pista'}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>

            {banco && (
              <div className="flex flex-col gap-1 border-t border-line pt-4">
                <h3 className="font-semibold">Palabras</h3>
                <p className="flex flex-wrap gap-x-5 gap-y-1 font-display text-lg">
                  {[...cruci.ubicadas]
                    .sort((a, b) => a.palabra.localeCompare(b.palabra))
                    .map((u) => (
                      <span key={u.palabra}>{u.palabra}</span>
                    ))}
                </p>
              </div>
            )}
          </Hoja>

          {sinPista > 0 && (
            <p className="-mt-3 text-sm text-warn print:hidden">
              {sinPista === 1 ? 'A una palabra le falta la pista.' : `A ${sinPista} palabras les falta la pista.`} Escríbela en la tabla de arriba.
            </p>
          )}

          <Acciones>
            <Boton variante="herramienta" herramienta="crucigrama" onClick={() => imprimir(avisar)}>
              <Printer className="size-5" aria-hidden /> Imprimir
            </Boton>
            <Boton variante="contorno" onClick={descargarImagen}>
              <ImageDown className="size-5" aria-hidden /> Descargar imagen
            </Boton>
            <Boton variante="contorno" onClick={() => setRespuestas(!respuestas)}>
              {respuestas ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
              {respuestas ? 'Ocultar respuestas' : 'Ver respuestas'}
            </Boton>
            <Boton variante="contorno" onClick={() => setSemilla((s) => s + 1)}>
              <Shuffle className="size-5" aria-hidden /> Otra forma
            </Boton>
          </Acciones>

          <Desplegable titulo="Más opciones">
            <label htmlFor="cruci-banco" className="flex cursor-pointer items-center gap-3">
              <input id="cruci-banco" type="checkbox" checked={banco} onChange={(e) => setBanco(e.target.checked)} className="size-5 accent-[var(--crucigrama)]" />
              Mostrar la lista de palabras (más fácil)
            </label>
            <p className="text-sm text-ink-soft">
              "Descargar imagen" baja solo la grilla en PNG con fondo transparente, para pegarla en tus fichas o diapositivas. Si tienes las respuestas a la
              vista, la imagen las incluye.
            </p>
            <p className="text-sm text-ink-soft">El crucigrama lo arma un algoritmo con tus palabras, así que no gasta créditos.</p>
          </Desplegable>
        </>
      )}
    </>
  )
}
