import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import defaults from '../content/defaults.en.json'
import type { Preview } from '../shared/display'
import { fairRoll } from '../shared/dice'
import { addSet, blankSet, parseLibrary, removeSet, saveActive, switchTo, type Library, type SavedSet } from '../shared/library'
import { DEFAULT_SETTINGS, parseSettings, type Settings } from '../shared/settings'
import { resolveStaging } from '../shared/staging'
import { checkCategory, findEntry, findOutcome } from '../shared/tables'
import type { Category, Entry, Outcome, Staging, TableSet } from '../shared/types'

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
  /** The image, video, sound and animation this result plays, if it has its own. */
  staging?: Staging
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
  /** The working copy of the active set: what Play rolls on and Edit changes. */
  tables: TableSet
  /** Every saved set. The active one is kept in step with `tables`. */
  sets: SavedSet[]
  activeId: string
  switchSet: (id: string) => void
  /** Adds a set and switches to it: an empty one, the defaults, a copy of the active one, or an imported one. */
  createSet: (from: 'blank' | 'defaults' | 'copy' | TableSet) => void
  deleteSet: (id: string) => void
  history: Verdict[]
  /** The DM has hidden the player screen. */
  blackout: boolean
  toggleBlackout: () => void
  /** Plays the current show again from its first frame, in every window. */
  replay: () => void
  /** Jumps the current show to its last frame. */
  skip: () => void
  settings: Settings
  setSettings: (patch: Partial<Settings>) => void
  resetSettings: () => void
  /** A preview playing on the player screen, asked for from Settings. */
  preview: Preview | null
  startPreview: (part: Preview['part'], target?: Pick<Preview, 'categoryId' | 'entryId' | 'outcomeId'>) => void
  stopPreview: () => void
  chooseCategory: (id: string) => void
  /** Sets the first roll; pass nothing to roll it here. */
  rollFirst: (value?: number) => void
  rollSecond: (value?: number) => void
  toggleSubRoll: (categoryId: string) => void
  /** Applies one editor change. Any roll in progress is dropped: its table may no longer exist. */
  edit: (change: (tables: TableSet) => TableSet) => void
  resetTables: () => void
  back: () => void
  restart: () => void
  clearHistory: () => void
}

const DEFAULTS = defaults as TableSet

/** A step time this old means "already over": every window draws the last frame. */
export const SKIPPED = 1

const lib = (s: Pick<State, 'sets' | 'activeId'>): Library => ({ sets: s.sets, activeId: s.activeId })

/** New tables for the active set, written through to the library. */
const put = (s: Pick<State, 'sets' | 'activeId'>, tables: TableSet) => ({ tables, sets: saveActive(lib(s), tables, Date.now()).sets })

/** The state after the library changed: the working copy follows the active set, and any roll is dropped. */
const opened = (next: Library) => ({
  ...idle(),
  sets: next.sets,
  activeId: next.activeId,
  tables: (next.sets.find((x) => x.id === next.activeId) ?? next.sets[0]).tables
})

const FIRST = parseLibrary(undefined, undefined, DEFAULTS, Date.now())

const idle = (): Play => ({ step: 'category', stepAt: Date.now(), categoryId: null, first: null, second: null, verdict: null })

/** "For the next 3 minutes:", or "For the next minute:" when the die shows 1. */
export function durationText(amount: number, unit: string): string {
  if (amount === 1) return `For the next ${unit.replace(/s$/, '')}:`
  return `For the next ${amount} ${unit}:`
}

