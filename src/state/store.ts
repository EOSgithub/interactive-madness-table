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
  /** When the current step began. The player screen times its show from this. */
  stepAt: number
  categoryId: string | null
  first: number | null
  second: number | null
  verdict: Verdict | null
}

interface State extends Play {
  tables: TableSet
  history: Verdict[]
  /** The DM has hidden the player screen. */
  blackout: boolean
  toggleBlackout: () => void
  /** Spin, shake and light up the number in the DM window when a die is rolled. */
  diceEffect: boolean
  toggleDiceEffect: () => void
  chooseCategory: (id: string) => void
  /** Sets the first roll; pass nothing to roll it here. */
  rollFirst: (value?: number) => void
  rollSecond: (value?: number) => void
  toggleSubRoll: (categoryId: string) => void
  /** Applies one editor change. Any roll in progress is dropped: its table may no longer exist. */
  edit: (change: (tables: TableSet) => TableSet) => void
  setTables: (tables: TableSet) => void
  resetTables: () => void
  back: () => void
  restart: () => void
  clearHistory: () => void
}

const DEFAULTS = source as TableSet

const idle = (): Play => ({ step: 'category', stepAt: Date.now(), categoryId: null, first: null, second: null, verdict: null })

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
      ...idle(),
      tables: DEFAULTS,
      history: [],
      blackout: false,
      toggleBlackout: () => set(({ blackout }) => ({ blackout: !blackout })),
      diceEffect: true,
      toggleDiceEffect: () => set(({ diceEffect }) => ({ diceEffect: !diceEffect })),

      chooseCategory: (id) => {
        const category = get().tables.categories.find((c) => c.id === id)
        if (!category || checkCategory(category).length > 0) return
        set({ ...idle(), step: 'first', categoryId: id })
      },

      rollFirst: (value) => {
        const { tables, categoryId, history } = get()
        const category = tables.categories.find((c) => c.id === categoryId)
        if (!category) return
        const first = value ?? fairRoll(category.die)
        const entry = findEntry(category, first)
        if (!entry) return
        if (category.subRoll) {
          set({ step: 'second', stepAt: Date.now(), first, second: null, verdict: null })
        } else {
          const verdict = verdictOf(category, entry, first, null)
          set({ step: 'verdict', stepAt: Date.now(), first, second: null, verdict, history: [verdict, ...history] })
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
        set({ step: 'verdict', stepAt: Date.now(), second, verdict, history: [verdict, ...history] })
      },

      toggleSubRoll: (categoryId) =>
        set(({ tables }) => ({
          tables: {
            ...tables,
            categories: tables.categories.map((c) => (c.id === categoryId ? { ...c, subRoll: !c.subRoll } : c))
          }
        })),

      // While the DM is only choosing, an edit leaves the play state alone, so typing does not restart the player screen.
      edit: (change) =>
        set(({ tables, step }) => (step === 'category' ? { tables: change(tables) } : { ...idle(), tables: change(tables) })),
      setTables: (tables) => set({ ...idle(), tables }),
      resetTables: () => set({ ...idle(), tables: DEFAULTS }),

      back: () => {
        const { step } = get()
        if (step === 'second') set({ step: 'first', stepAt: Date.now(), first: null, second: null })
        else set(idle())
      },

      restart: () => set(idle()),
      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'interactive-madness-table',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only data is saved. Actions and the roll in progress are rebuilt on load.
      partialize: ({ tables, history, diceEffect }) => ({ tables, history, diceEffect })
    }
  )
)

export function currentCategory(s: Pick<State, 'tables' | 'categoryId'>): Category | null {
  return s.tables.categories.find((c) => c.id === s.categoryId) ?? null
}
