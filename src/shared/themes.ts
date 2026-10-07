// The theme of a table set: what kind of madness it is about. A theme changes
// how the DM window looks and what the player screen shows (see styles/themes.css
// and display/atmosphere.ts). The words on the tables stay the DM's own.

export type ThemeId = 'cosmic' | 'gothic' | 'surreal' | 'occult' | 'societal' | 'hellenic' | 'dnd'

export interface Theme {
  id: ThemeId
  label: string
  /** What drives someone mad under this theme, in one line. */
  principle: string
}

export const THEMES: Theme[] = [
  { id: 'cosmic', label: 'Cosmic', principle: 'Reality is too vast or incomprehensible for the human mind.' },
  { id: 'gothic', label: 'Gothic', principle: 'The past, repression, desire and decay poison the individual.' },
  { id: 'surreal', label: 'Surreal', principle: 'Reality itself stops obeying ordinary logic.' },
  { id: 'occult', label: 'Occult', principle: 'Forbidden forces, knowledge or beliefs corrupt the mind.' },
  { id: 'societal', label: 'Societal', principle: 'The individual goes mad because the world around them already is.' },
  { id: 'hellenic', label: 'Hellenic', principle: 'A god sends the madness, as a punishment or for sport.' },
  { id: 'dnd', label: 'D&D', principle: 'Horrors and alien planes wear the mind down, by the rules of the fifth edition.' }
]

/** The look the tool had before themes, and the one a set without a theme gets. */
export const DEFAULT_THEME: ThemeId = 'gothic'

/** Cleans a theme read from a file or from storage. */
export function parseTheme(value: unknown): ThemeId {
  return THEMES.find((t) => t.id === value)?.id ?? DEFAULT_THEME
}

export function themeOf(tables: { theme?: ThemeId }): ThemeId {
  return tables.theme ?? DEFAULT_THEME
}
