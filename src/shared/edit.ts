import { newId, spreadRanges } from './io'
import type { Category, Entry, Outcome, TableSet } from './types'

// Every change the editor can make, as a pure function from one table set to the
// next. Nothing is mutated: the store swaps the whole value, so the play screen
// and the saved copy always see a consistent set.

type Edit = (tables: TableSet) => TableSet

const mapCategory = (id: string, fn: (c: Category) => Category): Edit => (t) => ({
  ...t,
  categories: t.categories.map((c) => (c.id === id ? fn(c) : c))
})

const mapEntry = (categoryId: string, entryId: string, fn: (e: Entry) => Entry): Edit =>
  mapCategory(categoryId, (c) => ({ ...c, entries: c.entries.map((e) => (e.id === entryId ? fn(e) : e)) }))

export const renameSet = (name: string): Edit => (t) => ({ ...t, name })

export const patchCategory = (id: string, patch: Partial<Category>): Edit => mapCategory(id, (c) => ({ ...c, ...patch }))

export const addCategory = (): Edit => (t) => ({
  ...t,
  categories: [
    ...t.categories,
    {
      id: newId(),
      label: 'New category',
      blurb: '',
      duration: { kind: 'fixed', text: '' },
      die: 100,
      subRoll: false,
      subDie: 10,
      entries: [{ id: newId(), range: [1, 100], title: 'New entry', description: '', text: '', outcomes: [] }]
    }
  ]
})

export const removeCategory = (id: string): Edit => (t) => ({ ...t, categories: t.categories.filter((c) => c.id !== id) })

export const patchEntry = (categoryId: string, entryId: string, patch: Partial<Entry>): Edit =>
  mapEntry(categoryId, entryId, (e) => ({ ...e, ...patch }))

/** Adds an entry on the faces nothing covers yet, or on the last face when the die is full. */
export const addEntry = (categoryId: string): Edit =>
  mapCategory(categoryId, (c) => {
    const last = c.entries.reduce((max, e) => Math.max(max, e.range[1]), 0)
    const from = last < c.die ? last + 1 : c.die
    return {
      ...c,
      entries: [...c.entries, { id: newId(), range: [from, c.die], title: 'New entry', description: '', text: '', outcomes: [] }]
    }
  })

export const removeEntry = (categoryId: string, entryId: string): Edit =>
  mapCategory(categoryId, (c) => ({ ...c, entries: c.entries.filter((e) => e.id !== entryId) }))

/** Re-cuts the first die evenly across the entries, keeping their order. */
export const spreadEntries = (categoryId: string): Edit =>
  mapCategory(categoryId, (c) => {
    const ranges = spreadRanges(c.entries.length, c.die)
    return { ...c, entries: c.entries.map((e, i) => (ranges[i] ? { ...e, range: ranges[i] } : e)) }
  })

export const patchOutcome = (categoryId: string, entryId: string, outcomeId: string, patch: Partial<Outcome>): Edit =>
  mapEntry(categoryId, entryId, (e) => ({ ...e, outcomes: e.outcomes.map((o) => (o.id === outcomeId ? { ...o, ...patch } : o)) }))

export const addOutcome = (categoryId: string, entryId: string, subDie: number): Edit =>
  mapEntry(categoryId, entryId, (e) => {
    const last = e.outcomes.reduce((max, o) => Math.max(max, o.range[1]), 0)
    const from = last < subDie ? last + 1 : subDie
    return { ...e, outcomes: [...e.outcomes, { id: newId(), range: [from, subDie], kind: 'neutral', text: '' }] }
  })

export const removeOutcome = (categoryId: string, entryId: string, outcomeId: string): Edit =>
  mapEntry(categoryId, entryId, (e) => ({ ...e, outcomes: e.outcomes.filter((o) => o.id !== outcomeId) }))

/** Re-cuts the second die evenly across an entry's outcomes. */
export const spreadOutcomes = (categoryId: string, entryId: string, subDie: number): Edit =>
  mapEntry(categoryId, entryId, (e) => {
    const ranges = spreadRanges(e.outcomes.length, subDie)
    return { ...e, outcomes: e.outcomes.map((o, i) => (ranges[i] ? { ...o, range: ranges[i] } : o)) }
  })
