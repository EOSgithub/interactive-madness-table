import { useEffect, useState } from 'react'
import type { DisplayState } from '../shared/display'
import { listen } from '../state/sync'

// The player screen. It shows the roll in progress and nothing else: no controls,
// no tables. This is the plain version; the staging phase replaces these static
// views with the time-driven show.

const KIND_LABEL = { boon: 'A boon', neutral: 'It shows itself', bane: 'A bane' } as const

export function Display() {
  const [state, setState] = useState<DisplayState | null>(null)
  useEffect(() => listen(setState), [])

  useEffect(() => {
    const toggle = () => {
      if (document.fullscreenElement) void document.exitFullscreen()
      else void document.documentElement.requestFullscreen().catch(() => {})
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') toggle()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('dblclick', toggle)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('dblclick', toggle)
    }
  }, [])

  if (!state) {
    return (
      <main className="screen waiting">
        <p>Waiting for the DM window.</p>
        <p className="small">Open the Interactive Madness Table in another window of this browser.</p>
      </main>
    )
  }
  if (state.blackout) return <main className="screen" aria-hidden />

  return (
    // The key restarts the entrance when the step changes.
    <main className={`screen ${state.verdict?.kind ?? ''}`} key={`${state.step}-${state.stepAt}`}>
      {state.step === 'category' && <p className="set-name">{state.setName}</p>}

      {state.step === 'first' && state.category && (
        <>
          <p className="eyebrow">{state.category.label}</p>
          <p className="blurb">{state.category.blurb}</p>
        </>
      )}

      {state.step === 'second' && state.entry && (
        <>
          <p className="number">{state.first}</p>
          <h1>{state.entry.title}</h1>
          <p className="description">{state.entry.description}</p>
        </>
      )}

      {state.step === 'verdict' && state.entry && (
        <>
          <p className="eyebrow">
            {state.first}
            {state.second !== null && ` · ${state.second}`}
            {state.verdict?.kind && ` · ${KIND_LABEL[state.verdict.kind]}`}
          </p>
          <h1>{state.entry.title}</h1>
          {state.verdict?.text ? (
            <p className="effect">
              <strong>{state.verdict.duration}</strong> {state.verdict.text}
            </p>
          ) : (
            <p className="description">{state.entry.description}</p>
          )}
        </>
      )}
      <p className="hint">Press F or double-click for full screen</p>
    </main>
  )
}
