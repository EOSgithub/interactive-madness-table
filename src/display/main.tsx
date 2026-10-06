import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bodoni-moda/opsz.css'
import '@fontsource-variable/bodoni-moda/opsz-italic.css'
import '@fontsource-variable/geist'
import '@fontsource-variable/eb-garamond'
import '@fontsource-variable/eb-garamond/wght-italic.css'
import '../styles/tokens.css'
import { Display } from './Display'
import './display-page.css'
import './display.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Display />
  </StrictMode>
)
