// Comprueba que cada práctica de cálculo, cada canción y cada tema del banco cite, letra por letra, un desempeño oficial
// del grado donde se ofrece, y que en los grados con banco cada tema tenga al menos 2 juegos y 2 canciones.
// Ver src/juegos/matematica/verificar.ts y src/banco/verificar.ts. Falla (código 1) si algo no cuadra.
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const vite = await createServer({ root: raiz, configFile: false, logLevel: 'error', appType: 'custom', server: { middlewareMode: true, hmr: false } })
try {
  const { verificarCitas } = await vite.ssrLoadModule('/src/juegos/matematica/verificar.ts')
  const { total, errores } = verificarCitas()
  if (errores.length) {
    console.error(`✗ ${errores.length} de ${total} citas del Currículo Nacional no cuadran:\n- ${errores.join('\n- ')}`)
    process.exitCode = 1
  } else {
    console.log(`✓ Currículo Nacional: ${total} citas (práctica, nivel y grado), todas copiadas tal cual de un desempeño oficial del grado.`)
  }
  const { verificarCanciones } = await vite.ssrLoadModule('/src/canciones/verificar.ts')
  const canciones = verificarCanciones()
  if (canciones.errores.length) {
    console.error(`✗ ${canciones.errores.length} de ${canciones.total} citas de canciones no cuadran:\n- ${canciones.errores.join('\n- ')}`)
    process.exitCode = 1
  } else {
    console.log(`✓ Canciones: ${canciones.total} citas (canción y grado), todas copiadas tal cual de un desempeño oficial del grado.`)
  }
  const { verificarBanco, MINIMO } = await vite.ssrLoadModule('/src/banco/verificar.ts')
  const banco = verificarBanco()
  if (banco.errores.length) {
    console.error(`✗ Banco de contenido: ${banco.errores.length} problemas:\n- ${banco.errores.slice(0, 40).join('\n- ')}${banco.errores.length > 40 ? '\n…' : ''}`)
    process.exitCode = 1
  } else if (banco.grados.length) {
    console.log(`✓ Banco (${banco.grados.join(', ')}): ${banco.citas} citas tal cual; los ${banco.temas} temas tienen al menos ${MINIMO} juegos y ${MINIMO} canciones.`)
  }
} finally {
  await vite.close()
}
