import { Download, Eye, EyeOff, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { mejorCrucigrama } from '../lib/crucigrama'
import { useStore } from '../app/store'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { Boton, Costo, Etiqueta, Tarjeta, cx } from '../components/ui'

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

  const horizontales = cruci.ubicadas.filter((u) => u.dir === 'horizontal')
  const verticales = cruci.ubicadas.filter((u) => u.dir === 'vertical')

  return (
    <>
      <EncabezadoHerramienta id="crucigrama">
        <Costo n={0} className="self-center" />
      </EncabezadoHerramienta>

      <div className="flex flex-wrap items-center gap-2">
        <Boton variante="contorno" tam="sm" onClick={() => setSemilla((s) => s + 1)}>
          <Shuffle className="size-4" aria-hidden /> Otra distribución
        </Boton>
        <Boton variante="contorno" tam="sm" onClick={() => setRespuestas(!respuestas)}>
          {respuestas ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          {respuestas ? 'Ocultar respuestas' : 'Ver respuestas'}
        </Boton>
        <label htmlFor="cruci-banco" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm hover:bg-surface-2">
          <input id="cruci-banco" type="checkbox" checked={banco} onChange={(e) => setBanco(e.target.checked)} className="size-4 accent-[var(--crucigrama)]" />
          Banco de palabras
        </label>
        <Boton tam="sm" className="sm:ml-auto" onClick={() => avisar('Descargando el crucigrama en PDF, con y sin respuestas.', 'ok')}>
          <Download className="size-4" aria-hidden /> Descargar PDF
        </Boton>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Tarjeta className="flex flex-col gap-4">
          <div className="overflow-x-auto pb-1">
            <div
              className="mx-auto grid w-max"
              style={{ gridTemplateColumns: `repeat(${cruci.cols}, clamp(26px, 7vw, 38px))` }}
              role="img"
              aria-label={`Crucigrama de ${cruci.ubicadas.length} palabras`}
            >
              {cruci.letras.flatMap((fila, f) =>
                fila.map((letra, c) => {
                  const numero = cruci.numeros[f][c]
                  return (
                    <div
                      key={`${f}-${c}`}
                      className={cx('relative aspect-square', letra && '-ml-px -mt-px border border-ink bg-surface')}
                    >
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
          {banco && (
            <div className="flex flex-col gap-2 border-t border-line pt-3">
              <Etiqueta>Banco de palabras</Etiqueta>
              <p className="flex flex-wrap gap-x-4 gap-y-1 font-display text-lg">
                {[...cruci.ubicadas].sort((a, b) => a.palabra.localeCompare(b.palabra)).map((u) => (
                  <span key={u.palabra}>{u.palabra}</span>
                ))}
              </p>
            </div>
          )}
        </Tarjeta>

        <Tarjeta className="flex flex-col gap-4 self-start">
          {(
            [
              ['Horizontales', horizontales],
              ['Verticales', verticales],
            ] as const
          ).map(([titulo, lista]) => (
            <div key={titulo} className="flex flex-col gap-2">
              <Etiqueta>{titulo}</Etiqueta>
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
          {cruci.sinUbicar.length > 0 && (
            <p className="text-sm text-warn">No entraron en la grilla: {cruci.sinUbicar.map((e) => e.palabra).join(', ')}. Prueba otra distribución.</p>
          )}
          <p className="border-t border-line pt-3 text-xs text-ink-soft">
            La grilla la arma un algoritmo y las pistas salen del vocabulario de tu ficha, así que el crucigrama no gasta créditos.
          </p>
        </Tarjeta>
      </div>
    </>
  )
}
