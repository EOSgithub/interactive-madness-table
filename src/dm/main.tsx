import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { startBroadcast } from '../state/sync'
import { App } from './App'
import './dm.css'
import './editor.css'
import './settings.css'
import './stage.css'
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
