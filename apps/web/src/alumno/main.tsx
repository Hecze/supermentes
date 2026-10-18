import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Alumno } from './Alumno'
import { Tarea } from './Tarea'
import './alumno.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* /t/CODIGO es una tarea por salón; /j/CODIGO, un juego para practicar. */}
    {location.pathname.startsWith('/t/') ? <Tarea /> : <Alumno />}
  </StrictMode>,
)
