// Comprueba que cada práctica de cálculo cite, letra por letra, un desempeño oficial del grado donde se ofrece.
// Ver src/juegos/matematica/verificar.ts. Falla (código 1) si alguna cita no aparece en packages/curriculo.
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
} finally {
  await vite.close()
}
