import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Alumno } from './Alumno'
import './alumno.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Alumno />
  </StrictMode>,
)
