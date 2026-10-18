import { StoreProvider, useStore } from './app/store'
import { Shell } from './components/Shell'
import { Biblioteca } from './views/Biblioteca'
import { Cancion } from './views/Cancion'
import { Crucigrama } from './views/Crucigrama'
import { Examen } from './views/Examen'
import { Ficha } from './views/Ficha'
import { Inicio } from './views/Inicio'
import { Juego } from './views/Juego'
import { ResultadosJuegos } from './views/ResultadosJuegos'
import { Sesion } from './views/Sesion'

const VISTAS = {
  inicio: Inicio,
  ficha: Ficha,
  sesion: Sesion,
  cancion: Cancion,
  examen: Examen,
  juego: Juego,
  crucigrama: Crucigrama,
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
