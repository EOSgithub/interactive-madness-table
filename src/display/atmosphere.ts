import type { OutcomeKind } from '../shared/types'
import { clamp, rand, smooth } from './show'

// The air of the player screen, painted on a canvas over the stage: ash that
// drifts up all the time, blood that runs down the glass on a bane, and rings of
// pale light on a boon. Like show.ts it keeps no state between frames. Every
// mote and every drip is worked out from the time and a seed, so the DM's
// monitor and the player screen paint the same picture.

export interface Air {
  /** The seed of the current show: where the drips fall. */
  seed: number
  /** The kind of verdict on screen, or null when there is none. */
  kind: OutcomeKind | null
  /** Ms since the verdict was named, or -1 before it. */
  since: number
  /** A slow device gets fewer motes and drips. */
  lite: boolean
}

const TAU = Math.PI * 2
const frac = (x: number) => x - Math.floor(x)

/** Ash rising: each mote loops on its own period, swaying as it goes. */
function ash(ctx: CanvasRenderingContext2D, w: number, h: number, now: number, air: Air, unit: number) {
  const count = air.lite ? 26 : 64
  // On a bane the ash catches the colour of the moon.
  const red = air.kind === 'bane' ? smooth(0, 1200, air.since) : 0
  const r = Math.round(196 + (214 - 196) * red)
  const g = Math.round(204 + (58 - 204) * red)
  const b = Math.round(212 + (70 - 212) * red)
  for (let i = 0; i < count; i++) {
    const period = 9000 + rand(i, 1) * 11000
    const phase = frac(now / period + rand(i, 2))
    const x = (rand(i, 3) + 0.05 * Math.sin(phase * TAU * 2 + i)) * w
    const y = h * (1.06 - phase * 1.18)
    const size = (0.5 + rand(i, 4) * 1.7) * unit
    const alpha = Math.sin(phase * Math.PI) * (0.1 + 0.32 * rand(i, 5))
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, TAU)
    ctx.fill()
  }
}

/** Blood running down from the top edge: each drip starts late, runs fast and slows to a stop. */
function blood(ctx: CanvasRenderingContext2D, w: number, h: number, air: Air, unit: number) {
  const pool = ctx.createLinearGradient(0, 0, 0, h * 0.16)
  const level = smooth(0, 1400, air.since)
  pool.addColorStop(0, `rgba(122, 16, 30, ${(0.55 * level).toFixed(3)})`)
  pool.addColorStop(1, 'rgba(122, 16, 30, 0)')
  ctx.fillStyle = pool
  ctx.fillRect(0, 0, w, h * 0.16)

  const count = air.lite ? 8 : 17
  for (let i = 0; i < count; i++) {
    const s = (air.since - rand(air.seed, i + 50) * 1100) / 1000
    if (s <= 0) continue
    // The drips keep to the sides: the middle of the screen is where the die and the text are read.
    const side = rand(air.seed, i)
    const x = (side < 0.5 ? 0.03 + side * 0.66 : 0.64 + (side - 0.5) * 0.66) * w
    const reach = (0.14 + 0.62 * rand(air.seed, i + 90)) * h
    const y = reach * (1 - Math.exp(-0.85 * s))
    const width = (1.4 + 3.6 * rand(air.seed, i + 130)) * unit
    const trail = ctx.createLinearGradient(0, 0, 0, y)
    trail.addColorStop(0, 'rgba(122, 16, 30, 0.75)')
    trail.addColorStop(1, 'rgba(158, 24, 42, 0.9)')
    ctx.fillStyle = trail
    ctx.fillRect(x - width / 2, 0, width, y)
    ctx.beginPath()
    ctx.arc(x, y, width * 0.85, 0, TAU)
    ctx.fill()
  }
}

/** Pale light on a boon: a shaft through the middle and rings that open and fade. */
function light(ctx: CanvasRenderingContext2D, w: number, h: number, air: Air, unit: number) {
  const s = air.since / 1000
  const shaft = ctx.createLinearGradient(w * 0.3, 0, w * 0.7, 0)
  const glow = 0.05 * smooth(0, 800, air.since) + 0.2 * Math.exp(-0.9 * s)
  shaft.addColorStop(0, 'rgba(190, 214, 232, 0)')
  shaft.addColorStop(0.5, `rgba(190, 214, 232, ${glow.toFixed(3)})`)
  shaft.addColorStop(1, 'rgba(190, 214, 232, 0)')
  ctx.fillStyle = shaft
  ctx.fillRect(w * 0.3, 0, w * 0.4, h)

  ctx.lineWidth = 1.2 * unit
  for (let i = 0; i < 3; i++) {
    const u = s - i * 0.28
    if (u <= 0) continue
    const radius = (0.08 + 0.55 * (1 - Math.exp(-1.3 * u))) * Math.min(w, h)
    ctx.strokeStyle = `rgba(190, 214, 232, ${(0.42 * Math.exp(-1.5 * u)).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(w / 2, h * 0.42, radius, 0, TAU)
    ctx.stroke()
  }
}

/** Paints one frame. `now` is any steady clock in ms; `w` and `h` are in CSS px. */
export function paint(ctx: CanvasRenderingContext2D, w: number, h: number, now: number, air: Air): void {
  ctx.clearRect(0, 0, w, h)
  const unit = clamp(w / 1280, 0.45, 2.2)
  if (air.since >= 0 && air.kind === 'boon') light(ctx, w, h, air, unit)
  ash(ctx, w, h, now, air, unit)
  if (air.since >= 0 && air.kind === 'bane') blood(ctx, w, h, air, unit)
}
