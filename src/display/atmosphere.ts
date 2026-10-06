import type { ThemeId } from '../shared/themes'
import type { OutcomeKind } from '../shared/types'
import { clamp, rand, smooth } from './show'

// The air of the player screen, painted on a canvas over the stage. Each theme
// has its own: something that drifts all the time, something that happens on a
// bane, and rings of light on a boon.
//
//   Gothic    ash rising, and blood running down the glass
//   Cosmic    stars turning slowly, then pulled toward the centre
//   Surreal   coloured bubbles, and ink that runs up from the floor
//   Occult    embers, and fire along the bottom edge
//   Societal  paper dust falling under a scan line, and bars of redaction
//   Hellenic  gold dust settling, and wine running down the glass
//
// Like show.ts it keeps no state between frames. Every mote and every drip is
// worked out from the time and a seed, so the DM's monitor and the player screen
// paint the same picture.

export interface Air {
  theme: ThemeId
  /** The seed of the current show: where the drips fall. */
  seed: number
  /** The kind of verdict on screen, or null when there is none. */
  kind: OutcomeKind | null
  /** Ms since the verdict was named, or -1 before it. */
  since: number
  /** A slow device gets fewer motes and drips. */
  lite: boolean
}

type Rgb = readonly [number, number, number]
type Ctx = CanvasRenderingContext2D

const TAU = Math.PI * 2
const frac = (x: number) => x - Math.floor(x)
const rgba = ([r, g, b]: Rgb, a: number) => `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`
const mix = (a: Rgb, b: Rgb, u: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * u),
  Math.round(a[1] + (b[1] - a[1]) * u),
  Math.round(a[2] + (b[2] - a[2]) * u)
]

/** How far into a bane the air is: 0 before it, 1 once it has taken hold. */
const baneLevel = (air: Air, over: number) => (air.kind === 'bane' ? smooth(0, over, air.since) : 0)

interface Motes {
  /** How many, on a slow device and on a fast one. */
  count: readonly [number, number]
  /** The colours they come in. */
  colours: readonly Rgb[]
  /** What they all turn to on a bane. */
  bane: Rgb
  /** 1 rises, -1 falls. */
  rise: 1 | -1
  /** The shortest crossing of the screen in ms, and how much longer the slowest takes. */
  period: readonly [number, number]
  /** The smallest radius, and how much bigger the biggest is. */
  size: readonly [number, number]
  /** How strong the faintest is, and how much stronger the strongest. */
  alpha: readonly [number, number]
  /** How far they wander sideways, as a share of the width. */
  sway: number
  /** Square specks instead of round ones. */
  square?: boolean
  /** They gutter like sparks. */
  flicker?: boolean
}

/** Small things crossing the screen: each loops on its own period, swaying as it goes. */
function motes(ctx: Ctx, w: number, h: number, now: number, air: Air, unit: number, m: Motes) {
  const count = air.lite ? m.count[0] : m.count[1]
  const turned = baneLevel(air, 1200)
  for (let i = 0; i < count; i++) {
    const period = m.period[0] + rand(i, 1) * m.period[1]
    const phase = frac(now / period + rand(i, 2))
    const x = (rand(i, 3) + m.sway * Math.sin(phase * TAU * 2 + i)) * w
    const y = m.rise === 1 ? h * (1.06 - phase * 1.18) : h * (-0.06 + phase * 1.18)
    const size = (m.size[0] + rand(i, 4) * m.size[1]) * unit
    const spark = m.flicker ? 0.55 + 0.45 * Math.sin(now / (70 + 60 * rand(i, 6)) + i) : 1
    const alpha = Math.sin(phase * Math.PI) * (m.alpha[0] + m.alpha[1] * rand(i, 5)) * spark
    ctx.fillStyle = rgba(mix(m.colours[i % m.colours.length], m.bane, turned), alpha)
    if (m.square) {
      ctx.fillRect(x - size, y - size * 0.6, size * 2, size * 1.2)
    } else {
      ctx.beginPath()
      ctx.arc(x, y, size, 0, TAU)
      ctx.fill()
    }
  }
}

