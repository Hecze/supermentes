// Abrir un tema del currículo: si la docente ya lo abrió, vuelve con lo que tenía (sus hojas, su juego…); si no, se
// crea al instante con lo que trae el currículo y la IA completa la ficha después (temaInstantaneo.ts).
import { useCallback } from 'react'
import { normalizar, type Resultado } from '../curriculo/buscar'
import { useStore, type Vista } from './store'
import { fichaDeResultado } from './temaInstantaneo'

export const claveTema = (gradoId: string, areaId: string, titulo: string) => `${gradoId}|${areaId}|${normalizar(titulo)}`

export function useAbrirTema() {
  const { temas, elegirTema, setFicha, completarFicha, ir } = useStore()
  return useCallback(
    async (r: Resultado, destino: Vista = 'ficha') => {
      const ya = temas.find((t) => claveTema(t.gradoId, t.areaId, t.titulo) === claveTema(r.gradoId, r.areaId, r.tema))
      if (ya) {
        elegirTema(ya.id)
        if (destino !== 'ficha') ir(destino)
        return
      }
      const nueva = await fichaDeResultado(r)
      if (!nueva) return
      setFicha(nueva)
      ir(destino)
      completarFicha(nueva)
    },
    [temas, elegirTema, setFicha, completarFicha, ir],
  )
}
