import { describe, expect, it } from 'vitest'
import source from '../../source/follie.it.json'
import { checkCategory, checkCoverage, checkTableSet, findEntry, findOutcome, rollDie } from './tables'
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
