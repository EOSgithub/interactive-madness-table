import { useEffect, useRef, useState } from 'react'
import type { DisplayState } from '../shared/display'
import { listen } from '../state/sync'
import { clamp, faceAt, firstRollBeats, jolt, revealText, secondRollBeats, smooth } from './show'

// The player screen. It shows the roll in progress and nothing else: no controls,
// no tables. Each frame is drawn from the time since the step began (see show.ts)
// and written straight to the DOM, with no React render per frame.

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
  if (state.blackout) return <main className="screen dark" aria-hidden />

  const rolling = (state.step === 'second' || state.step === 'verdict') && state.entry !== null
  return (
    <>
      {rolling ? (
        <Roll state={state} />
      ) : (
        // The key restarts the entrance when the step changes.
        <main className="screen quiet" key={`${state.step}-${state.stepAt}`}>
          {state.step === 'first' && state.category ? (
            <>
              <p className="eyebrow">{state.category.label}</p>
              <p className="blurb">{state.category.blurb}</p>
            </>
          ) : (
            <p className="eyebrow">{state.setName}</p>
          )}
        </main>
      )}
      <div className="grain" aria-hidden />
      <div className="vignette" aria-hidden />
      <p className="hint">Press F or double-click for full screen</p>
    </>
  )
}

interface Els {
  camera: HTMLDivElement | null
  number: HTMLParagraphElement | null
  title: HTMLHeadingElement | null
  text: HTMLParagraphElement | null
  kind: HTMLParagraphElement | null
  wash: HTMLDivElement | null
}

/** Draws one frame at `t` ms into the step. Returns true once nothing will move any more. */
function draw(t: number, s: DisplayState, e: Els): boolean {
  const seed = s.stepAt
  const second = s.step === 'verdict' && s.second !== null
  const beats = second ? secondRollBeats() : firstRollBeats()
  const sides = second ? (s.category?.subDie ?? 10) : (s.category?.die ?? 100)
  const result = (second ? s.second : s.first) ?? 1
  const face = faceAt(t, beats.drum, result, sides, seed)
  const since = (t - beats.drum.landed) / 1000 // seconds since the drum stopped

  if (e.number) {
    e.number.textContent = String(face.value)
    // Each face drops in from above and settles; on landing the number swells once.
    const swell = face.landed ? 1 + 0.16 * Math.exp(-5 * Math.max(0, since)) : 1
    e.number.style.transform = `translateY(${(-face.offset * 0.22).toFixed(3)}em) scale(${swell.toFixed(4)})`
    e.number.style.opacity = (face.landed ? 1 : 0.55 + 0.45 * (1 - clamp(face.offset))).toFixed(3)
    e.number.classList.toggle('landed', face.landed)
  }

  if (e.camera) {
    const [x, y] = jolt(t, beats.drum.landed, seed)
    const push = 1 + 0.045 * clamp(t / beats.done)
    e.camera.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${push.toFixed(4)})`
  }

  if (e.title && s.entry) {
    const title = second ? s.entry.title : revealText(s.entry.title, t, beats.titleStart, beats.titleEnd - beats.titleStart, seed)
    if (e.title.textContent !== title) e.title.textContent = title
    e.title.classList.toggle('forming', !second && t < beats.titleEnd)
  }

  if (e.text) {
    const u = smooth(beats.textStart, beats.textEnd, t)
    e.text.style.opacity = u.toFixed(3)
    e.text.style.transform = `translateY(${((1 - u) * 14).toFixed(1)}px)`
  }

  if (e.kind) e.kind.style.opacity = smooth(beats.drum.landed + 250, beats.drum.landed + 800, t).toFixed(3)

  // The verdict's colour hits the whole screen as the second die stops, then fades to a tint.
  if (e.wash) e.wash.style.opacity = second && since >= 0 ? (0.1 + 0.5 * Math.exp(-3.2 * since)).toFixed(3) : '0'

  return t >= beats.done + 2500
}

function Roll({ state }: { state: DisplayState }) {
  const els = useRef<Els>({ camera: null, number: null, title: null, text: null, kind: null, wash: null })
  const verdict = state.step === 'verdict' ? state.verdict : null
  const second = state.step === 'verdict' && state.second !== null

  useEffect(() => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const frame = () => {
      // With reduced motion the show is skipped: draw its last frame once.
      const t = calm ? 1e9 : Date.now() - state.stepAt
      if (!draw(t, state, els.current)) raf = requestAnimationFrame(frame)
    }
    frame()
    return () => cancelAnimationFrame(raf)
  }, [state])

  const e = els.current
  return (
    <main className={`screen roll ${verdict?.kind ?? ''}`}>
      <div className="wash" ref={(el) => void (e.wash = el)} />
      <div className="camera" ref={(el) => void (e.camera = el)}>
        <p className="eyebrow">
          {state.category?.label}
          {second && ` · ${state.first}`}
        </p>
        <p className="number" ref={(el) => void (e.number = el)} />
        {second && verdict?.kind && (
          <p className="kind" ref={(el) => void (e.kind = el)}>
            {KIND_LABEL[verdict.kind]}
          </p>
        )}
        <h1 ref={(el) => void (e.title = el)} />
        <p className={verdict?.text ? 'effect' : 'description'} ref={(el) => void (e.text = el)}>
          {verdict?.text ? (
            <>
              <strong>{verdict.duration}</strong> {verdict.text}
            </>
          ) : (
            state.entry?.description
          )}
        </p>
      </div>
    </main>
  )
}
