// La herramienta Examen: las hojas del tema abierto (examen, práctica y balotario), generadas desde cero con lo que
// trae el currículo (ver Hojas.tsx). Hoy las tiene 4.º de primaria; los demás grados llegan con su banco.
import { useMemo } from 'react'
import { useStore } from '../app/store'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { fuenteDe, useAreas } from '../examenes/usar'
import { Hojas } from './Hojas'

export function Examen() {
  const { ficha } = useStore()
  if (!ficha) return <SinTema />
  return <ExamenDelTema ficha={ficha} />
}

function ExamenDelTema({ ficha }: { ficha: NonNullable<ReturnType<typeof useStore>['ficha']> }) {
  const area = useAreas(ficha.gradoId, [ficha.areaId])?.get(ficha.areaId)
  const hay = useMemo(() => (area ? fuenteDe(ficha.gradoId, ficha.titulo, area).tipos.length > 0 : null), [area, ficha.gradoId, ficha.titulo])

  return (
    <>
      <EncabezadoHerramienta id="examen" />
      {area && hay !== null &&
        (hay ? (
          <Hojas key={ficha.id} ficha={ficha} area={area} />
        ) : (
          <p className="max-w-2xl text-lg text-ink-soft">Todavía no hay hojas listas para {ficha.grado}. Hoy están las de 4.º de primaria.</p>
        ))}
    </>
  )
}
