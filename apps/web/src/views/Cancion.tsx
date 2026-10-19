// Canciones del tema. La app no crea canciones ni muestra las que no están en YouTube (obsidian/CANCIONES.md): una
// sola lista con las del canal de Supermentes y las de otros canales; el nombre del canal dice de quién es.
import { useStore } from '../app/store'
import { EncabezadoHerramienta, SinTema } from '../components/Shell'
import { ListaCanciones } from './ListaCanciones'

export function Cancion() {
  const { ficha } = useStore()
  if (!ficha) return <SinTema />
  return (
    <>
      <EncabezadoHerramienta id="cancion" />
      <ListaCanciones ficha={ficha} />
    </>
  )
}
