import type { Settings } from './settings'
import { resolveStaging } from './staging'
import { findEntry } from './tables'
import type { OutcomeKind, RollStyle, Staging, TableSet } from './types'

// What the player screen is told. The DM window owns the session and sends this
// subset on every change; the player screen never sees the tables themselves,
// only the roll in progress.

export type DisplayStep = 'category' | 'first' | 'second' | 'verdict'

export interface DisplayState {
  setName: string
  settings: Settings
  /** The roll animation for this step: the one chosen in Settings, unless this result has its own. */
  rollStyle: RollStyle
  /** The DM has hidden the screen. */
  blackout: boolean
  /** This is a preview, not a real roll. */
  preview: boolean
  step: DisplayStep
  /** When the current step began, in ms since the epoch: animations are a function of the time since then. */
  stepAt: number
  category: { label: string; blurb: string; die: number; subDie: number; subRoll: boolean } | null
  first: number | null
  entry: { title: string; description: string } | null
  second: number | null
  verdict: { kind: OutcomeKind | null; text: string; duration: string } | null
  /** Files this verdict shows, by id. Sound is not here: it plays from the DM window. */
  media: { image?: string; video?: string } | null
}

/** A preview: which part of the show, when it began, and optionally which result to play. */
export interface Preview {
  part: 'roll' | 'verdict'
  at: number
  categoryId?: string
  entryId?: string
  outcomeId?: string
}

interface VerdictSource {
  kind: OutcomeKind | null
  text: string
  duration: string
  staging?: Staging
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
  verdict: VerdictSource | null
}

const mediaOf = (s?: Staging): DisplayState['media'] => (s?.image || s?.video ? { image: s.image, video: s.video } : null)

/**
 * A made-up roll, to show the DM what the show looks like. From Settings it
 * plays the first entry; from Stage it plays the entry or outcome being staged.
 */
function previewState(s: DisplaySource, preview: Preview): { state: DisplayState; staging?: Staging } | null {
  const category = s.tables.categories.find((c) => c.id === preview.categoryId) ?? s.tables.categories[0]
  const entry = category?.entries.find((e) => e.id === preview.entryId) ?? category?.entries[0]
  if (!category || !entry) return null
  const chosen = entry.outcomes.find((o) => o.id === preview.outcomeId)
  const outcome = chosen ?? (preview.entryId ? undefined : (entry.outcomes.find((o) => o.kind === 'bane') ?? entry.outcomes[0]))
  const verdict = preview.part === 'verdict'
  const staging = verdict ? resolveStaging(entry.staging, outcome?.staging) : entry.staging
  return {
    staging,
    state: {
      setName: s.tables.name,
      settings: s.settings,
      rollStyle: staging?.animation ?? s.settings.rollStyle,
      blackout: false,
      preview: true,
      step: verdict ? 'verdict' : 'second',
      stepAt: preview.at,
      category: { label: category.label, blurb: category.blurb, die: category.die, subDie: category.subDie, subRoll: true },
      first: entry.range[0],
      entry: { title: entry.title, description: entry.description },
      second: verdict ? (outcome?.range[0] ?? null) : null,
      verdict: verdict
        ? { kind: outcome?.kind ?? null, text: outcome?.text ?? entry.text ?? entry.description, duration: 'For the next 3 minutes:' }
        : null,
      media: verdict ? mediaOf(staging) : null
    }
  }
}

/** The staging of whatever is on the player screen now: the DM window plays its sound. */
export function currentStaging(s: DisplaySource): Staging | undefined {
  if (s.preview) return previewState(s, s.preview)?.staging
  return s.step === 'verdict' ? s.verdict?.staging : undefined
}

export function toDisplayState(s: DisplaySource): DisplayState {
  if (s.preview) {
    const p = previewState(s, s.preview)
    if (p) return p.state
  }
  const category = s.tables.categories.find((c) => c.id === s.categoryId) ?? null
  const entry = category && s.first !== null ? findEntry(category, s.first) : null
  const staging = s.step === 'verdict' ? s.verdict?.staging : entry?.staging
  return {
    setName: s.tables.name,
    settings: s.settings,
    rollStyle: staging?.animation ?? s.settings.rollStyle,
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
    verdict: s.verdict && { kind: s.verdict.kind, text: s.verdict.text, duration: s.verdict.duration },
    media: s.step === 'verdict' ? mediaOf(s.verdict?.staging) : null
  }
}
