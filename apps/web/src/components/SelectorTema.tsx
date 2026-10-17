import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cuando, useStore } from '../app/store'
import { cx } from './ui'

/** Muestra el tema actual. Al abrirlo lista los demás temas y, al final, "Buscar otro tema". */
export function SelectorTema({ compacto }: { compacto?: boolean }) {
  const { temas, ficha, elegirTema, abrirNuevoTema } = useStore()
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false)
    }
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  if (!ficha) {
    return (
      <button
        type="button"
        onClick={() => abrirNuevoTema()}
        className={cx(
          'flex items-center gap-2 rounded-xl border-2 border-dashed border-line text-left font-medium hover:border-ink-soft',
          compacto ? 'h-10 px-3' : 'px-3 py-3',
        )}
      >
        <Search className="size-5" aria-hidden /> Buscar mi primer tema
      </button>
    )
  }

  return (
    <div ref={caja} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        className={cx(
          'flex w-full items-center gap-2 rounded-xl text-left transition',
          compacto ? 'h-10 px-2 hover:bg-surface-2' : 'border-2 px-3 py-2.5',
          !compacto && (abierto ? 'border-ink' : 'border-line hover:border-ink-soft'),
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          {!compacto && <span className="text-xs text-ink-soft">Tema</span>}
          <span className={cx('font-semibold leading-snug', compacto ? 'truncate' : 'line-clamp-2')}>{ficha.titulo}</span>
          {!compacto && <span className="text-sm text-ink-soft">{ficha.grado}</span>}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-ink-soft" aria-hidden />
      </button>

      {abierto && (
        <div
          className={cx(
            'absolute z-50 mt-2 flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl',
            compacto ? 'left-0 w-[min(22rem,calc(100vw-2rem))]' : 'inset-x-0',
          )}
        >
          <p className="px-4 pb-1 pt-3 text-xs text-ink-soft">Tus temas</p>
          <ul role="listbox" aria-label="Tus temas" className="max-h-72 overflow-y-auto pb-1">
            {temas.map((t) => {
              const actual = t.id === ficha.id
              return (
                <li key={t.id} role="option" aria-selected={actual}>
                  <button
                    type="button"
                    onClick={() => {
                      setAbierto(false)
                      elegirTema(t.id)
                    }}
                    className="flex w-full items-start gap-2 px-4 py-2.5 text-left hover:bg-surface-2"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={cx('leading-snug', actual && 'font-semibold')}>{t.titulo}</span>
                      <span className="text-sm text-ink-soft">
                        {t.grado} · {cuando(t.fecha)}
                      </span>
                    </span>
                    {actual && <Check className="mt-0.5 size-5 shrink-0" aria-hidden />}
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            onClick={() => {
              setAbierto(false)
              abrirNuevoTema()
            }}
            className="flex items-center gap-2 border-t border-line px-4 py-3 text-left font-semibold hover:bg-surface-2"
          >
            <Search className="size-5" aria-hidden /> Buscar otro tema
          </button>
        </div>
      )}
    </div>
  )
}
