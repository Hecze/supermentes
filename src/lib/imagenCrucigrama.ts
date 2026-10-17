import type { Crucigrama } from './crucigrama'

/**
 * Dibuja la grilla del crucigrama como PNG con fondo transparente:
 * solo las casillas son blancas, con borde negro y su número.
 */
export function imagenCrucigrama(c: Crucigrama, { conRespuestas = false, celda = 80 } = {}): Promise<Blob> {
  const borde = 3
  const lienzo = document.createElement('canvas')
  lienzo.width = c.cols * celda + borde * 2
  lienzo.height = c.filas * celda + borde * 2
  const ctx = lienzo.getContext('2d')
  if (!ctx) return Promise.reject(new Error('El navegador no permite dibujar la imagen'))

  ctx.lineWidth = borde
  ctx.strokeStyle = '#000000'
  for (let f = 0; f < c.filas; f++) {
    for (let col = 0; col < c.cols; col++) {
      const letra = c.letras[f][col]
      if (!letra) continue
      const x = borde + col * celda
      const y = borde + f * celda
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x, y, celda, celda)
      ctx.strokeRect(x, y, celda, celda)

      ctx.fillStyle = '#000000'
      const numero = c.numeros[f][col]
      if (numero) {
        ctx.font = `600 ${Math.round(celda * 0.22)}px Lexend, system-ui, sans-serif`
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(String(numero), x + celda * 0.09, y + celda * 0.07)
      }
      if (conRespuestas) {
        ctx.font = `700 ${Math.round(celda * 0.5)}px "Shantell Sans", system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(letra, x + celda / 2, y + celda * 0.58)
      }
    }
  }

  return new Promise((ok, mal) => lienzo.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo crear la imagen'))), 'image/png'))
}
