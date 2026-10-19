// Los billetes y monedas que circulan en el Perú, con las imágenes oficiales del BCRP (ver README.md de esta carpeta:
// de dónde salen y con qué cuidado se usan). En el SVG van como <image>; el PDF los incrusta al pasarlo a imagen.
import b10 from './dinero/billete-10.webp'
import b100 from './dinero/billete-100.webp'
import b20 from './dinero/billete-20.webp'
import b200 from './dinero/billete-200.webp'
import b50 from './dinero/billete-50.webp'
import m10c from './dinero/moneda-10-centimos.webp'
import m1 from './dinero/moneda-1-sol.webp'
import m20c from './dinero/moneda-20-centimos.webp'
import m2 from './dinero/moneda-2-soles.webp'
import m50c from './dinero/moneda-50-centimos.webp'
import m5 from './dinero/moneda-5-soles.webp'

/** El anverso de cada billete de la familia actual (S/ 10 Chabuca Granda … S/ 200 Tilsa Tsuchiya). */
export const BILLETES: Record<number, string> = { 10: b10, 20: b20, 50: b50, 100: b100, 200: b200 }

/** Las monedas, por su valor en soles. */
export const MONEDAS: Record<number, string> = { 0.1: m10c, 0.2: m20c, 0.5: m50c, 1: m1, 2: m2, 5: m5 }

/** Ancho entre alto del billete (todos miden 140 × 65 mm). */
export const PROPORCION_BILLETE = 140 / 65

/** Diámetro real de cada moneda en mm, para que se vean en su tamaño relativo (la de S/ 1 es la más grande). */
export const DIAMETRO_MONEDA: Record<number, number> = { 0.1: 20.5, 0.2: 23, 0.5: 22, 1: 25.5, 2: 22.2, 5: 24.4 }
