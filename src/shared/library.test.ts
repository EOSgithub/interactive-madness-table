import { describe, expect, it } from 'vitest'
import { activeSet, addSet, blankSet, countEntries, parseLibrary, removeSet, saveActive, switchTo, uniqueName, type Library } from './library'
import { checkTableSet } from './tables'
import type { TableSet } from './types'

const set = (name: string): TableSet => ({ ...blankSet(name) })
const one: Library = { sets: [{ id: 'a', tables: set('Madness Tables'), updatedAt: 1 }], activeId: 'a' }

describe('uniqueName', () => {
  it('leaves a free name alone and numbers a taken one', () => {
    expect(uniqueName('Dreams', ['Madness Tables'])).toBe('Dreams')
    expect(uniqueName('Madness Tables', ['Madness Tables'])).toBe('Madness Tables 2')
    expect(uniqueName('Madness Tables 2', ['Madness Tables', 'Madness Tables 2'])).toBe('Madness Tables 3')
    expect(uniqueName('  ', [])).toBe('Untitled tables')
  })
})

describe('the library', () => {
  it('adds a set, activates it and keeps names apart', () => {
    const lib = addSet(one, set('Madness Tables'), 5)
    expect(lib.sets).toHaveLength(2)
    expect(activeSet(lib).tables.name).toBe('Madness Tables 2')
    expect(activeSet(lib).updatedAt).toBe(5)
  })

  it('saves the working copy into the active set only', () => {
    const two = switchTo(addSet(one, set('Dreams'), 2), 'a')
    const saved = saveActive(two, { ...two.sets[0].tables, name: 'Renamed' }, 9)
    expect(saved.sets[0]).toMatchObject({ updatedAt: 9, tables: { name: 'Renamed' } })
    expect(saved.sets[1].tables.name).toBe('Dreams')
  })

  it('ignores a switch to a set that is not there', () => {
    expect(switchTo(one, 'nope')).toBe(one)
  })

  it('never removes the last set, and moves off a removed active set', () => {
    expect(removeSet(one, 'a')).toBe(one)
    const two = addSet(one, set('Dreams'), 2)
    const left = removeSet(two, two.activeId)
    expect(left.sets).toHaveLength(1)
    expect(left.activeId).toBe('a')
  })

  it('makes a blank set that can be rolled on', () => {
    const blank = blankSet()
    expect(checkTableSet(blank)).toEqual([])
    expect(countEntries(blank)).toBe(1)
  })
})

describe('parseLibrary', () => {
  it('builds a library from the fallback when storage has none', () => {
    const lib = parseLibrary(undefined, undefined, set('Defaults'), 3)
    expect(lib.sets).toHaveLength(1)
    expect(activeSet(lib).tables.name).toBe('Defaults')
  })

  it('drops broken sets and repairs a stale active id', () => {
    const lib = parseLibrary([{ id: 'x', tables: set('Kept'), updatedAt: 1 }, { id: 'y' }, null], 'gone', set('Defaults'), 3)
    expect(lib.sets.map((s) => s.id)).toEqual(['x'])
    expect(lib.activeId).toBe('x')
  })
})
