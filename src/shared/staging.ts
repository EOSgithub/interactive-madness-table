import type { Staging } from './types'

// The staging of one result: what a single entry or outcome adds to the show.
// Pure helpers; the files themselves live in IndexedDB (see state/media.ts).

export type MediaKind = 'image' | 'video' | 'audio'

/** Which of the three slots a file can fill, from its MIME type. Null when it fits none. */
export function mediaKind(type: string): MediaKind | null {
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'
  if (type.startsWith('audio/')) return 'audio'
  return null
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * The staging a verdict plays: the outcome's choices win, and whatever the
 * outcome leaves unset falls back to the entry's. Returns undefined when neither
 * sets anything.
 */
export function resolveStaging(entry?: Staging, outcome?: Staging): Staging | undefined {
  const merged: Staging = { ...entry }
  for (const [key, value] of Object.entries(outcome ?? {})) {
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value
  }
  return isEmpty(merged) ? undefined : merged
}

export function isEmpty(s?: Staging): boolean {
  return !s || (!s.animation && !s.image && !s.video && !s.audio)
}

/** Drops unset fields, so a staging with nothing chosen is stored as no staging at all. */
export function tidy(s: Staging): Staging | undefined {
  const out: Staging = {}
  if (s.animation) out.animation = s.animation
  if (s.image) out.image = s.image
  if (s.video) out.video = s.video
  if (s.audio) out.audio = s.audio
  if (isEmpty(out)) return undefined
  if (s.volume !== undefined && s.volume !== 1) out.volume = s.volume
  if (s.loop) out.loop = true
  return out
}

/** Every file id a staging refers to. */
export function mediaIds(s?: Staging): string[] {
  return [s?.image, s?.video, s?.audio].filter((id): id is string => Boolean(id))
}
