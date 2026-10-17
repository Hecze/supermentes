import { Eye, EyeOff, Printer, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { mejorCrucigrama } from '../lib/crucigrama'
import { useStore } from '../app/store'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Acciones, Boton, Desplegable, Hoja, imprimir } from '../components/ui'

const COLOR = 'var(--crucigrama)'

export function Crucigrama() {
  const { ficha, avisar } = useStore()
  const [semilla, setSemilla] = useState(1)
  const [respuestas, setRespuestas] = useState(false)
  const [banco, setBanco] = useState(true)

  const cruci = useMemo(
    () => (ficha ? mejorCrucigrama(ficha.vocabulario.map((v) => ({ palabra: v.palabra, pista: v.definicion })), semilla) : null),
    [ficha, semilla],
  )

  if (!ficha || !cruci) return <SinTema />

  const listas = [
    ['Horizontales', cruci.ubicadas.filter((u) => u.dir === 'horizontal')],
    ['Verticales', cruci.ubicadas.filter((u) => u.dir === 'vertical')],
  ] as const

  return (
    <>
      <EncabezadoHerramienta id="crucigrama" />

      <Hoja>
        <header className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Crucigrama: {ficha.titulo.split(':')[0]}</h2>
          <p className="text-ink-soft">Nombre: ______________________ · {ficha.grado}</p>
        </header>

        <div className="overflow-x-auto pb-1">
          <div className="mx-auto grid w-max" style={{ gridTemplateColumns: `repeat(${cruci.cols}, clamp(26px, 7vw, 40px))` }} role="img" aria-label={`Crucigrama de ${cruci.ubicadas.length} palabras`}>
            {cruci.letras.flatMap((fila, f) =>
              fila.map((letra, c) => {
                const numero = cruci.numeros[f][c]
                return (
                  <div key={`${f}-${c}`} className={letra ? 'relative -ml-px -mt-px aspect-square border border-ink bg-surface' : 'aspect-square'}>
                    {numero && <span className="absolute left-0.5 top-0 text-[9px] font-semibold leading-tight">{numero}</span>}
                    {letra && respuestas && (
                      <span className="grid h-full place-items-center pt-1 font-display text-base font-bold" style={{ color: COLOR }}>
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
                    <span>{u.pista}</span>
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

      <Acciones>
        <Boton variante="herramienta" herramienta="crucigrama" onClick={() => imprimir(avisar)}>
          <Printer className="size-5" aria-hidden /> Imprimir
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
        <p className="text-sm text-ink-soft">El crucigrama sale de las palabras clave de tu tema, así que no gasta créditos.</p>
      </Desplegable>
    </>
  )
}
