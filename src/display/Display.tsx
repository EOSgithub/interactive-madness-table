import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { DisplayState } from '../shared/display'
import { SPEED_FACTOR } from '../shared/settings'
import { DEFAULT_THEME, type ThemeId } from '../shared/themes'
import type { OutcomeKind } from '../shared/types'
import { urlFor } from '../state/media'
import { listen } from '../state/sync'
import { paint } from './atmosphere'
import { advance, bannerLevel, clamp, faceAt, firstRollBeats, glitchValue, jolt, revealText, smooth, verdictBeats } from './show'

// What players see. It shows the roll in progress and nothing else: no controls,
// no tables. Each frame is drawn from the time since the step began (see show.ts)
// and written straight to the DOM and to a canvas, with no React render per frame.
//
// Display is the player page (display.html), fed by the DM window. PlayerView is
// the view itself, also used by the monitor and by table mode in the DM window.

const KIND_LABEL = { boon: 'A boon', neutral: 'It shows itself', bane: 'A bane' } as const
/** The banner that crosses the screen when the verdict is named, in the words of each theme. `plain` is for a table with no second roll. */
const BANNER: Record<ThemeId, Record<OutcomeKind | 'plain', string>> = {
  gothic: { boon: 'Boon Granted', neutral: 'Madness Manifest', bane: 'Bane Inflicted', plain: 'Madness Takes Hold' },
  cosmic: { boon: 'A Star Aligns', neutral: 'It Has Noticed You', bane: 'The Void Answers', plain: 'Beyond Comprehension' },
  surreal: { boon: 'A Kind Dream', neutral: 'Logic Slips', bane: 'The Dream Turns', plain: 'Nothing Is As It Was' },
  occult: { boon: 'The Pact Rewards', neutral: 'The Sign Appears', bane: 'The Price Is Paid', plain: 'The Seal Is Broken' },
  societal: { boon: 'Appeal Granted', neutral: 'Noted On File', bane: 'Sentence Passed', plain: 'Case Opened' },
  hellenic: { boon: 'Favour of the Gods', neutral: 'The Gods Take Notice', bane: 'Wrath of the Gods', plain: 'Sent by the Gods' }
}

/** A step time this far in the past was set by Skip: the show is over. */
const LONG_AGO = 1e6

