import { describe, expect, it } from 'vitest'
import { advance, bannerLevel, faceAt, firstRollBeats, glitchValue, jolt, makeDrum, revealText, secondRollBeats, tickStep, verdictBeats } from './show'

describe('the drum', () => {
  const drum = makeDrum(2500)

  it('slows down: every gap is longer than the one before', () => {
    const gaps = drum.ticks.map((t, i) => t - (drum.ticks[i - 1] ?? 0))
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThan(gaps[i - 1])
    expect(drum.ticks.length).toBeGreaterThan(12)
    expect(drum.landed).toBeLessThanOrEqual(2500)
  })

  it('stops on the result, whatever the seed', () => {
    for (const seed of [1, 42, 1759500000000]) {
      const face = faceAt(drum.landed + 2000, drum, 73, 100, seed)
      expect(face).toMatchObject({ value: 73, landed: true })
      expect(Math.abs(face.offset)).toBeLessThan(0.001)
    }
  })

  it('shows only faces of the die while spinning, and never the same one twice in a row', () => {
    let previous = -1
    for (const tick of drum.ticks.slice(0, -1)) {
      const { value, landed } = faceAt(tick + 1, drum, 73, 100, 42)
      expect(landed).toBe(false)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(100)
      expect(value).not.toBe(previous)
      previous = value
    }
  })

  it('draws the same frame for the same time and seed', () => {
    expect(faceAt(800, drum, 73, 100, 7)).toEqual(faceAt(800, drum, 73, 100, 7))
    expect(jolt(drum.landed + 100, drum.landed, 7)).toEqual(jolt(drum.landed + 100, drum.landed, 7))
  })

  it('has a click that overshoots and then rests', () => {
    expect(tickStep(-10)).toBe(0)
    expect(Math.max(...[60, 80, 100, 120].map(tickStep))).toBeGreaterThan(1)
    expect(tickStep(2000)).toBeCloseTo(1, 5)
  })

  it('stops shaking a little after it lands', () => {
    expect(jolt(drum.landed - 1, drum.landed, 7)).toEqual([0, 0])
    expect(jolt(drum.landed + 700, drum.landed, 7)).toEqual([0, 0])
  })
})

describe('the title', () => {
  const title = 'The Sound of the Cosmos'

  it('is empty before its start and whole at its end', () => {
    expect(revealText(title, 0, 100, 1500, 3)).toBe('')
    expect(revealText(title, 1600, 100, 1500, 3)).toBe(title)
  })

  it('keeps its length and its spaces while it is noise', () => {
    const mid = revealText(title, 500, 100, 1500, 3)
    expect([...mid]).toHaveLength([...title].length)
    expect([...mid].map((c, i) => (c === ' ' ? i : -1)).filter((i) => i >= 0)).toEqual([3, 9, 12, 16])
    expect(mid).not.toBe(title)
  })

  it('never unlocks a letter once it has locked', () => {
    let locked = 0
    for (let t = 100; t <= 1600; t += 50) {
      const now = [...revealText(title, t, 100, 1500, 3)].filter((c, i) => c === [...title][i]).length
      expect(now).toBeGreaterThanOrEqual(locked - 1) // a junk glyph can match by chance for one frame
      locked = Math.max(locked, now)
    }
    expect(locked).toBe([...title].length)
  })
})

describe('the beats', () => {
  it('run in order', () => {
    for (const b of [firstRollBeats(), firstRollBeats(0.6), firstRollBeats(1.5)]) {
      expect(b.drum.landed).toBeLessThan(b.titleStart)
      expect(b.titleStart).toBeLessThan(b.titleEnd)
      expect(b.titleEnd).toBeLessThan(b.textStart)
      expect(b.textEnd).toBeLessThanOrEqual(b.done)
    }
    const s = secondRollBeats()
    expect(s.drum.landed).toBeLessThan(s.textStart)
    expect(s.drum.landed).toBeLessThan(firstRollBeats().drum.landed)
  })
})

describe('the other roll styles', () => {
  it('plain: no spin, the number is there almost at once and the rest follows sooner', () => {
    const plain = firstRollBeats(1, true)
    expect(plain.drum.ticks).toHaveLength(1)
    expect(plain.drum.landed).toBeLessThan(500)
    expect(plain.done).toBeLessThan(firstRollBeats(1).done)
  })

  it('glitch: noise inside the die until it lands, then the result', () => {
    for (let t = 0; t < 2000; t += 90) {
      const v = glitchValue(t, 2000, 73, 100, 9)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(100)
    }
    expect(glitchValue(2000, 2000, 73, 100, 9)).toBe(73)
    expect(glitchValue(500, 2000, 73, 100, 9)).toBe(glitchValue(500, 2000, 73, 100, 9))
  })

  it('speed stretches and shrinks every beat', () => {
    expect(firstRollBeats(1.5).done).toBeGreaterThan(firstRollBeats(1).done)
    expect(firstRollBeats(0.6).done).toBeLessThan(firstRollBeats(1).done)
  })
})

describe('the verdict', () => {
  it('holds the text back until the banner leaves, with or without a second roll', () => {
    for (const second of [true, false]) {
      const b = verdictBeats(second)
      expect(b.banner.start).toBeGreaterThan(second ? b.drum.landed : b.titleEnd)
      expect(b.textStart).toBeGreaterThan(b.banner.release)
      expect(b.done).toBeGreaterThan(b.textEnd)
    }
  })

  it('brings the banner in, holds it and takes it away', () => {
    const { banner } = verdictBeats(true)
    expect(bannerLevel(banner.start - 1, banner)).toBe(0)
    expect(bannerLevel((banner.held + banner.release) / 2, banner)).toBe(1)
    expect(bannerLevel(banner.end + 1, banner)).toBe(0)
  })
})

describe('the clock of the show', () => {
  it('runs frame by frame and stands still while the window is hidden', () => {
    expect(advance(1000, 16)).toBe(1016)
    expect(advance(1000, 30000)).toBe(1000)
    expect(advance(1000, -5)).toBe(1000)
  })
})
