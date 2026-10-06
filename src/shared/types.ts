import type { ThemeId } from './themes'

// The data model. A table set is what the DM edits and what a roll is looked up in.

/** An inclusive span on a die, e.g. [11, 20] on a d100. */
export type Range = [number, number]

export type OutcomeKind = 'boon' | 'neutral' | 'bane'

/** Which built-in roll animation to play. Settings picks the default; a staging can override it. */
export type RollStyle = 'ratchet' | 'glitch' | 'plain'

/** What a single result adds to, or replaces in, the default show. Media are ids of files the DM uploaded. */
export interface Staging {
  animation?: RollStyle
  image?: string
  video?: string
  audio?: string
  volume?: number
  loop?: boolean
}

/** One result of the second roll. */
export interface Outcome {
  id: string
  range: Range
  kind: OutcomeKind
  text: string
  staging?: Staging
}

/** One result of the first roll. */
export interface Entry {
  id: string
  range: Range
  title: string
  description: string
  /** The effect, used when the category has no second roll. */
  text?: string
  /** The results of the second roll, used when the category has one. */
  outcomes: Outcome[]
  staging?: Staging
}

/** How long a result lasts: a fixed line, or a die and a unit rolled at the verdict. */
export type Duration =
  | { kind: 'fixed'; text: string }
  | { kind: 'dice'; die: number; unit: string }

export interface Category {
  id: string
  label: string
  blurb: string
  duration: Duration
  /** Sides of the first die. */
  die: number
  /** Whether a second roll picks one of the entry's outcomes. */
  subRoll: boolean
  /** Sides of the second die. */
  subDie: number
  entries: Entry[]
}

export interface TableSet {
  name: string
  /** The kind of madness: it sets the look of the tool and of the player screen. Gothic when missing. */
  theme?: ThemeId
  categories: Category[]
}
