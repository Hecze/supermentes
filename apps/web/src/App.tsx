import { StoreProvider, useStore } from './app/store'
import { Shell } from './components/Shell'
import { Adaptar } from './views/Adaptar'
import { Biblioteca } from './views/Biblioteca'
import { Cancion } from './views/Cancion'
import { Crucigrama } from './views/Crucigrama'
import { Examen } from './views/Examen'
import { Ficha } from './views/Ficha'
import { Juego } from './views/Juego'
import { ResultadosJuegos } from './views/ResultadosJuegos'

const VISTAS = {
  ficha: Ficha,
  cancion: Cancion,
  examen: Examen,
  juego: Juego,
  crucigrama: Crucigrama,
  adaptar: Adaptar,
  biblioteca: Biblioteca,
  resultados: ResultadosJuegos,
}

function Pantalla() {
  const { vista, ficha } = useStore()
  const Vista = VISTAS[vista]
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