/** Something running down from the top edge: each drip starts late, runs fast and slows to a stop. */
function drips(ctx: Ctx, w: number, h: number, air: Air, unit: number, dark: Rgb, bright: Rgb) {
  const pool = ctx.createLinearGradient(0, 0, 0, h * 0.16)
  const level = smooth(0, 1400, air.since)
  pool.addColorStop(0, rgba(dark, 0.55 * level))
  pool.addColorStop(1, rgba(dark, 0))
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
    trail.addColorStop(0, rgba(dark, 0.75))
    trail.addColorStop(1, rgba(bright, 0.9))
    ctx.fillStyle = trail
    ctx.fillRect(x - width / 2, 0, width, y)
    ctx.beginPath()
    ctx.arc(x, y, width * 0.85, 0, TAU)
    ctx.fill()
  }
}

/** Light on a boon: a shaft through the middle and rings that open and fade. */
function light(ctx: Ctx, w: number, h: number, air: Air, unit: number, colour: Rgb) {
  const s = air.since / 1000
  const shaft = ctx.createLinearGradient(w * 0.3, 0, w * 0.7, 0)
  const glow = 0.05 * smooth(0, 800, air.since) + 0.2 * Math.exp(-0.9 * s)
  shaft.addColorStop(0, rgba(colour, 0))
  shaft.addColorStop(0.5, rgba(colour, glow))
  shaft.addColorStop(1, rgba(colour, 0))
  ctx.fillStyle = shaft
  ctx.fillRect(w * 0.3, 0, w * 0.4, h)

  ctx.lineWidth = 1.2 * unit
  for (let i = 0; i < 3; i++) {
    const u = s - i * 0.28
    if (u <= 0) continue
    const radius = (0.08 + 0.55 * (1 - Math.exp(-1.3 * u))) * Math.min(w, h)
    ctx.strokeStyle = rgba(colour, 0.42 * Math.exp(-1.5 * u))
    ctx.beginPath()
    ctx.arc(w / 2, h * 0.42, radius, 0, TAU)
    ctx.stroke()
  }
}

/**
 * Stars: fixed points that twinkle and turn slowly about the middle of the
 * screen. On a bane something pulls at them, and each one is drawn out into a
 * streak that points at the centre.
 */
function stars(ctx: Ctx, w: number, h: number, now: number, air: Air, unit: number) {
  const count = air.lite ? 60 : 150
  const pull = baneLevel(air, 1800)
  const cx = w / 2
  const cy = h * 0.42
  const reach = Math.hypot(w, h) * 0.62
  const turn = (now / 400000) * TAU
  const pale: Rgb = [214, 226, 255]
  const wrong: Rgb = [210, 148, 245]
  ctx.lineCap = 'round'
  for (let i = 0; i < count; i++) {
    // The square root spreads them evenly over the disc instead of crowding the middle.
    const far = Math.sqrt(rand(i, 11)) * reach
    const angle = rand(i, 12) * TAU + turn * (0.4 + 0.6 * rand(i, 13))
    const x = cx + Math.cos(angle) * far
    const y = cy + Math.sin(angle) * far
    if (x < -20 || x > w + 20 || y < -20 || y > h + 20) continue
    const twinkle = 0.55 + 0.45 * Math.sin(now / (600 + 1900 * rand(i, 14)) + i)
    const size = (0.4 + 1.3 * rand(i, 15) * rand(i, 16)) * unit
    const colour = mix(pale, wrong, pull)
    const alpha = (0.25 + 0.6 * rand(i, 17)) * twinkle
    if (pull > 0.01) {
      const length = pull * (0.05 + 0.16 * rand(i, 18)) * far
      ctx.strokeStyle = rgba(colour, alpha * 0.8)
      ctx.lineWidth = size * 1.4
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x - Math.cos(angle) * length, y - Math.sin(angle) * length)
      ctx.stroke()
    }
    ctx.fillStyle = rgba(colour, alpha)
    ctx.beginPath()
    ctx.arc(x, y, size, 0, TAU)
    ctx.fill()
  }
}

