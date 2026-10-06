import { useMemo, type ReactNode } from 'react'
import { PlayerView } from '../display/Display'
import { toDisplayState, type DisplayState } from '../shared/display'
import { useStore } from '../state/store'

// The monitor: the player view, live, inside the DM window. It is the same
// component the player screen draws, fed with the same state, so the DM watches
// the roll and the verdict as the players do, without looking away from the
// controls. It also works with no player screen open at all.

/** What the player screen is showing now, worked out in this window. */
export function useDisplayState(): DisplayState {
  const s = useStore()
  return useMemo(
    () => toDisplayState(s),
    [s.tables, s.settings, s.preview, s.step, s.stepAt, s.categoryId, s.first, s.second, s.verdict]
  )
}

export function Monitor({ label = 'What your players see', children }: { label?: string; children?: ReactNode }) {
  const state = useDisplayState()
  return (
    <figure className="monitor">
      <div className="monitor-frame">
        <PlayerView state={state} />
      </div>
      <div className="monitor-bar">
        <figcaption>{label}</figcaption>
        {children}
      </div>
    </figure>
  )
}
