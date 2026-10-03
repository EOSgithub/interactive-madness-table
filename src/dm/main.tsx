import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { startBroadcast } from '../state/sync'
import { App } from './App'
import './dm.css'
import './editor.css'
import './settings.css'

// This window owns the session and keeps the player screen up to date.
startBroadcast()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
