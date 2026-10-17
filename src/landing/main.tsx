import { inject } from '@vercel/analytics'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import './landing.css'
import { Landing } from './Landing'

// Visitas en Vercel Web Analytics (se activa desde el panel del proyecto).
inject()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
)