/** Fire along the bottom edge: a glow, and tongues that rise and gutter out of step with each other. */
function fire(ctx: Ctx, w: number, h: number, now: number, air: Air, unit: number) {
  const level = smooth(0, 1300, air.since)
  const glow = ctx.createLinearGradient(0, h, 0, h * 0.55)
  glow.addColorStop(0, rgba([210, 40, 30], 0.5 * level))
  glow.addColorStop(1, rgba([210, 40, 30], 0))
  ctx.fillStyle = glow
  ctx.fillRect(0, h * 0.55, w, h * 0.45)

  ctx.globalCompositeOperation = 'lighter'
  const count = air.lite ? 9 : 20
  for (let i = 0; i < count; i++) {
    // Like the drips, the tongues keep to the sides, clear of the text.
    const side = rand(air.seed, i + 200)
    const x = (side < 0.5 ? side * 0.6 : 0.7 + (side - 0.5) * 0.6) * w
    const breath = 0.72 + 0.28 * Math.sin(now / (170 + 220 * rand(i, 21)) + i * 1.7)
    const tall = (0.12 + 0.3 * rand(air.seed, i + 240)) * h * level * breath
    const wide = (30 + 70 * rand(i, 22)) * unit
    if (tall < 1) continue
    // A round glow stretched upward: bright at the root, gone at the tip and at the sides.
    ctx.save()
    ctx.translate(x + Math.sin(now / 300 + i) * 4 * unit, h)
    ctx.scale(wide / tall, 1)
    const flame = ctx.createRadialGradient(0, 0, 0, 0, 0, tall)
    flame.addColorStop(0, rgba([255, 150, 60], 0.34))
    flame.addColorStop(0.45, rgba([230, 70, 30], 0.14))
    flame.addColorStop(1, rgba([200, 30, 30], 0))
    ctx.fillStyle = flame
    ctx.beginPath()
    ctx.arc(0, 0, tall, Math.PI, TAU)
    ctx.fill()
    ctx.restore()
  }
  ctx.globalCompositeOperation = 'source-over'
}

/** A band of light that travels down the screen, as on a monitor filmed by a camera. */
function scanLine(ctx: Ctx, w: number, h: number, now: number) {
  const tall = h * 0.16
  const y = frac(now / 7000) * (h + tall) - tall
  const band = ctx.createLinearGradient(0, y, 0, y + tall)
  band.addColorStop(0, 'rgba(225, 235, 230, 0)')
  band.addColorStop(0.5, 'rgba(225, 235, 230, 0.05)')
  band.addColorStop(1, 'rgba(225, 235, 230, 0)')
  ctx.fillStyle = band
  ctx.fillRect(0, y, w, tall)
}

/** Redaction: black bars struck across the sides of the screen, one after another. */
function bars(ctx: Ctx, w: number, h: number, air: Air, unit: number) {
  const count = air.lite ? 6 : 11
  for (let i = 0; i < count; i++) {
    const s = air.since - i * 130 - rand(air.seed, i + 300) * 90
    if (s <= 0) continue
    const long = (0.12 + 0.2 * rand(air.seed, i + 310)) * w * smooth(0, 110, s)
    const tall = (11 + 13 * rand(air.seed, i + 320)) * unit
    const y = (0.06 + 0.88 * rand(air.seed, i + 330)) * h
    // Like the drips, the bars keep to the sides.
    const left = i % 2 === 0
    const inset = rand(air.seed, i + 340) * 0.07 * w
    const x = left ? inset : w - inset - long
    ctx.fillStyle = 'rgba(4, 5, 5, 0.94)'
    ctx.fillRect(x, y, long, tall)
    ctx.fillStyle = rgba([207, 47, 39], 0.75)
    ctx.fillRect(x, y + tall, long, Math.max(1, 1.5 * unit))
  }
}

