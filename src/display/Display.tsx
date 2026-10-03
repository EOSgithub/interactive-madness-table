import { useEffect, useRef, useState } from 'react'
import type { DisplayState } from '../shared/display'
import { urlFor } from '../state/media'
import { listen } from '../state/sync'
import { SPEED_FACTOR } from '../shared/settings'
import { clamp, faceAt, firstRollBeats, glitchValue, jolt, revealText, secondRollBeats, smooth } from './show'

// What players see. It shows the roll in progress and nothing else: no controls,
// no tables. Each frame is drawn from the time since the step began (see show.ts)
// and written straight to the DOM, with no React render per frame.
//
// Display is the player page (display.html), fed by the DM window. PlayerView is
// the view itself, also used by table mode inside the DM window.

const KIND_LABEL = { boon: 'A boon', neutral: 'It shows itself', bane: 'A bane' } as const

export function Display() {
  const [state, setState] = useState<DisplayState | null>(null)
  useEffect(() => listen(setState), [])

  // A finger has no F key and no double-click that feels natural: one tap is enough there.
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  useEffect(() => {
    const toggle = () => {
      if (document.fullscreenElement) void document.exitFullscreen()
      else void document.documentElement.requestFullscreen?.().catch(() => {})
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') toggle()
    }
    const gesture = touch ? 'click' : 'dblclick'
    window.addEventListener('keydown', onKey)
    window.addEventListener(gesture, toggle)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(gesture, toggle)
    }
  }, [touch])

  return <PlayerView state={state} hint={touch ? 'Tap for full screen' : 'Press F or double-click for full screen'} />
}

/** How many frames to time before deciding whether the device keeps up. */
const SAMPLE = 45

