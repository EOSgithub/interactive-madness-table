import { describe, expect, it } from 'vitest'
import source from '../../source/follie.it.json'
import { DEFAULT_SETS, defaultFor } from '../content/defaults'
import defaults from '../content/defaults.en.json'
import { checkCategory, checkCoverage, checkTableSet, findEntry, findOutcome, rollDie } from './tables'
import { THEMES } from './themes'
import type { Category, TableSet } from './types'

const rows = (...ranges: [number, number][]) => ranges.map((range) => ({ range }))

describe('checkCoverage', () => {
  it('accepts ranges that cover the die exactly once', () => {
    expect(checkCoverage(rows([1, 2], [3, 7], [8, 10]), 10)).toEqual([])
  })

  it('accepts rows given out of order', () => {
    expect(checkCoverage(rows([8, 10], [1, 2], [3, 7]), 10)).toEqual([])
  })

  it('reports a gap in the middle', () => {
    const p = checkCoverage(rows([1, 2], [5, 10]), 10)
    expect(p.map((x) => x.kind)).toEqual(['gap'])
    expect(p[0].message).toContain('3-4')
  })

  it('reports a gap at the end', () => {
    expect(checkCoverage(rows([1, 9]), 10)[0]).toMatchObject({ kind: 'gap', message: 'Nothing covers 10.' })
  })

  it('reports an overlap', () => {
    expect(checkCoverage(rows([1, 5], [5, 10]), 10).map((x) => x.kind)).toEqual(['overlap'])
  })

  it('reports a range outside the die', () => {
    expect(checkCoverage(rows([1, 12]), 10).map((x) => x.kind)).toEqual(['out-of-bounds'])
  })

  it('reports a reversed range', () => {
    expect(checkCoverage(rows([7, 3]), 10).map((x) => x.kind)).toEqual(['invalid'])
  })

  it('reports an empty table', () => {
    expect(checkCoverage([], 100).map((x) => x.kind)).toEqual(['empty'])
  })
})

describe('lookups', () => {
  const category: Category = {
    id: 'c',
    label: 'Test',
    blurb: '',
    duration: { kind: 'fixed', text: 'From now on:' },
    die: 100,
    subRoll: true,
    subDie: 10,
    entries: [
      {
        id: 'a',
        range: [1, 50],
        title: 'A',
        description: '',
        outcomes: [
          { id: 'a1', range: [1, 2], kind: 'boon', text: 'good' },
          { id: 'a2', range: [3, 10], kind: 'bane', text: 'bad' }
        ]
      },
      { id: 'b', range: [51, 100], title: 'B', description: '', outcomes: [] }
    ]
  }

  it('finds the entry a roll lands on, at both ends of its range', () => {
    expect(findEntry(category, 1)?.id).toBe('a')
    expect(findEntry(category, 50)?.id).toBe('a')
    expect(findEntry(category, 51)?.id).toBe('b')
    expect(findEntry(category, 100)?.id).toBe('b')
  })

  it('finds the outcome of the second roll', () => {
    expect(findOutcome(category.entries[0], 2)?.kind).toBe('boon')
    expect(findOutcome(category.entries[0], 3)?.kind).toBe('bane')
  })

  it('points at the entry whose outcomes are broken', () => {
    const problems = checkCategory(category)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toMatchObject({ categoryId: 'c', entryId: 'b', kind: 'empty' })
  })

  it('ignores outcomes when the second roll is off', () => {
    expect(checkCategory({ ...category, subRoll: false })).toEqual([])
  })
})

describe('rollDie', () => {
  it('stays inside 1..sides at the extremes of the random source', () => {
    expect(rollDie(100, () => 0)).toBe(1)
    expect(rollDie(100, () => 0.999999)).toBe(100)
    expect(rollDie(10, () => 0.5)).toBe(6)
  })
})

describe('the tables converted from Follie', () => {
  const set = source as TableSet

  it('has the three categories and the 40 entries of the original', () => {
    expect(set.categories.map((c) => c.id)).toEqual(['short-term', 'long-term', 'indefinite'])
    expect(set.categories.reduce((n, c) => n + c.entries.length, 0)).toBe(40)
  })

  it('can be rolled on: every die is covered exactly once', () => {
    expect(checkTableSet(set)).toEqual([])
  })
})

describe('the default tables the app ships with', () => {
  const set = defaults as TableSet
  const original = source as TableSet

  it('can be rolled on', () => {
    expect(checkTableSet(set)).toEqual([])
  })

  it('keeps the shape of the original: same entries, same ranges, same kinds', () => {
    const shape = (t: TableSet) => t.categories.map((c) => c.entries.map((e) => [e.range, e.outcomes.map((o) => [o.range, o.kind])]))
    expect(shape(set)).toEqual(shape(original))
  })

  it('has text everywhere and no long dashes', () => {
    for (const c of set.categories) {
      for (const e of c.entries) {
        expect(e.title.length).toBeGreaterThan(3)
        expect(e.description.length).toBeGreaterThan(10)
        for (const o of e.outcomes) expect(o.text.length).toBeGreaterThan(10)
      }
    }
    expect(JSON.stringify(set)).not.toMatch(/[\u2013\u2014]/)
  })
})

describe('the default sets of the themes', () => {
  it('has one set for each theme, each under its own name', () => {
    expect(DEFAULT_SETS.map((s) => s.theme).sort()).toEqual(THEMES.map((t) => t.id).sort())
    expect(new Set(DEFAULT_SETS.map((s) => s.name)).size).toBe(DEFAULT_SETS.length)
    for (const t of THEMES) expect(defaultFor(t.id).theme).toBe(t.id)
  })

  it('can be rolled on, all of them', () => {
    for (const s of DEFAULT_SETS) expect(checkTableSet(s)).toEqual([])
  })

  it('gives every entry of a one-roll table its effect, with no long dashes', () => {
    for (const s of DEFAULT_SETS.filter((x) => x.theme !== 'gothic')) {
      for (const c of s.categories) {
        expect(c.subRoll).toBe(false)
        for (const e of c.entries) {
          expect(e.title.length).toBeGreaterThan(3)
          expect(e.description.length).toBeGreaterThan(10)
          expect(e.text?.length).toBeGreaterThan(10)
        }
      }
      expect(JSON.stringify(s)).not.toMatch(/[\u2013\u2014]/)
    }
  })

  it('calls no god by name in the Hellenic set', () => {
    expect(JSON.stringify(defaultFor('hellenic'))).not.toMatch(/Athena|Hera\b|Apollo|Zeus|Dionysus|Lyssa|Poseidon|Artemis|Aphrodite|Hermes|Ares\b|Hades/)
  })

  it('never fixes a DC: the GM sets it. The D&D set keeps the official text, DC included', () => {
    expect(JSON.stringify(DEFAULT_SETS.filter((s) => s.theme !== 'dnd'))).not.toMatch(/\bDC \d/)
  })

  it('gives the D&D set the three official tables', () => {
    const set = defaultFor('dnd')
    expect(set.categories.map((c) => c.entries.length)).toEqual([10, 12, 12])
    expect(JSON.stringify(set)).toContain('DC 15 Wisdom saving throw')
  })
})
