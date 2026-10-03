import { usePresence } from '../state/sync'
import { useStore } from '../state/store'

// What the DM needs to run the player screen: open it, see whether it is
// listening, and black it out.

export function ScreenControl({ onTableMode }: { onTableMode: () => void }) {
  const open = usePresence((s) => s.open)
  const blackout = useStore((s) => s.blackout)
  const toggleBlackout = useStore((s) => s.toggleBlackout)

  function openScreen() {
    // A named window: clicking again brings the same one forward instead of opening a second.
    window.open('./display.html', 'imt-player-screen', 'popup,width=1280,height=720')
  }

  return (
    <div className="screen-control">
      <span className={`presence ${open ? 'on' : ''}`} role="status">
        {open ? 'Player screen connected' : 'Player screen not open'}
      </span>
      <button className="ghost" onClick={openScreen}>
        {open ? 'Show player screen' : 'Open player screen'}
      </button>
      <button className="ghost" onClick={onTableMode} title="Show the player view here, on this screen">
        Table mode
      </button>
      <label className="switch">
        <input type="checkbox" checked={blackout} onChange={toggleBlackout} />
        Blackout
      </label>
    </div>
  )
}
