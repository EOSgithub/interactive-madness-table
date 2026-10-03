import { create } from 'zustand'
import { toDisplayState, type DisplayState } from '../shared/display'
import { useStore } from './store'

// The link between the two windows. Both are on the same origin, so a
// BroadcastChannel is enough: no server. The DM window sends the display state on
// every change; the player screen says hello when it opens, and gets the current
// state back, so a screen opened late or reloaded is never left blank.

const CHANNEL = 'interactive-madness-table'

type Message = { type: 'state'; state: DisplayState } | { type: 'hello' } | { type: 'bye' }

// ----------------------------------------------------------------- DM side

/** Whether a player screen is listening. The DM window shows it. */
export const usePresence = create<{ open: boolean }>(() => ({ open: false }))

/** Starts broadcasting from the DM window. Returns a function that stops it. */
export function startBroadcast(): () => void {
  const channel = new BroadcastChannel(CHANNEL)
  const send = () => channel.postMessage({ type: 'state', state: toDisplayState(useStore.getState()) } satisfies Message)

  channel.onmessage = (e: MessageEvent<Message>) => {
    if (e.data.type === 'hello') {
      usePresence.setState({ open: true })
      send()
    } else if (e.data.type === 'bye') {
      usePresence.setState({ open: false })
    }
  }

  const unsubscribe = useStore.subscribe(send)
  send() // a player screen that was already open picks up where the DM is
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
  }
  channel.postMessage({ type: 'hello' } satisfies Message)

  const bye = () => channel.postMessage({ type: 'bye' } satisfies Message)
  window.addEventListener('pagehide', bye)
  return () => {
    window.removeEventListener('pagehide', bye)
    bye()
    channel.close()
  }
}