export function PlayerView({ state, hint }: { state: DisplayState | null; hint?: string }) {
  // Time a short run of frames once. A device that averages under about 30 frames
  // a second gets the lighter look: the grain stops moving.
  const [lite, setLite] = useState(false)
  useEffect(() => {
    let raf = 0
    let count = 0
    let first = 0
    const tick = (now: number) => {
      if (count === 0) first = now
      if (++count <= SAMPLE) raf = requestAnimationFrame(tick)
      else if ((now - first) / SAMPLE > 34) setLite(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!state) {
    return (
      <div className="player">
        <main className="screen waiting">
          <p>Waiting for the DM window.</p>
          <p className="small">Open the Interactive Madness Table in another window of this browser.</p>
        </main>
      </div>
    )
  }
  if (state.blackout) {
    return (
      <div className="player">
        <main className="screen dark" aria-hidden />
      </div>
    )
  }

  const rolling = (state.step === 'second' || state.step === 'verdict') && state.entry !== null
  return (
    <div className={`player ${lite ? 'lite' : ''}`}>
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
      {state.settings.grain && <div className="grain" aria-hidden />}
      {state.settings.vignette && <div className="vignette" aria-hidden />}
      {state.preview && <p className="preview-tag">Preview</p>}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

interface Els {
  camera: HTMLDivElement | null
  number: HTMLParagraphElement | null
  title: HTMLHeadingElement | null
  text: HTMLParagraphElement | null
  kind: HTMLParagraphElement | null
  wash: HTMLDivElement | null
  media: HTMLDivElement | null
}

/** Draws one frame at `t` ms into the step. Returns true once nothing will move any more. */
function draw(t: number, s: DisplayState, e: Els): boolean {
  const seed = s.stepAt
  const second = s.step === 'verdict' && s.second !== null
  const { verdictStyle, shake } = s.settings
  const rollStyle = s.rollStyle
  const speed = SPEED_FACTOR[s.settings.speed]
  const plain = rollStyle === 'plain'
  const beats = second ? secondRollBeats(speed, plain) : firstRollBeats(speed, plain)
  const sides = second ? (s.category?.subDie ?? 10) : (s.category?.die ?? 100)
  const result = (second ? s.second : s.first) ?? 1
  const landed = t >= beats.drum.landed
  const face =
    rollStyle === 'ratchet'
      ? faceAt(t, beats.drum, result, sides, seed)
      : { value: rollStyle === 'glitch' ? glitchValue(t, beats.drum.landed, result, sides, seed) : result, offset: 0, landed }
  const since = (t - beats.drum.landed) / 1000 // seconds since the drum stopped

  if (e.number) {
    e.number.textContent = String(face.value)
    // Each face drops in from above and settles; on landing the number swells once.
    const swell = face.landed ? 1 + 0.16 * Math.exp(-5 * Math.max(0, since)) : 1
    e.number.style.transform = `translateY(${(-face.offset * 0.22).toFixed(3)}em) scale(${swell.toFixed(4)})`
    e.number.style.opacity = plain
      ? smooth(0, beats.drum.landed, t).toFixed(3)
      : (face.landed ? 1 : 0.55 + 0.45 * (1 - clamp(face.offset))).toFixed(3)
    e.number.classList.toggle('landed', face.landed)
    e.number.classList.toggle('scrambling', rollStyle === 'glitch' && !face.landed)
  }

  if (e.camera) {
    const [x, y] = shake && !plain ? jolt(t, beats.drum.landed, seed) : [0, 0]
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
    // Burn: the text arrives overexposed and cools down to its own colour.
    const heat = verdictStyle === 'burn' && second ? Math.exp(-2.4 * Math.max(0, (t - beats.textStart) / 1000)) : 0
    e.text.style.filter = heat > 0.02 ? `brightness(${(1 + 2.6 * heat).toFixed(2)}) blur(${(3 * heat).toFixed(1)}px)` : ''
  }

  if (e.kind) e.kind.style.opacity = smooth(beats.drum.landed + 250, beats.drum.landed + 800, t).toFixed(3)

  // The verdict's colour hits the whole screen as the second die stops, then fades to a tint.
  if (e.wash) {
    const peak = verdictStyle === 'flash' ? 0.5 : verdictStyle === 'burn' ? 0.28 : 0
    e.wash.style.opacity = second && since >= 0 ? (0.1 * smooth(0, 0.5, since) + peak * Math.exp(-3.2 * since)).toFixed(3) : '0'
  }

  // This result's own image or video comes up from black as the die stops, and plays under the text.
  if (e.media) {
    e.media.style.opacity = smooth(beats.drum.landed + 100, beats.drum.landed + 1500, t).toFixed(3)
    const video = e.media.querySelector('video')
    if (video && landed && video.paused && !video.ended) void video.play().catch(() => {})
  }

  return t >= beats.done + 2500
}

/** The image or the video of a verdict, filling the screen behind the text. Always muted: sound is the DM window's. */
function Media({ media, hold }: { media: NonNullable<DisplayState['media']>; hold: (el: HTMLDivElement | null) => void }) {
  const [urls, setUrls] = useState<{ image?: string; video?: string }>({})
  useEffect(() => {
    let live = true
    const get = (id?: string) => (id ? urlFor(id).catch(() => undefined) : Promise.resolve(undefined))
    void Promise.all([get(media.image), get(media.video)]).then(([image, video]) => {
      if (live) setUrls({ image, video })
    })
    return () => {
      live = false
    }
  }, [media.image, media.video])

  return (
    <div className="media" ref={hold}>
      {urls.video ? <video src={urls.video} muted playsInline preload="auto" /> : urls.image && <img src={urls.image} alt="" />}
    </div>
  )
}

function Roll({ state }: { state: DisplayState }) {
  const els = useRef<Els>({ camera: null, number: null, title: null, text: null, kind: null, wash: null, media: null })
  const verdict = state.step === 'verdict' ? state.verdict : null
  const second = state.step === 'verdict' && state.second !== null

  useEffect(() => {
    const { animations, respectReducedMotion } = state.settings
    const calm = !animations || (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    let raf = 0
    const frame = () => {
      // With animations off, or reduced motion, the show is skipped: draw its last frame once.
      const t = calm ? 1e9 : Date.now() - state.stepAt
      if (!draw(t, state, els.current)) raf = requestAnimationFrame(frame)
    }
    frame()
    return () => cancelAnimationFrame(raf)
  }, [state])

  const e = els.current
  return (
    <main
      className={`screen ${verdict?.kind ?? ''} ${state.settings.animations ? '' : 'still'} ${state.media ? 'has-media' : ''}`}
      key={state.settings.animations ? 'show' : `still-${state.stepAt}`}
    >
      {state.media && <Media media={state.media} hold={(el) => void (e.media = el)} />}
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
