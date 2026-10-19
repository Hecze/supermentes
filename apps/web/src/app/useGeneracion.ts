import { useState } from 'react'
import { useStore } from './store'

/** Llama a la API con su aviso de listo o de error; mientras tanto, `ocupado`. */
export function useGeneracion() {
  const { avisar } = useStore()
  const [ocupado, setOcupado] = useState(false)

  async function generar<T>(que: string, llamada: () => Promise<T>): Promise<T | null> {
    if (ocupado) return null
    setOcupado(true)
    try {
      const res = await llamada()
      avisar(`${que}: listo.`, 'ok')
      return res
    } catch (e) {
      // El motivo real (falta una clave, se acabó el saldo, tardó demasiado…) se muestra tal cual: nada falla callado.
      console.error(`No se pudo generar: ${que}`, e)
      const motivo = e instanceof Error && e.message ? e.message : 'Intenta de nuevo.'
      avisar(`No se pudo generar: ${que.toLowerCase()}. ${motivo}`, 'error')
      return null
    } finally {
      setOcupado(false)
    }
  }

  return { ocupado, generar }
}
