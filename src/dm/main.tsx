import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Placeholder until phase 2 builds the DM window.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main>
      <h1>Interactive Madness Table</h1>
      <p>DM window. The play screen comes in phase 2.</p>
    </main>
  </StrictMode>
)
