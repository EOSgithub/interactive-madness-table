import { EyeSlash, FrameCorners, MonitorPlay } from '@phosphor-icons/react'
import { usePresence } from '../state/sync'
import { useStore } from '../state/store'

// What the DM needs to run the player screen: open it, see whether it is
// listening and in view, and black it out.

export function ScreenControl({ onTableMode }: { onTableMode: () => void }) {
  const open = usePresence((s) => s.open)
  const visible = usePresence((s) => s.visible)
  const blackout = useStore((s) => s.blackout)
  const toggleBlackout = useStore((s) => s.toggleBlackout)

  function openScreen() {
    // A named window: clicking again brings the same one forward instead of opening a second.
    window.open('./display.html', 'imt-player-screen', 'popup,width=1280,height=720')
  }

  // A browser stops drawing a window nobody can see, so the show waits there. The DM should know.
  const status = !open ? 'Player screen not open' : visible ? 'Player screen connected' : 'Player screen is hidden. The show waits until it is in view.'
  return (
    <div className="screen-control">
      <span className={`presence ${open ? (visible ? 'on' : 'hidden') : ''}`} role="status">
        {status}
      </span>
      <button className="ghost" onClick={openScreen}>
        <MonitorPlay /> {open ? 'Show player screen' : 'Open player screen'}
      </button>
      <button className="ghost" onClick={onTableMode} title="Show the player view here, on this whole window">
        <FrameCorners /> Table mode
      </button>
      <label className="switch">
        <input type="checkbox" role="switch" checked={blackout} onChange={toggleBlackout} />
        <EyeSlash /> Blackout
      </label>
    </div>
  )
}
