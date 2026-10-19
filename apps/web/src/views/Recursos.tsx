// Más recursos: material real que ya existe en internet, para leer, imprimir o consultar. Nada inventado: se enlaza
// la fuente original. Hoy, los videos y fichas del tema (api/recursos.ts); el catálogo de libros, normas y exámenes
// oficiales va en recursos/.
import { Library } from 'lucide-react'
import { useStore } from '../app/store'
import { EncabezadoSeccion } from '../components/Shell'
import { RecursosDelTema } from './RecursosDelTema'

export function Recursos() {
  const { ficha } = useStore()
  return (
    <>
      <EncabezadoSeccion icono={Library} titulo="Más recursos">
        Material que ya existe en internet, con el enlace a su fuente.
      </EncabezadoSeccion>
      {ficha && <RecursosDelTema ficha={ficha} />}
    </>
  )
}
