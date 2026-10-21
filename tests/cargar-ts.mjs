// Para `npm test`: Node corre los .ts de api/ tal cual, pero ahí los imports relativos llevan ".js" (como pide Vercel).
// Este gancho resuelve './_cuenta.js' a './_cuenta.ts' cuando el .js no existe; y en apps/web, donde los imports van
// sin extensión ('./enfoques'), también a './enfoques.ts'.
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'

registerHooks({
  resolve(especificador, contexto, siguiente) {
    if (/^\.\.?\//.test(especificador) && contexto.parentURL) {
      const ts = new URL(especificador.endsWith('.js') ? especificador.replace(/\.js$/, '.ts') : `${especificador}.ts`, contexto.parentURL)
      if (!existsSync(fileURLToPath(new URL(especificador, contexto.parentURL))) && existsSync(fileURLToPath(ts))) return siguiente(ts.href, contexto)
    }
    return siguiente(especificador, contexto)
  },
})
