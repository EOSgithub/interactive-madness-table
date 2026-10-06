import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { startBroadcast } from '../state/sync'
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
import '../styles/tokens.css'
import { App } from './App'
import './dm.css'
import './editor.css'
import './settings.css'
import './stage.css'
import '../display/display.css'
import './brand.css'
import './mobile.css'
import '../styles/themes.css'
import { startSound } from './sound'

// This window owns the session and keeps the player screen up to date.
startBroadcast()
// Sound belongs to this window: see sound.ts.
startSound()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
