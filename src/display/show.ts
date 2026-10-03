// The timing of the show, as pure functions of the time since a step began.
// Nothing here keeps state between frames: given the same time and the same seed
// it returns the same picture, so a player screen opened late, or reloaded, lands
// on the right frame, and two screens draw the same thing.
//
// The approach comes from the reveal in The Temple of Time: motion from physics
// (a ratchet that overshoots and settles) instead of identical eased transitions,
// and glitches that run on film frames, not on the screen's refresh rate.

export const clamp = (x: number, a = 0, b = 1): number => Math.min(b, Math.max(a, x))

/** 0 before `a`, 1 after `b`, smooth in between. */
export const smooth = (a: number, b: number, x: number): number => {
  const u = clamp((x - a) / (b - a))
  return u * u * (3 - 2 * u)
}

/** Deterministic noise in [0, 1). */
export function rand(a: number, b = 0): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35)
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** Glitches change on film frames. */
export const FRAME = 1000 / 24

// ------------------------------------------------------------------ the drum

export interface Drum {
  /** When each face clicks into place, in ms. The last one is the real result. */
  ticks: number[]
  /** When the drum has landed. */
  landed: number
}

/**
 * A drum that starts fast and slows down until it stops: each gap between
 * clicks is a little longer than the one before.
 */
export function makeDrum(duration: number, firstGap = 55, growth = 1.14): Drum {
  const ticks: number[] = []
  let t = 0
  let gap = firstGap
  while (t + gap < duration) {
    t += gap
    ticks.push(t)
    gap *= growth
  }
  if (ticks.length === 0) ticks.push(duration)
  return { ticks, landed: ticks[ticks.length - 1] }
}

/** One click of the ratchet: the face drops in, overshoots and settles. 0 = not there yet, 1 = at rest. */
export function tickStep(tau: number): number {
  if (tau < 0) return 0
  const s = tau / 1000
  return 1 - Math.exp(-26 * s) * Math.cos(32 * s)
}

export interface Face {
  /** The number showing. */
  value: number
  /** How far the face is from rest: 1 just clicked in, 0 settled. Can go slightly negative on the overshoot. */
  offset: number
  /** Whether the drum has stopped on the result. */
  landed: boolean
}

/** What the drum shows at time `t`. Every face before the last is noise; the last is `result`. */
export function faceAt(t: number, drum: Drum, result: number, sides: number, seed: number): Face {
  let i = -1
  for (let k = 0; k < drum.ticks.length; k++) {
    if (t >= drum.ticks[k]) i = k
    else break
  }
  if (i < 0) return { value: 1 + Math.floor(rand(seed, -1) * sides), offset: 0, landed: false }
  const last = i === drum.ticks.length - 1
  let value = result
  if (!last) {
    value = 1 + Math.floor(rand(seed, i) * sides)
    // A spinning drum never shows the same face twice in a row.
    const before = i === 0 ? -1 : 1 + Math.floor(rand(seed, i - 1) * sides)
    if (value === before) value = (value % sides) + 1
  }
  return { value, offset: 1 - tickStep(t - drum.ticks[i]), landed: last }
}

/** A shake that dies out, for the moment the drum stops. Returns x and y in px. */
export function jolt(t: number, landed: number, seed: number, strength = 22): [number, number] {
  const s = (t - landed) / 1000
  if (s < 0 || s > 0.6) return [0, 0]
  const k = strength * Math.exp(-7 * s)
  const f = Math.floor(t / FRAME)
  return [(rand(seed, f) - 0.5) * k, (rand(seed, f + 997) - 0.5) * k]
}

// ------------------------------------------------------------------ the title

// Greek and old Latin glyphs: common serif fonts have them, so none turns into an empty box.
const JUNK = [...'ΞΨΩΔΣΦΘΛΠλξψθπ§¶†‡ÆØÞðþßŒœ']

/**
 * A title that comes out of noise. Each letter is junk until its own moment,
 * then locks; the letters lock in a scattered order, over `span` ms from `start`.
 */
export function revealText(text: string, t: number, start: number, span: number, seed: number): string {
  if (t >= start + span) return text
  if (t < start) return ''
  const frame = Math.floor(t / FRAME)
  const chars = [...text]
  let out = ''
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (ch === ' ') {
      out += ' '
      continue
    }
    const lockAt = start + span * (0.15 + 0.85 * rand(seed, 5000 + i))
    out += t >= lockAt ? ch : JUNK[Math.floor(rand(seed + frame, i) * JUNK.length)]
  }
  return out
}

// ------------------------------------------------------------------ the timeline

/** The beats of one show, in ms from the start of the step. */
export interface Beats {
  drum: Drum
  /** The title starts coming out of noise, and when it is whole. */
  titleStart: number
  titleEnd: number
  /** The text under the title fades in. */
  textStart: number
  textEnd: number
  /** After this nothing moves any more. */
  done: number
}

/** The first roll: a long drum, then the title. */
export function firstRollBeats(speed = 1): Beats {
  const drum = makeDrum(2500 * speed)
  const titleStart = drum.landed + 450 * speed
  const titleEnd = titleStart + 1500 * speed
  return { drum, titleStart, titleEnd, textStart: titleEnd + 250 * speed, textEnd: titleEnd + 1150 * speed, done: titleEnd + 1400 * speed }
}

/** The second roll: a short drum, then the verdict. The title is already known. */
export function secondRollBeats(speed = 1): Beats {
  const drum = makeDrum(1400 * speed, 60, 1.2)
  return { drum, titleStart: 0, titleEnd: 0, textStart: drum.landed + 600 * speed, textEnd: drum.landed + 1500 * speed, done: drum.landed + 1800 * speed }
}
