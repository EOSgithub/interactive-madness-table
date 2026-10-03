import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/cinzel'
import { Display } from './Display'
import './display-page.css'
import './display.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Display />
  </StrictMode>
)
