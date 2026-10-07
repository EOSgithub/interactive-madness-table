import type { ThemeId } from './themes'
import type { Category, OutcomeKind } from './types'

// The banner that crosses the player screen when the verdict is named. Each
// theme has its own words, and a table can replace any of them with its own.

/** `plain` is for a table with no second roll. */
export type BannerKind = OutcomeKind | 'plain'

export const BANNER_KINDS: BannerKind[] = ['boon', 'neutral', 'bane', 'plain']

/** The words of each theme. */
export const BANNER: Record<ThemeId, Record<BannerKind, string>> = {
  gothic: { boon: 'Boon Granted', neutral: 'Madness Manifested', bane: 'Bane Inflicted', plain: 'Madness Takes Hold' },
  cosmic: { boon: 'A Star Aligns', neutral: 'It Has Noticed You', bane: 'The Void Answers', plain: 'Mind Shattered' },
  surreal: { boon: 'A Kind Dream', neutral: 'Logic Slips', bane: 'The Nightmare Begins', plain: 'Nothing Is As It Was' },
  occult: { boon: 'The Pact Rewards', neutral: 'The Sign Appears', bane: 'The Price Is Paid', plain: 'The Seal Is Broken' },
  societal: { boon: 'Appeal Granted', neutral: 'Noted On File', bane: 'Sentence Passed', plain: 'Case Opened' },
  hellenic: { boon: 'Favour of the Gods', neutral: 'The Gods Take Notice', bane: 'Wrath of the Gods', plain: 'Cursed by the Gods' },
  dnd: { boon: 'Unexpected Boon', neutral: 'Madness Inflicted', bane: 'Critical Failure', plain: 'Madness Inflicted' }
}

/** The words for a verdict: the table's own if it has them, the theme's otherwise. */
export function bannerWord(theme: ThemeId, category: Pick<Category, 'banner'> | null | undefined, kind: OutcomeKind | null): string {
  const which = kind ?? 'plain'
  return category?.banner?.[which]?.trim() || BANNER[theme][which]
}
