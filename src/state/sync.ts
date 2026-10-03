import { create } from 'zustand'
import { toDisplayState, type DisplayState } from '../shared/display'
import { useStore } from './store'

// The link between the two windows. Both are on the same origin, so a
// BroadcastChannel is enough: no server. The DM window sends the display state on
// every change; the player screen says hello when it opens, and gets the current
// state back, so a screen opened late or reloaded is never left blank.

const CHANNEL = 'interactive-madness-table'

type Message =
  | { type: 'state'; state: DisplayState }
  /** The player screen is there. `visible` is false while its window is covered, minimised or in a background tab. */
  | { type: 'hello'; visible: boolean }
  | { type: 'bye' }
  | { type: 'who' }

// ----------------------------------------------------------------- DM side

/**
 * Whether a player screen is listening, and whether anyone can see it. A browser
 * stops drawing a window that is hidden, so the show waits there until it is
 * back in view; the DM window says so.
 */
export const usePresence = create<{ open: boolean; visible: boolean }>(() => ({ open: false, visible: false }))

/** Starts broadcasting from the DM window. Returns a function that stops it. */
export function startBroadcast(): () => void {
  const channel = new BroadcastChannel(CHANNEL)
  const send = () => channel.postMessage({ type: 'state', state: toDisplayState(useStore.getState()) } satisfies Message)

  channel.onmessage = (e: MessageEvent<Message>) => {
    if (e.data.type === 'hello') {
      usePresence.setState({ open: true, visible: e.data.visible })
      send()
    } else if (e.data.type === 'bye') {
      usePresence.setState({ open: false, visible: false })
    }
  }

  const unsubscribe = useStore.subscribe(send)
  // A player screen that was already open (the DM window was reloaded) picks up
  // where the DM is, and says hello again so this window knows it is there.
  send()
  channel.postMessage({ type: 'who' } satisfies Message)
  return () => {
    unsubscribe()
    channel.close()
  }
}

// ------------------------------------------------------------ player side

/** Listens on the player screen. Calls `onState` with every state the DM sends. */
export function listen(onState: (state: DisplayState) => void): () => void {
  const channel = new BroadcastChannel(CHANNEL)
  channel.onmessage = (e: MessageEvent<Message>) => {
    if (e.data.type === 'state') onState(e.data.state)
    else if (e.data.type === 'who') hello()
  }
  const hello = () => channel.postMessage({ type: 'hello', visible: document.visibilityState === 'visible' } satisfies Message)
  hello()

  const bye = () => channel.postMessage({ type: 'bye' } satisfies Message)
  window.addEventListener('pagehide', bye)
  document.addEventListener('visibilitychange', hello)
  return () => {
    window.removeEventListener('pagehide', bye)
    document.removeEventListener('visibilitychange', hello)
    bye()
    channel.close()
  }
}
