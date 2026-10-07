import { describe, expect, it } from 'vitest'
import source from '../../source/follie.it.json'
import { exportTableSet, parseTableSet, readTableSet, spreadRanges } from './io'
import { checkCoverage } from './tables'
import type { TableSet } from './types'

describe('export and import', () => {
  it('round-trips the default tables unchanged', () => {
    const tables: TableSet = { ...(source as TableSet), theme: 'surreal' }
    const back = readTableSet(exportTableSet(tables))
    expect(back).toEqual({ ok: true, tables })
  })

  it('gives a file with no theme, or an unknown one, the Gothic theme', () => {
    const none = parseTableSet(source)
    const odd = parseTableSet({ ...source, theme: 'vaporwave' })
    expect(none.ok && none.tables.theme).toBe('gothic')
    expect(odd.ok && odd.tables.theme).toBe('gothic')
  })

  it('accepts a bare table set, without the export wrapper', () => {
    expect(parseTableSet(source).ok).toBe(true)
  })

  it('fills in what a hand-written file leaves out', () => {
    const r = parseTableSet({ categories: [{ label: 'Mine', entries: [{ range: [1, 100], title: 'One' }] }] })
    if (!r.ok) throw new Error(r.error)
    const c = r.tables.categories[0]
    expect(r.tables.name).toBe('Untitled tables')
    expect(c).toMatchObject({ die: 100, subDie: 10, subRoll: false, blurb: '' })
    expect(c.id).toBeTruthy()
    expect(c.entries[0]).toMatchObject({ title: 'One', description: '', outcomes: [] })
  })

  it("keeps a table's own banner words and drops the empty ones", () => {
    const entries = [{ range: [1, 100], title: 'One' }]
    const r = parseTableSet({ categories: [{ label: 'Mine', banner: { plain: 'Doomed', bane: '', odd: 'x' }, entries }, { label: 'Other', banner: {}, entries }] })
    if (!r.ok) throw new Error(r.error)
    expect(r.tables.categories[0].banner).toEqual({ plain: 'Doomed' })
    expect(r.tables.categories[1].banner).toBeUndefined()
  })
})

describe('faults in an imported file', () => {
  it('says so when the file is not JSON', () => {
    expect(readTableSet('not json')).toEqual({ ok: false, error: 'This is not a JSON file.' })
  })

  it('names the field that is wrong', () => {
    const bad = { categories: [{ label: 'A', entries: [{ range: [1, 'x'], title: 'T' }] }] }
    expect(parseTableSet(bad)).toEqual({
      ok: false,
      error: 'categories[0].entries[0].range[1] should be a whole number from 1 to 1000.'
    })
  })

  it('refuses an unknown outcome kind', () => {
    const bad = {
      categories: [{ label: 'A', entries: [{ range: [1, 100], title: 'T', outcomes: [{ range: [1, 10], kind: 'lucky' }] }] }]
    }
    const r = parseTableSet(bad)
    expect(r.ok).toBe(false)
    expect(!r.ok && r.error).toContain('boon, neutral or bane')
  })

  it('refuses a file with no categories, and things that are not objects', () => {
    expect(parseTableSet({ categories: [] }).ok).toBe(false)
    expect(parseTableSet([1, 2]).ok).toBe(false)
    expect(parseTableSet(null).ok).toBe(false)
  })
})

describe('spreadRanges', () => {
  it('splits a die evenly', () => {
    expect(spreadRanges(10, 100)[0]).toEqual([1, 10])
    expect(spreadRanges(10, 100)[9]).toEqual([91, 100])
  })

  it('gives the extra faces to the first rows', () => {
    expect(spreadRanges(3, 10)).toEqual([
      [1, 4],
      [5, 7],
      [8, 10]
    ])
  })

  it('always covers the die exactly once', () => {
    for (const [count, sides] of [[1, 100], [7, 100], [11, 100], [3, 10], [10, 10], [6, 20]]) {
      expect(checkCoverage(spreadRanges(count, sides).map((range) => ({ range })), sides)).toEqual([])
    }
  })

  it('never makes more rows than the die has faces', () => {
    expect(spreadRanges(12, 10)).toHaveLength(10)
  })
})
