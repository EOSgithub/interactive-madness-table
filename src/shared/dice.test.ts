import { describe, expect, it } from 'vitest'
import { fairRoll } from './dice'

const script = (...values: number[]) => {
  let i = 0
  return () => values[i++]
}

describe('fairRoll', () => {
  it('maps the lowest and highest accepted draws to the first and last face', () => {
    expect(fairRoll(100, script(0))).toBe(1)
    expect(fairRoll(100, script(99))).toBe(100)
    expect(fairRoll(10, script(4294967289))).toBe(10) // 2^32 - 7: the last draw below the cut-off for a d10
  })

  it('throws a draw above the largest multiple away and draws again', () => {
    // 2^32 = 4294967296 and 4294967296 % 100 = 96, so 4294967200 and above are rejected.
    expect(fairRoll(100, script(4294967200, 4294967295, 41))).toBe(42)
  })

  it('keeps every face in range with the real random source', () => {
    for (let i = 0; i < 2000; i++) {
      const n = fairRoll(100)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(100)
    }
  })

  it('refuses a die with no sides', () => {
    expect(() => fairRoll(0)).toThrow(RangeError)
  })
})
