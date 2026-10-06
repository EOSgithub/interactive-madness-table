import { describe, expect, it } from 'vitest'
import source from '../../source/follie.it.json'
import { defaultFor } from '../content/defaults'
import { toDisplayState, type DisplaySource } from './display'
import { DEFAULT_SETTINGS, parseSettings } from './settings'
import type { TableSet } from './types'

const tables = source as TableSet
const idle: DisplaySource = {
  tables,
  settings: DEFAULT_SETTINGS,
  preview: null,
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

  it('sends the theme of the set, Gothic when it has none', () => {
    expect(toDisplayState(idle).theme).toBe('gothic')
    expect(toDisplayState({ ...idle, tables: { ...tables, theme: 'occult' } }).theme).toBe('occult')
  })

  it('names the category once it is chosen, and the entry once the first roll lands', () => {
    const chosen = toDisplayState({ ...idle, step: 'first', categoryId: 'short-term' })
    expect(chosen.category).toMatchObject({ die: 100, subDie: 10, subRoll: true })
    expect(chosen.entry).toBeNull()

    const rolled = toDisplayState({ ...idle, step: 'second', categoryId: 'short-term', first: 15 })
    expect(rolled.entry?.title).toBe(tables.categories[0].entries[1].title)
  })

  it('carries the verdict and the step time through', () => {
    const verdict = { kind: 'bane' as const, text: 'x', duration: 'From now on:' }
    const s = toDisplayState({ ...idle, step: 'verdict', categoryId: 'indefinite', first: 3, second: 9, verdict })
    expect(s).toMatchObject({ stepAt: 1000, second: 9, verdict })
  })

  it('never includes the tables themselves', () => {
    const s = toDisplayState({ ...idle, step: 'second', categoryId: 'short-term', first: 15 })
    expect(JSON.stringify(s)).not.toContain('outcomes')
    expect(JSON.stringify(s).length).toBeLessThan(900)
  })
})

describe('previews from Settings', () => {
  it('plays a made-up first roll without touching the real one', () => {
    const s = toDisplayState({ ...idle, preview: { part: 'roll', at: 5000 } })
    expect(s).toMatchObject({ preview: true, step: 'second', stepAt: 5000, second: null, verdict: null })
    expect(s.entry?.title).toBe(tables.categories[0].entries[0].title)
  })

  it('plays a made-up verdict, a bane when the entry has one', () => {
    const s = toDisplayState({ ...idle, preview: { part: 'verdict', at: 5000 } })
    expect(s).toMatchObject({ preview: true, step: 'verdict' })
    expect(s.verdict?.kind).toBe('bane')
    expect(s.second).not.toBeNull()
  })

  it('plays the effect of the entry itself on a table with no second roll', () => {
    const cosmic = defaultFor('cosmic')
    const s = toDisplayState({ ...idle, tables: cosmic, preview: { part: 'verdict', at: 5000 } })
    expect(s).toMatchObject({ theme: 'cosmic', step: 'verdict', second: null })
    expect(s.verdict).toMatchObject({ kind: null, text: cosmic.categories[0].entries[0].text })
  })
})

describe('parseSettings', () => {
  it('returns the defaults for nothing, or for rubbish', () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('x')).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps what is valid and replaces what is not', () => {
    const s = parseSettings({ rollStyle: 'glitch', speed: 'warp', grain: false, shake: 'yes' })
    expect(s).toMatchObject({ rollStyle: 'glitch', speed: 'normal', grain: false, shake: true })
  })
})
