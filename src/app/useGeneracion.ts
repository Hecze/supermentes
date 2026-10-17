import { useState } from 'react'
import { textoCosto } from '../api'
import { useStore } from './store'

/** Cobra los créditos, llama a la API y los devuelve si algo falla. */
export function useGeneracion() {
  const { gastar, devolver, avisar } = useStore()
  const [ocupado, setOcupado] = useState(false)

  async function generar<T>(costo: number, que: string, llamada: () => Promise<T>): Promise<T | null> {
    if (ocupado || !gastar(costo)) return null
    setOcupado(true)
    try {
      const res = await llamada()
      avisar(costo > 0 ? `${que}: listo. Usaste ${textoCosto(costo)}.` : `${que}: listo.`, 'ok')
      return res
    } catch {
      devolver(costo)
      avisar(`No se pudo generar: ${que.toLowerCase()}. No se descontaron créditos; intenta de nuevo.`, 'error')
      return null
    } finally {
      setOcupado(false)
    }
  }

  return { ocupado, generar }
}
