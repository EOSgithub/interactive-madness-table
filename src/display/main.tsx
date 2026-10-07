import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bodoni-moda/opsz.css'
import '@fontsource-variable/bodoni-moda/opsz-italic.css'
import '@fontsource-variable/geist'
import '@fontsource-variable/eb-garamond'
import '@fontsource-variable/eb-garamond/wght-italic.css'
// The heading faces of the other themes. A browser only fetches the one in use.
import '@fontsource-variable/josefin-sans'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource/im-fell-english/400.css'
import '@fontsource/im-fell-english/400-italic.css'
import '@fontsource/special-elite/400.css'
import '@fontsource-variable/cinzel'
import '@fontsource/libre-baskerville/400.css'
import '@fontsource/libre-baskerville/400-italic.css'
import '@fontsource/libre-baskerville/700.css'
import '../styles/tokens.css'
import { Display } from './Display'
import './display-page.css'
import './display.css'
import '../styles/themes.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Display />
  </StrictMode>
)
