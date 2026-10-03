import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import source from '../../source/follie.it.json'
import { fairRoll } from '../shared/dice'
import { checkCategory, findEntry, findOutcome } from '../shared/tables'
import type { Category, Entry, Outcome, TableSet } from '../shared/types'

// The DM window owns everything: the tables, the roll in progress and the log of
// the session. Only the tables and the log are saved; a roll in progress is not
// worth restoring after a reload.

export type Step = 'category' | 'first' | 'second' | 'verdict'

export interface Verdict {
  id: string
  at: number
  categoryId: string
  categoryLabel: string
  first: number
  second: number | null
  title: string
  description: string
  kind: Outcome['kind'] | null
  text: string
  /** The line that says how long it lasts, already rolled. */
  duration: string
}

interface Play {
  step: Step
  categoryId: string | null
  first: number | null
  second: number | null
  verdict: Verdict | null
}

interface State extends Play {
  tables: TableSet
  history: Verdict[]
  chooseCategory: (id: string) => void
  /** Sets the first roll; pass nothing to roll it here. */
  rollFirst: (value?: number) => void
  rollSecond: (value?: number) => void
  toggleSubRoll: (categoryId: string) => void
  back: () => void
  restart: () => void
  clearHistory: () => void
}

const IDLE: Play = { step: 'category', categoryId: null, first: null, second: null, verdict: null }

export function durationLine(category: Category): string {
  const d = category.duration
  if (d.kind === 'fixed') return d.text
  return `For the next ${fairRoll(d.die)} ${d.unit}:`
}

function verdictOf(category: Category, entry: Entry, first: number, second: number | null): Verdict {
  const outcome = second === null ? null : findOutcome(entry, second)
  return {
    id: `${Date.now()}-${first}-${second ?? 0}`,
    at: Date.now(),
    categoryId: category.id,
    categoryLabel: category.label,
    first,
    second,
    title: entry.title,
    description: entry.description,
    kind: outcome?.kind ?? null,
    text: outcome?.text ?? entry.text ?? '',
    duration: durationLine(category)
  }
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...IDLE,
      tables: source as TableSet,
      history: [],

      chooseCategory: (id) => {
        const category = get().tables.categories.find((c) => c.id === id)
        if (!category || checkCategory(category).length > 0) return
        set({ ...IDLE, step: 'first', categoryId: id })
      },

      rollFirst: (value) => {
        const { tables, categoryId, history } = get()
        const category = tables.categories.find((c) => c.id === categoryId)
        if (!category) return
        const first = value ?? fairRoll(category.die)
        const entry = findEntry(category, first)
        if (!entry) return
        if (category.subRoll) {
          set({ step: 'second', first, second: null, verdict: null })
        } else {
          const verdict = verdictOf(category, entry, first, null)
          set({ step: 'verdict', first, second: null, verdict, history: [verdict, ...history] })
        }
      },

      rollSecond: (value) => {
        const { tables, categoryId, first, history } = get()
        const category = tables.categories.find((c) => c.id === categoryId)
        if (!category || first === null) return
        const entry = findEntry(category, first)
        if (!entry) return
        const second = value ?? fairRoll(category.subDie)
        if (!findOutcome(entry, second)) return
        const verdict = verdictOf(category, entry, first, second)
        set({ step: 'verdict', second, verdict, history: [verdict, ...history] })
      },

      toggleSubRoll: (categoryId) =>
        set(({ tables }) => ({
          tables: {
            ...tables,
            categories: tables.categories.map((c) => (c.id === categoryId ? { ...c, subRoll: !c.subRoll } : c))
          }
        })),

      back: () => {
        const { step } = get()
        if (step === 'second') set({ step: 'first', first: null, second: null })
        else set(IDLE)
      },

      restart: () => set(IDLE),
      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'interactive-madness-table',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only data is saved. Actions and the roll in progress are rebuilt on load.
      partialize: ({ tables, history }) => ({ tables, history })
    }
  )
)

export function currentCategory(s: Pick<State, 'tables' | 'categoryId'>): Category | null {
  return s.tables.categories.find((c) => c.id === s.categoryId) ?? null
}