export function Display() {
  const [state, setState] = useState<DisplayState | null>(null)
  useEffect(() => listen(setState), [])

  // The page behind the view takes the colours of the theme too.
  const theme = state?.theme ?? DEFAULT_THEME
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

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

/** Times a short run of frames once. A device that averages under about 30 a second gets the lighter look. */
function useLite(): boolean {
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
  return lite
}

interface Els {
  camera: HTMLDivElement | null
  number: HTMLParagraphElement | null
  title: HTMLHeadingElement | null
  lead: HTMLParagraphElement | null
  text: HTMLParagraphElement | null
  kind: HTMLParagraphElement | null
  wash: HTMLDivElement | null
  media: HTMLDivElement | null
  banner: HTMLDivElement | null
  word: HTMLSpanElement | null
  echo: HTMLSpanElement | null
  blood: HTMLDivElement | null
  halo: HTMLDivElement | null
}

const noEls = (): Els => ({
  camera: null,
  number: null,
  title: null,
  lead: null,
  text: null,
  kind: null,
  wash: null,
  media: null,
  banner: null,
  word: null,
  echo: null,
  blood: null,
  halo: null
})

/** What one frame of the show tells the sky around it. */
interface Frame {
  /** Nothing will move any more. */
  done: boolean
  /** Ms since the verdict was named, or -1 before it. */
  since: number
}

/** Draws one frame at `t` ms into the step. */
function draw(t: number, s: DisplayState, e: Els): Frame {
  const seed = s.stepAt
  const isVerdict = s.step === 'verdict'
  const second = isVerdict && s.second !== null
  const { shake } = s.settings
  const rollStyle = s.rollStyle
  const speed = SPEED_FACTOR[s.settings.speed]
  const plain = rollStyle === 'plain'
  const verdict = isVerdict ? verdictBeats(second, speed, plain) : null
  const beats = verdict ?? firstRollBeats(speed, plain)
  const sides = second ? (s.category?.subDie ?? 10) : (s.category?.die ?? 100)
  const result = (second ? s.second : s.first) ?? 1
  const landed = t >= beats.drum.landed
  const face =
    rollStyle === 'ratchet'
      ? faceAt(t, beats.drum, result, sides, seed)
      : { value: rollStyle === 'glitch' ? glitchValue(t, beats.drum.landed, result, sides, seed) : result, offset: 0, landed }
  const sinceLanded = (t - beats.drum.landed) / 1000
  const since = verdict ? t - verdict.banner.start : -1
  const banner = verdict ? bannerLevel(t, verdict.banner) : 0

  if (e.number) {
    e.number.textContent = String(face.value)
    // Each face drops in from above and settles; on landing the number swells once.
    const swell = face.landed ? 1 + 0.16 * Math.exp(-5 * Math.max(0, sinceLanded)) : 1
    e.number.style.transform = `translateY(${(-face.offset * 0.22).toFixed(3)}em) scale(${swell.toFixed(4)})`
    e.number.style.opacity = plain
      ? smooth(0, beats.drum.landed, t).toFixed(3)
      : (face.landed ? 1 : 0.55 + 0.45 * (1 - clamp(face.offset))).toFixed(3)
    e.number.classList.toggle('landed', face.landed)
    e.number.classList.toggle('scrambling', rollStyle === 'glitch' && !face.landed)
  }

  // The moon behind the die lights up as the die stops.
  if (e.halo) e.halo.style.opacity = (landed ? 0.35 + 0.65 * Math.exp(-2.2 * sinceLanded) : 0.12).toFixed(3)

  if (e.camera) {
    // The jolt is in container units, so it is as strong on the DM's small monitor as on a TV.
    const [x, y] = shake && !plain ? jolt(t, beats.drum.landed, seed, 1.7) : [0, 0]
    // The screen is struck a second time, harder, as the banner lands.
    const [bx, by] = shake && verdict ? jolt(t, verdict.banner.start, seed + 7, 2.6) : [0, 0]
    const push = 1 + 0.045 * clamp(t / beats.done)
    e.camera.style.transform = `translate(${(x + bx).toFixed(2)}cqw, ${(y + by).toFixed(2)}cqw) scale(${push.toFixed(4)})`
    // While the banner is across the screen everything behind it steps back.
    e.camera.style.opacity = (1 - 0.82 * banner).toFixed(3)
  }

  if (e.title && s.entry) {
    const title = second ? s.entry.title : revealText(s.entry.title, t, beats.titleStart, beats.titleEnd - beats.titleStart, seed)
    if (e.title.textContent !== title) e.title.textContent = title
    e.title.classList.toggle('forming', !second && t < beats.titleEnd)
  }

  // With no second roll the description comes up as soon as the title is whole, before the banner.
  if (e.lead) e.lead.style.opacity = smooth(beats.titleEnd, beats.titleEnd + 350 * speed, t).toFixed(3)

  if (e.text) {
    const u = smooth(beats.textStart, beats.textEnd, t)
    e.text.style.opacity = u.toFixed(3)
    e.text.style.transform = `translateY(${((1 - u) * 0.9).toFixed(2)}em)`
  }

  if (verdict) {
    const b = verdict.banner
    if (e.kind) e.kind.style.opacity = smooth(b.release, b.end, t).toFixed(3)

    // The banner: the words slam down from oversize in a burst of light, and a ghost of them drifts out.
    if (e.banner && e.word && e.echo) {
      const p = clamp((t - b.start) / (b.end - b.start))
      const sec = Math.max(0, since / 1000)
      e.banner.style.opacity = banner.toFixed(3)
      e.banner.style.visibility = banner > 0.001 ? 'visible' : 'hidden'
      e.word.style.transform = `scale(${(1 + 0.06 * p + 0.7 * Math.exp(-9 * sec)).toFixed(4)})`
      e.echo.style.transform = `scale(${(1.04 + 0.5 * p).toFixed(4)})`
      e.echo.style.opacity = (0.55 * (1 - p)).toFixed(3)
    }

    // The whole screen is struck white with the outcome's colour, and a tint of it stays.
    if (e.wash) {
      const sec = since / 1000
      e.wash.style.opacity = since >= 0 ? (0.12 * smooth(0, 0.5, sec) + 0.95 * Math.exp(-5 * sec)).toFixed(3) : '0'
    }
  } else if (e.wash) {
    e.wash.style.opacity = '0'
  }

  // This result's own image or video comes up from black as the die stops, and plays under the text.
  if (e.media) {
    e.media.style.opacity = smooth(beats.drum.landed + 100, beats.drum.landed + 1500, t).toFixed(3)
    const video = e.media.querySelector('video')
    if (video && landed && video.paused && !video.ended) void video.play().catch(() => {})
  }

  return { done: t >= beats.done + 2500, since }
}

/** How far the emblem has turned: it takes the colour of a bane as one is named. */
function moonBlood(kind: OutcomeKind | null, since: number): number {
  return kind === 'bane' && since >= 0 ? smooth(0, 1100, since) : 0
}

export function PlayerView({ state, hint }: { state: DisplayState | null; hint?: string }) {
  const lite = useLite()
  const els = useRef<Els>(noEls())
  const canvas = useRef<HTMLCanvasElement>(null)
  // The clock of the current show: it only runs while frames are being drawn (see advance).
  const clock = useRef({ stepAt: 0, t: 0, last: 0 })

  const rolling = state !== null && (state.step === 'second' || state.step === 'verdict') && state.entry !== null

  useEffect(() => {
    if (!state) return
    const { animations, respectReducedMotion } = state.settings
    // With animations off, or reduced motion, the show is skipped: its last frame is drawn once and nothing drifts.
    const calm = !animations || (respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const c = clock.current
    if (c.stepAt !== state.stepAt) {
      c.stepAt = state.stepAt
      c.t = Date.now() - state.stepAt
      c.last = performance.now()
    }
    const kind = state.step === 'verdict' ? (state.verdict?.kind ?? null) : null
    const ctx = canvas.current?.getContext('2d') ?? null

    let raf = 0
    const frame = () => {
      const now = performance.now()
      c.t = advance(c.t, now - c.last)
      c.last = now
      const t = calm || state.stepAt < LONG_AGO ? 1e9 : c.t
      const shown = rolling ? draw(t, state, els.current) : { done: true, since: -1 }
      const e = els.current
      if (e.blood) e.blood.style.opacity = moonBlood(kind, shown.since).toFixed(3)
      const el = canvas.current
      if (ctx && el) {
        // The canvas follows the size of the view, at no more than two device pixels per CSS pixel.
        const ratio = Math.min(2, window.devicePixelRatio || 1)
        const w = el.clientWidth
        const h = el.clientHeight
        if (el.width !== Math.round(w * ratio) || el.height !== Math.round(h * ratio)) {
          el.width = Math.round(w * ratio)
          el.height = Math.round(h * ratio)
        }
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
        paint(ctx, w, h, calm ? 0 : now, { theme: state.theme, seed: state.stepAt, kind, since: shown.since, lite })
      }
      if (!calm) raf = requestAnimationFrame(frame)
    }
    frame()
    // A still picture is only repainted when the view changes size.
    const onResize = () => {
      if (calm) frame()
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [state, lite, rolling])

  if (!state) {
    return (
      <div className="player">
        <main className="screen waiting">
          <Moon />
          <p className="eyebrow">Waiting for the DM window</p>
          <p className="blurb">Open the Interactive Madness Table in another window of this browser.</p>
        </main>
      </div>
    )
  }
  const e = els.current
  const still = !state.settings.animations
  return (
    <div className={`player ${lite ? 'lite' : ''} ${still ? 'still' : ''}`} data-theme={state.theme}>
      <div className="fog" aria-hidden />
      {rolling ? (
        <Roll state={state} els={e} />
      ) : (
        // The key restarts the entrance when the step changes.
        <main className="screen quiet" key={`${state.step}-${state.stepAt}`}>
          <Moon blood={(el) => void (e.blood = el)}>
            {state.step === 'first' && state.category && <p className="number waiting-die">d{state.category.die}</p>}
          </Moon>
          {state.step === 'first' && state.category ? (
            <>
              <h1>{state.category.label}</h1>
              <p className="blurb">{state.category.blurb}</p>
            </>
          ) : (
            <p className="eyebrow">{state.setName}</p>
          )}
        </main>
      )}
      <canvas className="air" ref={canvas} aria-hidden />
      {state.settings.grain && <div className="grain" aria-hidden />}
      {state.settings.vignette && <div className="vignette" aria-hidden />}
      {state.preview && <p className="preview-tag">Preview</p>}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

/** The emblem the die sits on: a moon, or whatever the theme makes of it. It turns to the colour of a bane when one is named. */
function Moon(props: { blood?: (el: HTMLDivElement | null) => void; halo?: (el: HTMLDivElement | null) => void; children?: React.ReactNode }) {
  return (
    <div className="die">
      <div className="moon" aria-hidden>
        <div className="moon-halo" ref={props.halo} />
        <div className="moon-disc" />
        <div className="moon-blood" ref={props.blood} />
        <div className="moon-face" />
      </div>
      {props.children}
    </div>
  )
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

function Roll({ state, els: e }: { state: DisplayState; els: Els }) {
  const verdict = state.step === 'verdict' ? state.verdict : null
  const second = state.step === 'verdict' && state.second !== null

  // Nobody can scroll a TV, so a long outcome is set smaller, on a wider line,
  // until the whole verdict fits. Below half size it stops, and the screen scrolls.
  const text = verdict?.text ?? state.entry?.description
  useLayoutEffect(() => {
    const { camera, title } = e
    const screen = camera?.parentElement
    if (!camera || !screen) return
    const fit = () => {
      // Measure with the real title and no camera move; the next frame puts both back.
      if (title && state.entry) title.textContent = state.entry.title
      const moved = camera.style.transform
      camera.style.transform = 'none'
      let k = 1
      camera.style.setProperty('--fit', '1')
      while (screen.scrollHeight > screen.clientHeight + 1 && k > 0.5) {
        k -= 0.05
        camera.style.setProperty('--fit', k.toFixed(2))
      }
      camera.style.transform = moved
    }
    fit()
    const watch = new ResizeObserver(fit)
    watch.observe(screen)
    return () => watch.disconnect()
  }, [e, state.entry, state.step, state.stepAt, state.settings.animations, text])

  const word = verdict ? BANNER[state.theme][verdict.kind ?? 'plain'] : ''
  // A table with no second roll never showed its description on the way here, so the verdict carries it.
  const lead = verdict?.text && !second ? state.entry?.description : ''
  return (
    <main
      className={`screen show ${verdict ? (verdict.kind ?? 'neutral') : ''} ${state.media ? 'has-media' : ''}`}
      key={state.settings.animations ? 'show' : `still-${state.stepAt}`}
    >
      {state.media && <Media media={state.media} hold={(el) => void (e.media = el)} />}
      <div className="wash" ref={(el) => void (e.wash = el)} />
      <div className="camera" ref={(el) => void (e.camera = el)}>
        <p className="eyebrow">
          {state.category?.label}
          {second && <span className="eyebrow-roll">{state.first}</span>}
        </p>
        <Moon blood={(el) => void (e.blood = el)} halo={(el) => void (e.halo = el)}>
          <p className="number" ref={(el) => void (e.number = el)} />
        </Moon>
        {verdict?.kind && (
          <p className="kind" ref={(el) => void (e.kind = el)}>
            {KIND_LABEL[verdict.kind]}
          </p>
        )}
        <h1 ref={(el) => void (e.title = el)} />
        {lead && (
          <p className="description" ref={(el) => void (e.lead = el)}>
            {lead}
          </p>
        )}
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
      {verdict && (
        <div className="banner" ref={(el) => void (e.banner = el)} aria-hidden>
          <span className="banner-echo" ref={(el) => void (e.echo = el)}>
            {word}
          </span>
          <span className="banner-word" ref={(el) => void (e.word = el)}>
            {word}
          </span>
        </div>
      )}
    </main>
  )
}
