import { StoreProvider, useStore } from './app/store'
import { Shell } from './components/Shell'
import { Adaptar } from './views/Adaptar'
import { Biblioteca } from './views/Biblioteca'
import { Cancion } from './views/Cancion'
import { Crucigrama } from './views/Crucigrama'
import { Examen } from './views/Examen'
import { Ficha } from './views/Ficha'
import { Inicio } from './views/Inicio'
import { Juego } from './views/Juego'

const VISTAS = {
  inicio: Inicio,
  ficha: Ficha,
  cancion: Cancion,
  examen: Examen,
  juego: Juego,
  crucigrama: Crucigrama,
  adaptar: Adaptar,
  biblioteca: Biblioteca,
}

function Pantalla() {
  const { vista } = useStore()
  const Vista = VISTAS[vista]
  return (
    <Shell>
      <Vista key={vista} />
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
