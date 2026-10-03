import { describe, expect, it } from 'vitest'
import { formatSize, mediaIds, mediaKind, resolveStaging, tidy } from './staging'

describe('resolveStaging', () => {
  it('lets the outcome win, and falls back to the entry for what it leaves unset', () => {
    const entry = { image: 'img-entry', audio: 'snd-entry', animation: 'glitch' as const }
    const outcome = { image: 'img-outcome' }
    expect(resolveStaging(entry, outcome)).toEqual({ image: 'img-outcome', audio: 'snd-entry', animation: 'glitch' })
  })

  it('uses the entry alone when there is no outcome, as with the second roll off', () => {
    expect(resolveStaging({ video: 'v' })).toEqual({ video: 'v' })
  })

  it('is undefined when nothing is set anywhere', () => {
    expect(resolveStaging()).toBeUndefined()
    expect(resolveStaging({}, {})).toBeUndefined()
    expect(resolveStaging({ volume: 0.5 })).toBeUndefined()
  })
})

describe('tidy', () => {
  it('stores nothing when nothing is chosen', () => {
    expect(tidy({ volume: 0.4, loop: true })).toBeUndefined()
    expect(tidy({ image: '', audio: undefined })).toBeUndefined()
  })

  it('keeps volume and loop only when they differ from the default', () => {
    expect(tidy({ audio: 'a', volume: 1, loop: false })).toEqual({ audio: 'a' })
    expect(tidy({ audio: 'a', volume: 0.3, loop: true })).toEqual({ audio: 'a', volume: 0.3, loop: true })
  })
})

describe('files', () => {
  it('sorts a file into its slot by MIME type', () => {
    expect(mediaKind('image/webp')).toBe('image')
    expect(mediaKind('video/mp4')).toBe('video')
    expect(mediaKind('audio/mpeg')).toBe('audio')
    expect(mediaKind('application/pdf')).toBeNull()
  })

  it('writes sizes a person can read', () => {
    expect(formatSize(512)).toBe('512 B')
    expect(formatSize(20 * 1024)).toBe('20 KB')
    expect(formatSize(3.5 * 1024 * 1024)).toBe('3.5 MB')
  })

  it('lists the files a staging uses', () => {
    expect(mediaIds({ image: 'a', audio: 'b', animation: 'plain' })).toEqual(['a', 'b'])
    expect(mediaIds()).toEqual([])
  })
})
