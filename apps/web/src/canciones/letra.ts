import type { Cancion } from '../api'

/**
 * Las partes de una letra escrita como en Suno o en el cuaderno: las marcas van solas en su línea ("[Coro]",
 * "[Estrofa 1]"). Sin marcas, cada bloque separado por una línea en blanco es una estrofa.
 */
export function partesDeLetra(texto: string | string[]): Cancion['partes'] {
  const lineas = Array.isArray(texto) ? texto : texto.split(/\r?\n/)
  const partes: Cancion['partes'] = []
  let enBlanco = true
  for (const bruta of lineas) {
    const l = bruta.trim()
    const marca = l.match(/^\[(.+)\]$/)
    if (marca) {
      partes.push({ etiqueta: marca[1].trim(), lineas: [] })
      enBlanco = false
      continue
    }
    if (!l) {
      enBlanco = true
      continue
    }
    const ultima = partes[partes.length - 1]
    if (!ultima || (enBlanco && ultima.lineas.length)) {
      partes.push({ etiqueta: `Estrofa ${partes.filter((p) => p.etiqueta.startsWith('Estrofa')).length + 1}`, lineas: [] })
    }
    partes[partes.length - 1].lineas.push(l)
    enBlanco = false
  }
  return partes.filter((p) => p.lineas.length)
}

/** La letra en texto plano, para pegarla en el grupo de WhatsApp de las familias. */
export function textoDeLetra(c: Cancion) {
  return [c.titulo, '', ...c.partes.flatMap((p) => [`[${p.etiqueta}]`, ...p.lineas, ''])].join('\n').trim()
}
