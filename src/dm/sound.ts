import { create } from 'zustand'
import { firstRollBeats, secondRollBeats } from '../display/show'
import { currentStaging, toDisplayState } from '../shared/display'
import { SPEED_FACTOR } from '../shared/settings'
import { urlFor } from '../state/media'
import { useStore } from '../state/store'

// Sound plays from the DM window, not from the player screen: the speakers are on
// the computer that runs both, and the DM has already clicked in this window, so
// the browser lets it play. A verdict with a sound, or with a video, is heard
// from here; the player screen shows the video muted.

/** Whether the browser refused the last sound. The DM window says so. */
export const useSound = create<{ blocked: boolean }>(() => ({ blocked: false }))

/** Starts watching the store. Returns a function that stops it. */
export function startSound(): () => void {
  const audio = new Audio()
  let cue = '' // what is playing, or about to: one cue per verdict
  let timer = 0

  const stop = () => {
    window.clearTimeout(timer)
    audio.pause()
    audio.removeAttribute('src')
  }

  const check = () => {
    const s = useStore.getState()
    const staging = currentStaging(s)
    const file = s.blackout ? undefined : (staging?.audio ?? staging?.video)
    const display = toDisplayState(s)
    const next = file ? `${file}@${display.stepAt}` : ''
    if (next === cue) return
    cue = next
    stop()
    if (!file) return

    // The sound comes in as the die stops, like the image and the video.
    const speed = SPEED_FACTOR[s.settings.speed]
    const plain = display.rollStyle === 'plain'
    const beats = display.second !== null ? secondRollBeats(speed, plain) : firstRollBeats(speed, plain)
    const wait = s.settings.animations ? Math.max(0, display.stepAt + beats.drum.landed - Date.now()) : 0

    timer = window.setTimeout(() => {
      void urlFor(file)
        .then((url) => {
          if (cue !== next) return
          audio.src = url
          audio.volume = staging?.volume ?? 1
          audio.loop = staging?.loop ?? false
          return audio.play().then(() => useSound.setState({ blocked: false }))
        })
        .catch((e: unknown) => {
          // NotAllowedError: the browser wants a click in this window first.
          if (e instanceof DOMException && e.name === 'NotAllowedError') useSound.setState({ blocked: true })
        })
    }, wait)
  }

  const unsubscribe = useStore.subscribe(check)
  return () => {
    unsubscribe()
    stop()
  }
}
