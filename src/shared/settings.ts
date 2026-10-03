import type { RollStyle } from './types'

// How the show looks and moves. The DM sets these once; they are saved, and sent
// to the player screen with every state.

export type VerdictStyle = 'flash' | 'fade' | 'burn'
export type Speed = 'slow' | 'normal' | 'fast'

export interface Settings {
  /** Off: every step is a plain fade, whatever else is chosen below. */
  animations: boolean
  rollStyle: RollStyle
  verdictStyle: VerdictStyle
  speed: Speed
  grain: boolean
  vignette: boolean
  shake: boolean
  /** Skip the show when the system asks for reduced motion. */
  respectReducedMotion: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  animations: true,
  rollStyle: 'ratchet',
  verdictStyle: 'flash',
  speed: 'normal',
  grain: true,
  vignette: true,
  shake: true,
  respectReducedMotion: true
}

/** How much longer or shorter every beat of the show gets. */
export const SPEED_FACTOR: Record<Speed, number> = { slow: 1.5, normal: 1, fast: 0.6 }

export const ROLL_STYLES: { value: RollStyle; label: string; hint: string }[] = [
  { value: 'ratchet', label: 'Ratchet', hint: 'A drum that clicks, slows down and stops.' },
  { value: 'glitch', label: 'Glitch', hint: 'The digits scramble like a bad signal, then lock.' },
  { value: 'plain', label: 'Plain', hint: 'The number fades in. No spin.' }
]

export const VERDICT_STYLES: { value: VerdictStyle; label: string; hint: string }[] = [
  { value: 'flash', label: 'Flash', hint: "The outcome's colour hits the screen, then fades to a tint." },
  { value: 'burn', label: 'Burn', hint: 'The text comes in overexposed and cools down.' },
  { value: 'fade', label: 'Fade', hint: 'The text fades in. No flash.' }
]

export const SPEEDS: { value: Speed; label: string }[] = [
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' }
]

const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback)

/** Cleans settings read from storage: anything missing or unknown falls back to the default. */
export function parseSettings(value: unknown): Settings {
  const o = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>
  const d = DEFAULT_SETTINGS
  return {
    animations: bool(o.animations, d.animations),
    rollStyle: oneOf(o.rollStyle, ['ratchet', 'glitch', 'plain'], d.rollStyle),
    verdictStyle: oneOf(o.verdictStyle, ['flash', 'fade', 'burn'], d.verdictStyle),
    speed: oneOf(o.speed, ['slow', 'normal', 'fast'], d.speed),
    grain: bool(o.grain, d.grain),
    vignette: bool(o.vignette, d.vignette),
    shake: bool(o.shake, d.shake),
    respectReducedMotion: bool(o.respectReducedMotion, d.respectReducedMotion)
  }
}
