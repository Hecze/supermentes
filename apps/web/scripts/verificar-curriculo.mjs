// Comprueba que cada práctica de cálculo, cada canción y cada tema del banco cite, letra por letra, un desempeño oficial
// del grado donde se ofrece, y que en los grados con banco cada tema tenga al menos 2 juegos.
// También que cada tema de esos grados tenga examen listo y que sus versiones al azar no salgan rotas.
// Ver src/juegos/matematica/verificar.ts, src/banco/verificar.ts y src/examenes/verificar.ts. Falla (código 1) si algo no cuadra.
import { existsSync } from 'node:fs'
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
    console.log(`✓ Banco (${banco.grados.join(', ')}): ${banco.citas} citas tal cual; los ${banco.temas} temas tienen al menos ${MINIMO} juegos.`)
  }
  const { verificarExamenes } = await vite.ssrLoadModule('/src/examenes/verificar.ts')
  const examenes = verificarExamenes()
  if (examenes.errores.length) {
    console.error(`✗ Exámenes listos: ${examenes.errores.length} problemas:\n- ${examenes.errores.slice(0, 40).join('\n- ')}${examenes.errores.length > 40 ? '\n…' : ''}`)
    process.exitCode = 1
  } else {
    console.log(`✓ Exámenes listos (${examenes.grados.join(', ')}): ${examenes.tipos} tipos de pregunta, ${examenes.citas} citas tal cual; los ${examenes.temas} temas tienen examen, práctica y balotario y ninguna versión sale rota; cada pregunta con números trae sus pasos para la clave; ${examenes.problemas} problemas con sus pasos.`)
  }
  const { verificarRecursos } = await vite.ssrLoadModule('/src/recursos/verificar.ts')
  const recursos = verificarRecursos()
  for (const p of recursos.portadas) if (!existsSync(new URL(`../public${p}`, import.meta.url))) recursos.errores.push(`Falta la portada ${p} en public/.`)
  if (recursos.errores.length) {
    console.error(`✗ Más recursos: ${recursos.errores.length} problemas:\n- ${recursos.errores.join('\n- ')}`)
    process.exitCode = 1
  } else {
    const detalle = Object.entries(recursos.porTipo).filter(([, n]) => n).map(([t, n]) => `${n} ${t}`).join(', ')
    console.log(`✓ Más recursos: ${recursos.total} enlaces a material oficial${detalle ? ` (${detalle})` : ''}, cada uno con su fuente y fecha de revisión.`)
  }
} finally {
  await vite.close()
}