export function durationLine(category: Category): string {
  const d = category.duration
  if (d.kind === 'fixed') return d.text
  return durationText(fairRoll(d.die), d.unit)
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
    duration: durationLine(category),
    staging: resolveStaging(entry.staging, outcome?.staging)
  }
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...idle(),
      tables: DEFAULTS,
      sets: FIRST.sets,
      activeId: FIRST.activeId,
      switchSet: (id) => set((s) => (id === s.activeId ? {} : opened(switchTo(lib(s), id)))),
      createSet: (from) =>
        set((s) => {
          const tables =
            from === 'blank' ? blankSet() : from === 'defaults' ? DEFAULTS : from === 'copy' ? { ...s.tables, name: `${s.tables.name} copy` } : from
          return opened(addSet(lib(s), tables, Date.now()))
        }),
      deleteSet: (id) => set((s) => opened(removeSet(lib(s), id))),
      history: [],
      blackout: false,
      toggleBlackout: () => set(({ blackout }) => ({ blackout: !blackout })),
      replay: () => set(({ step }) => (step === 'second' || step === 'verdict' ? { stepAt: Date.now() } : {})),
      skip: () => set(({ step }) => (step === 'second' || step === 'verdict' ? { stepAt: SKIPPED } : {})),
      settings: DEFAULT_SETTINGS,
      setSettings: (patch) => set(({ settings }) => ({ settings: { ...settings, ...patch } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      preview: null,
      startPreview: (part, target) => set({ preview: { ...target, part, at: Date.now() } }),
      stopPreview: () => set(({ preview }) => (preview ? { preview: null } : {})),

      chooseCategory: (id) => {
        const category = get().tables.categories.find((c) => c.id === id)
        if (!category || checkCategory(category).length > 0) return
        set({ ...idle(), step: 'first', categoryId: id })
      },

      rollFirst: (value) => {
        const { tables, categoryId, history, step } = get()
        const category = tables.categories.find((c) => c.id === categoryId)
        if (!category || step !== 'first') return
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
        const { tables, categoryId, first, history, step } = get()
        const category = tables.categories.find((c) => c.id === categoryId)
        if (!category || first === null || step !== 'second') return
        const entry = findEntry(category, first)
        if (!entry) return
        const second = value ?? fairRoll(category.subDie)
        if (!findOutcome(entry, second)) return
        const verdict = verdictOf(category, entry, first, second)
        set({ step: 'verdict', stepAt: Date.now(), second, verdict, history: [verdict, ...history] })
      },

      toggleSubRoll: (categoryId) =>
        set((s) =>
          put(s, {
            ...s.tables,
            categories: s.tables.categories.map((c) => (c.id === categoryId ? { ...c, subRoll: !c.subRoll } : c))
          })
        ),

      // While the DM is only choosing, an edit leaves the play state alone, so typing does not restart the player screen.
      edit: (change) =>
        set((s) => (s.step === 'category' ? put(s, change(s.tables)) : { ...idle(), ...put(s, change(s.tables)) })),
      resetTables: () => set((s) => ({ ...idle(), ...put(s, { ...DEFAULTS, name: s.tables.name }) })),

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
      version: 3,
      // Version 1 shipped the Italian source tables as defaults. Anyone still on
      // them, untouched or not, moves to the English set; other saved tables stay.
      migrate: (saved, version) => {
        const s = (saved ?? {}) as Partial<State>
        if (version < 2 && s.tables?.name === 'Follie') s.tables = DEFAULTS
        // Version 3 keeps several sets. The one set saved before becomes the first of them.
        if (version < 3 && s.tables) {
          const first = parseLibrary(undefined, undefined, s.tables, Date.now())
          return { ...s, sets: first.sets, activeId: first.activeId }
        }
        return s
      },
      storage: createJSONStorage(() => localStorage),
      // Only data is saved. Actions and the roll in progress are rebuilt on load.
      partialize: ({ sets, activeId, history, settings }) => ({ sets, activeId, history, settings }),
      // Settings saved by an older version may lack newer fields: fill them in.
      // The working copy is not saved: it is the active set of the library.
      merge: (saved, current) => {
        const s = (saved ?? {}) as Partial<State>
        const library = parseLibrary(s.sets, s.activeId, DEFAULTS, Date.now())
        return { ...current, ...s, ...opened(library), settings: parseSettings(s.settings) }
      }
    }
  )
)

export function currentCategory(s: Pick<State, 'tables' | 'categoryId'>): Category | null {
  return s.tables.categories.find((c) => c.id === s.categoryId) ?? null
}
