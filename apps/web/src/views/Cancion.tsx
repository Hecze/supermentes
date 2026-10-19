// Canciones del tema. La app no crea canciones (obsidian/CANCIONES.md): muestra las letras del banco para cantar e
// imprimir y las canciones que ya existen en YouTube. Las del canal de Supermentes entran aquí cuando exista.
import { ArrowLeft, Copy, Printer } from 'lucide-react'
import { useStore } from '../app/store'
import { useBanco } from '../banco/banco'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { BarraHoja, Boton, Editable, Hoja, cx, imprimir } from '../components/ui'
import { CancionesDelTema } from './CancionesDelTema'
import { CancionesExistentes } from './CancionesExistentes'

const COLOR = 'var(--cancion)'

export function Cancion() {
  const { ficha, resultados, guardar, avisar } = useStore()
  const cancion = resultados.cancion
  const banco = useBanco(ficha)

  if (!ficha) return <SinTema />

  if (!cancion) {
    return (
      <>
        <EncabezadoHerramienta id="cancion" />
        {banco && <CancionesDelTema tema={banco} ficha={ficha} />}
        <CancionesExistentes ficha={ficha} plegado={!!banco} />
      </>
    )
  }

  async function copiarLetra() {
    if (!cancion) return
    const texto = [cancion.titulo, '', ...cancion.partes.flatMap((p) => [`[${p.etiqueta}]`, ...p.lineas, ''])].join('\n').trim()
    try {
      await navigator.clipboard.writeText(texto)
      avisar('Letra copiada. Pégala en el grupo de WhatsApp de las familias.', 'ok')
    } catch {
      avisar('No se pudo copiar. Selecciona la letra y cópiala a mano.', 'error')
    }
  }

  return (
    <>
      <EncabezadoHerramienta id="cancion" />
      <Boton variante="suave" onClick={() => guardar('cancion', undefined)} className="-ml-3 self-start print:hidden">
        <ArrowLeft className="size-5" aria-hidden /> Canciones del tema
      </Boton>

      <BarraHoja>
        <Boton variante="herramienta" herramienta="cancion" onClick={() => imprimir(avisar)}>
          <Printer className="size-5" aria-hidden /> Imprimir la letra
        </Boton>
        <Boton variante="contorno" onClick={() => void copiarLetra()}>
          <Copy className="size-5" aria-hidden /> Copiar para WhatsApp
        </Boton>
      </BarraHoja>

      <Hoja>
        <header className="flex flex-col gap-1">
          <Editable como="h2" className="font-display text-3xl font-bold">
            {cancion.titulo}
          </Editable>
          <p className="text-ink-soft">
            {cancion.opciones.modo === 'melodia' ? `Se canta con la melodía de "${cancion.opciones.melodia}"` : `Ritmo: ${cancion.opciones.ritmo}`}
          </p>
        </header>
        <div className="flex flex-col gap-5">
          {cancion.partes.map((p, i) => (
            <div key={i} className="flex flex-col">
              <p className="text-sm font-semibold" style={{ color: COLOR }}>
                {p.etiqueta}
              </p>
              {p.lineas.map((l, j) => (
                <Editable key={j} className={cx('font-display text-xl leading-relaxed', p.etiqueta === 'Coro' && 'font-semibold')}>
                  {l}
                </Editable>
              ))}
            </div>
          ))}
        </div>
      </Hoja>

      <CancionesExistentes ficha={ficha} plegado />
    </>
  )
}
