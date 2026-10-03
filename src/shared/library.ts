import { newId } from './io'
import type { TableSet } from './types'

// The DM's saved table sets. One of them is the active one: it is what Play
// rolls on and what Edit changes. Pure functions from one library to the next,
// like edit.ts; the store swaps the whole value and saves it.

export interface SavedSet {
  id: string
  tables: TableSet
  /** When it was last changed, in ms since the epoch. */
  updatedAt: number
}

export interface Library {
  sets: SavedSet[]
  activeId: string
}

export function activeSet(lib: Library): SavedSet {
  return lib.sets.find((s) => s.id === lib.activeId) ?? lib.sets[0]
}

/** "Madness Tables", then "Madness Tables 2", "Madness Tables 3": two sets never share a name. */
export function uniqueName(name: string, taken: string[]): string {
  const base = name.trim() || 'Untitled tables'
  if (!taken.includes(base)) return base
  const stem = base.replace(/ \d+$/, '')
  let n = 2
  while (taken.includes(`${stem} ${n}`)) n++
  return `${stem} ${n}`
}

/** Adds a set and makes it the active one. */
export function addSet(lib: Library, tables: TableSet, now: number): Library {
  const id = newId()
  const name = uniqueName(tables.name, lib.sets.map((s) => s.tables.name))
  return { sets: [...lib.sets, { id, tables: { ...tables, name }, updatedAt: now }], activeId: id }
}

/** Writes the working copy of the active set back into the library. */
export function saveActive(lib: Library, tables: TableSet, now: number): Library {
  return { ...lib, sets: lib.sets.map((s) => (s.id === lib.activeId ? { ...s, tables, updatedAt: now } : s)) }
}

export function switchTo(lib: Library, id: string): Library {
  return lib.sets.some((s) => s.id === id) ? { ...lib, activeId: id } : lib
}

/** Removes a set. The last one cannot go; removing the active one activates the first that is left. */
export function removeSet(lib: Library, id: string): Library {
  if (lib.sets.length <= 1 || !lib.sets.some((s) => s.id === id)) return lib
  const sets = lib.sets.filter((s) => s.id !== id)
  return { sets, activeId: id === lib.activeId ? sets[0].id : lib.activeId }
}

/** A set with one table and one entry, ready to be filled in. */
export function blankSet(name = 'New tables'): TableSet {
  return {
    name,
    categories: [
      {
        id: newId(),
        label: 'New table',
        blurb: '',
        duration: { kind: 'fixed', text: '' },
        die: 100,
        subRoll: false,
        subDie: 10,
        entries: [{ id: newId(), range: [1, 100], title: 'New entry', description: '', text: '', outcomes: [] }]
      }
    ]
  }
}

export function countEntries(tables: TableSet): number {
  return tables.categories.reduce((n, c) => n + c.entries.length, 0)
}

/** Cleans a library read from storage. Falls back to one set holding `fallback` when nothing usable is there. */
export function parseLibrary(sets: unknown, activeId: unknown, fallback: TableSet, now: number): Library {
  const usable = (Array.isArray(sets) ? sets : []).filter(
    (s): s is SavedSet =>
      typeof s === 'object' && s !== null && typeof s.id === 'string' && typeof s.tables === 'object' && s.tables !== null && Array.isArray(s.tables.categories)
  )
  if (usable.length === 0) {
    const id = newId()
    return { sets: [{ id, tables: fallback, updatedAt: now }], activeId: id }
  }
  return { sets: usable, activeId: usable.some((s) => s.id === activeId) ? (activeId as string) : usable[0].id }
}