/** Runs `draw` upside down, so what falls from the top rises from the bottom. */
function flipped(ctx: Ctx, h: number, draw: () => void) {
  ctx.save()
  ctx.translate(0, h)
  ctx.scale(1, -1)
  draw()
  ctx.restore()
}

const ASH: Motes = {
  count: [26, 64],
  colours: [[216, 206, 192]],
  // On a bane the ash catches the colour of the moon.
  bane: [214, 58, 70],
  rise: 1,
  period: [9000, 11000],
  size: [0.5, 1.7],
  alpha: [0.1, 0.32],
  sway: 0.05
}

const BUBBLES: Motes = {
  count: [12, 26],
  colours: [
    [255, 190, 210],
    [170, 140, 240],
    [255, 220, 170],
    [120, 220, 210]
  ],
  bane: [98, 227, 212],
  rise: 1,
  period: [16000, 18000],
  size: [3, 15],
  alpha: [0.04, 0.12],
  sway: 0.09
}

const EMBERS: Motes = {
  count: [24, 60],
  colours: [
    [255, 170, 80],
    [255, 120, 50]
  ],
  bane: [255, 70, 60],
  rise: 1,
  period: [4500, 6500],
  size: [0.5, 1.4],
  alpha: [0.25, 0.55],
  sway: 0.03,
  flicker: true
}

const PAPER: Motes = {
  count: [18, 44],
  colours: [[205, 210, 205]],
  bane: [207, 47, 39],
  rise: -1,
  period: [12000, 14000],
  size: [0.6, 1.5],
  alpha: [0.08, 0.22],
  sway: 0.012,
  square: true
}

const DUST: Motes = {
  count: [20, 50],
  colours: [
    [217, 197, 106],
    [240, 154, 108]
  ],
  bane: [224, 127, 192],
  rise: -1,
  period: [14000, 12000],
  size: [0.5, 1.4],
  alpha: [0.1, 0.3],
  sway: 0.03
}

/** The colour of the light on a boon. */
const BOON: Record<ThemeId, Rgb> = {
  gothic: [232, 204, 150],
  cosmic: [168, 239, 225],
  surreal: [255, 220, 174],
  occult: [207, 188, 255],
  societal: [150, 214, 166],
  hellenic: [217, 197, 106]
}

/** Paints one frame. `now` is any steady clock in ms; `w` and `h` are in CSS px. */
export function paint(ctx: Ctx, w: number, h: number, now: number, air: Air): void {
  ctx.clearRect(0, 0, w, h)
  const unit = clamp(w / 1280, 0.45, 2.2)
  const named = air.since >= 0
  const bane = named && air.kind === 'bane'
  if (named && air.kind === 'boon') light(ctx, w, h, air, unit, BOON[air.theme])

  switch (air.theme) {
    case 'cosmic':
      stars(ctx, w, h, now, air, unit)
      break
    case 'surreal':
      motes(ctx, w, h, now, air, unit, BUBBLES)
      if (bane) flipped(ctx, h, () => drips(ctx, w, h, air, unit, [13, 92, 88], [47, 185, 170]))
      break
    case 'occult':
      motes(ctx, w, h, now, air, unit, EMBERS)
      if (bane) fire(ctx, w, h, now, air, unit)
      break
    case 'societal':
      motes(ctx, w, h, now, air, unit, PAPER)
      scanLine(ctx, w, h, now)
      if (bane) bars(ctx, w, h, air, unit)
      break
    case 'hellenic':
      motes(ctx, w, h, now, air, unit, DUST)
      if (bane) drips(ctx, w, h, air, unit, [90, 24, 68], [142, 42, 107])
      break
    default:
      motes(ctx, w, h, now, air, unit, ASH)
      if (bane) drips(ctx, w, h, air, unit, [122, 16, 30], [158, 24, 42])
  }
}
