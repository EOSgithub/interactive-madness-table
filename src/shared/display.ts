import type { Settings } from './settings'
import { findEntry } from './tables'
import type { OutcomeKind, TableSet } from './types'

// What the player screen is told. The DM window owns the session and sends this
// subset on every change; the player screen never sees the tables themselves,
// only the roll in progress.

export type DisplayStep = 'category' | 'first' | 'second' | 'verdict'

export interface DisplayState {
  setName: string
  settings: Settings
  /** The DM has hidden the screen. */
  blackout: boolean
  /** This is a preview from Settings, not a real roll. */
  preview: boolean
  step: DisplayStep
  /** When the current step began, in ms since the epoch: animations are a function of the time since then. */
  stepAt: number
  category: { label: string; blurb: string; die: number; subDie: number; subRoll: boolean } | null
  first: number | null
  entry: { title: string; description: string } | null
  second: number | null
  verdict: { kind: OutcomeKind | null; text: string; duration: string } | null
}

/** A preview asked for from Settings: which part of the show, and when it began. */
export interface Preview {
  part: 'roll' | 'verdict'
  at: number
}

/** The part of the DM's state this needs. The store satisfies it. */
export interface DisplaySource {
  tables: TableSet
  settings: Settings
  blackout: boolean
  preview: Preview | null
  step: DisplayStep
  stepAt: number
  categoryId: string | null
  first: number | null
  second: number | null
  verdict: { kind: OutcomeKind | null; text: string; duration: string } | null
}

/** A made-up roll on the first category, to show the DM what the current settings look like. */
function previewState(s: DisplaySource, preview: Preview): DisplayState | null {
  const category = s.tables.categories[0]
  const entry = category?.entries[0]
  if (!category || !entry) return null
  const outcome = entry.outcomes.find((o) => o.kind === 'bane') ?? entry.outcomes[0]
  const verdict = preview.part === 'verdict'
  return {
    setName: s.tables.name,
    settings: s.settings,
    blackout: false,
    preview: true,
    step: verdict ? 'verdict' : 'second',
    stepAt: preview.at,
    category: { label: category.label, blurb: category.blurb, die: category.die, subDie: category.subDie, subRoll: true },
    first: entry.range[0],
    entry: { title: entry.title, description: entry.description },
    second: verdict ? (outcome?.range[0] ?? 1) : null,
    verdict: verdict
      ? { kind: outcome?.kind ?? 'neutral', text: outcome?.text ?? entry.text ?? entry.description, duration: 'For the next 3 minutes:' }
      : null
  }
}

export function toDisplayState(s: DisplaySource): DisplayState {
  if (s.preview) {
    const p = previewState(s, s.preview)
    if (p) return p
  }
  const category = s.tables.categories.find((c) => c.id === s.categoryId) ?? null
  const entry = category && s.first !== null ? findEntry(category, s.first) : null
  return {
    setName: s.tables.name,
    settings: s.settings,
    blackout: s.blackout,
    preview: false,
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
