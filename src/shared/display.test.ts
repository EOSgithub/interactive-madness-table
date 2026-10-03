import { describe, expect, it } from 'vitest'
import source from '../../source/follie.it.json'
import { toDisplayState, type DisplaySource } from './display'
import type { TableSet } from './types'

const tables = source as TableSet
const idle: DisplaySource = {
  tables,
  blackout: false,
  step: 'category',
  stepAt: 1000,
  categoryId: null,
  first: null,
  second: null,
  verdict: null
}

describe('toDisplayState', () => {
  it('sends nothing about the roll while the DM is choosing', () => {
    expect(toDisplayState(idle)).toMatchObject({ setName: 'Follie', step: 'category', category: null, entry: null, verdict: null })
  })

  it('names the category once it is chosen, and the entry once the first roll lands', () => {
    const chosen = toDisplayState({ ...idle, step: 'first', categoryId: 'short-term' })
    expect(chosen.category).toMatchObject({ die: 100, subDie: 10, subRoll: true })
    expect(chosen.entry).toBeNull()

    const rolled = toDisplayState({ ...idle, step: 'second', categoryId: 'short-term', first: 15 })
    expect(rolled.entry?.title).toBe(tables.categories[0].entries[1].title)
  })

  it('carries the verdict, the blackout flag and the step time through', () => {
    const verdict = { kind: 'bane' as const, text: 'x', duration: 'From now on:' }
    const s = toDisplayState({ ...idle, step: 'verdict', categoryId: 'indefinite', first: 3, second: 9, verdict, blackout: true })
    expect(s).toMatchObject({ blackout: true, stepAt: 1000, second: 9, verdict })
  })

  it('never includes the tables themselves', () => {
    const s = toDisplayState({ ...idle, step: 'second', categoryId: 'short-term', first: 15 })
    expect(JSON.stringify(s)).not.toContain('outcomes')
    expect(JSON.stringify(s).length).toBeLessThan(600)
  })
})
