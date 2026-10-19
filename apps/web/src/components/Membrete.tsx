// Logo, colegio y docente arriba de una hoja para imprimir (crucigrama, pupiletras). Sale de "Mi perfil"
// (app/documento.ts); sin datos no ocupa lugar.
import { useDatosDocumento } from '../app/documento'

export function Membrete({ tema }: { tema: { gradoId: string; areaId: string } | null }) {
  const { institucion, docente, logo } = useDatosDocumento(tema)
  if (!institucion && !docente && !logo) return null
  return (
    <div className="flex items-center gap-3">
      {logo && <img src={logo} alt="" className="size-12 shrink-0 object-contain" />}
      <div className="flex min-w-0 flex-col">
        {institucion && <p className="font-semibold">{institucion}</p>}
        {docente && <p className="text-sm text-ink-soft">Docente: {docente}</p>}
      </div>
    </div>
  )
}
