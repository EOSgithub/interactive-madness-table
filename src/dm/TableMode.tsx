import { useMemo } from 'react'
import { PlayerView } from '../display/Display'
import { toDisplayState } from '../shared/display'
import { checkCategory } from '../shared/tables'
import { currentCategory, useStore } from '../state/store'

// Table mode: the player view inside the DM window, with a thin bar to run the
// roll. It is for one screen only, a phone or a tablet on the table, or a device
// mirrored to a TV, where there is no second window to put the player screen in.

export function TableMode({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const state = useMemo(
    () => toDisplayState(s),
    [s.tables, s.settings, s.blackout, s.preview, s.step, s.stepAt, s.categoryId, s.first, s.second, s.verdict]
  )
  const category = currentCategory(s)

  const fullScreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => {})
  }

  return (
    <div className="table-mode">
      <PlayerView state={state} />
      <div className="table-bar">
        {s.step === 'category' &&
          s.tables.categories
            .filter((c) => checkCategory(c).length === 0)
            .map((c) => (
              <button key={c.id} onClick={() => s.chooseCategory(c.id)}>
                {c.label}
              </button>
            ))}
        {s.step === 'first' && category && (
          <>
            <button className="main" onClick={() => s.rollFirst()}>
              Roll d{category.die}
            </button>
            <button onClick={s.back}>Back</button>
          </>
        )}
        {s.step === 'second' && category && (
          <button className="main" onClick={() => s.rollSecond()}>
            Roll d{category.subDie}
          </button>
        )}
        {s.step === 'verdict' && (
          <button className="main" onClick={s.restart}>
            Again
          </button>
        )}
        <span className="table-bar-gap" />
        {typeof document.documentElement.requestFullscreen === 'function' && <button onClick={fullScreen}>Full screen</button>}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
