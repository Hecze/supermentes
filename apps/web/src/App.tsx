import { useCuenta } from './app/cuenta'
import { usePerfil } from './app/perfil'
import { StoreProvider, useStore } from './app/store'
import { Shell } from './components/Shell'
import { Biblioteca } from './views/Biblioteca'
import { Cancion } from './views/Cancion'
import { Crucigrama } from './views/Crucigrama'
import { Examen } from './views/Examen'
import { Ficha } from './views/Ficha'
import { Juego } from './views/Juego'
import { Onboarding } from './views/Onboarding'
import { Perfil } from './views/Perfil'
import { Sesion } from './views/Sesion'

const VISTAS = {
  ficha: Ficha,
  sesion: Sesion,
  cancion: Cancion,
  examen: Examen,
  juego: Juego,
  crucigrama: Crucigrama,
  biblioteca: Biblioteca,
  resultados: Juego,
  perfil: Perfil,
}

function Pantalla() {
  const { vista, ficha } = useStore()
  const { entro } = useCuenta()
  const { perfil, cargando } = usePerfil()
  const Vista = VISTAS[vista]
  // Con cuenta y sin perfil: el onboarding, una sola vez.
  if (entro && !perfil) return cargando ? null : <Onboarding />
  return (
    <Shell>
      <Vista key={`${vista}-${ficha?.id}`} />
    </Shell>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Pantalla />
    </StoreProvider>
  )
}
