import { findEntry } from './tables'
import type { OutcomeKind, TableSet } from './types'

// What the player screen is told. The DM window owns the session and sends this
// subset on every change; the player screen never sees the tables themselves,
// only the roll in progress.

export type DisplayStep = 'category' | 'first' | 'second' | 'verdict'

export interface DisplayState {
  setName: string
  /** The DM has hidden the screen. */
  blackout: boolean
  step: DisplayStep
  /** When the current step began, in ms since the epoch: animations are a function of the time since then. */
  stepAt: number
  category: { label: string; blurb: string; die: number; subDie: number; subRoll: boolean } | null
  first: number | null
  entry: { title: string; description: string } | null
  second: number | null
  verdict: { kind: OutcomeKind | null; text: string; duration: string } | null
}

/** The part of the DM's state this needs. The store satisfies it. */
export interface DisplaySource {
  tables: TableSet
  blackout: boolean
  step: DisplayStep
  stepAt: number
  categoryId: string | null
  first: number | null
  second: number | null
  verdict: { kind: OutcomeKind | null; text: string; duration: string } | null
}

export function toDisplayState(s: DisplaySource): DisplayState {
  const category = s.tables.categories.find((c) => c.id === s.categoryId) ?? null
  const entry = category && s.first !== null ? findEntry(category, s.first) : null
  return {
    setName: s.tables.name,
    blackout: s.blackout,
    step: s.step,
    stepAt: s.stepAt,
    category: category && {
      label: category.label,
      blurb: category.blurb,
      die: category.die,
      subDie: category.subDie,
      subRoll: category.subRoll
    },
    first: s.first,
    entry: entry && { title: entry.title, description: entry.description },
    second: s.second,
    verdict: s.verdict && { kind: s.verdict.kind, text: s.verdict.text, duration: s.verdict.duration }
  }
}
