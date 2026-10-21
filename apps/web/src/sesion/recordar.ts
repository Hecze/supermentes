// Lo que la docente pidió recordar para sus próximas sesiones (cuánto dura su clase y el enfoque de su unidad), en
// Atomic Memory por api/_preferencias-sesion.ts. Solo con cuenta y si el servidor lo tiene configurado: si no, no se
// muestra nada y la sesión empieza como siempre. El caché y los avisos son por cuenta (sesion/memoriaSesiones.ts).
import { useCallback, useEffect, useState } from 'react'
import { tokenDeCuenta, useCuenta } from '../app/cuenta'
import { crearMemoriaSesiones, type Recordadas, type Resultado } from './memoriaSesiones'
import type { OpcionesSesion } from './tipos'

export type { Recordadas } from './memoriaSesiones'

const memoria = crearMemoriaSesiones({ token: tokenDeCuenta })
const SIN_CUENTA: Resultado = { ok: false, mensaje: 'Entra con tu cuenta para que la app lo recuerde.' }

/** Lo recordado de la cuenta que entró, y cómo guardarlo u olvidarlo. `apagado` sin cuenta o sin Atomic Memory. */
export function useRecordadas() {
  const { id } = useCuenta()
  // Se guarda con la cuenta de la que es: al cambiar de cuenta, lo de la anterior deja de mostrarse en el acto.
  const [visto, setVisto] = useState<{ cuenta: string; r: Recordadas }>()

  useEffect(() => {
    if (!id) return
    let vivo = true
    const ver = (r: Recordadas) => vivo && setVisto({ cuenta: id, r })
    const dejar = memoria.suscribir(id, ver)
    void memoria.cargar(id).then(ver)
    return () => {
      vivo = false
      dejar()
    }
  }, [id])

  const recordadas: Recordadas = !id ? { estado: 'apagado' } : visto?.cuenta === id ? visto.r : { estado: 'cargando' }
  // Cada acción queda atada a la cuenta con la que se pidió.
  const recordar = useCallback((o: OpcionesSesion) => (id ? memoria.recordar(id, o) : Promise.resolve(SIN_CUENTA)), [id])
  const olvidar = useCallback(() => (id ? memoria.olvidar(id) : Promise.resolve(SIN_CUENTA)), [id])
  return { recordadas, recordar, olvidar }
}
