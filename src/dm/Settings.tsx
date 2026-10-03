import { useEffect, useRef } from 'react'
import { ROLL_STYLES, SPEEDS, VERDICT_STYLES, type Settings as SettingsValue } from '../shared/settings'
import { usePresence } from '../state/sync'
import { useStore } from '../state/store'

// How the show looks and moves. Every control applies at once and is saved; the
// preview buttons play the current choices on the player screen without a real roll.

const PREVIEW_MS = 9000

export function Settings() {
  const settings = useStore((s) => s.settings)
  const set = useStore((s) => s.setSettings)
  const reset = useStore((s) => s.resetSettings)
  const diceEffect = useStore((s) => s.diceEffect)
  const toggleDiceEffect = useStore((s) => s.toggleDiceEffect)
  const preview = useStore((s) => s.preview)
  const startPreview = useStore((s) => s.startPreview)
  const stopPreview = useStore((s) => s.stopPreview)
  const screenOpen = usePresence((s) => s.open)
  const timer = useRef(0)

  // A preview ends by itself, and when the DM leaves this tab.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      stopPreview()
    },
    [stopPreview]
  )

  function play(part: 'roll' | 'verdict') {
    window.clearTimeout(timer.current)
    startPreview(part)
    timer.current = window.setTimeout(stopPreview, PREVIEW_MS)
  }

  const off = !settings.animations
  return (
    <div className="settings">
      <section>
        <h2>The show</h2>
        <Switch label="Animations" hint="Off: every step is a plain fade." checked={settings.animations} onChange={(animations) => set({ animations })} />
        <Choice label="Roll" options={ROLL_STYLES} value={settings.rollStyle} disabled={off} onChange={(rollStyle) => set({ rollStyle })} />
        <Choice label="Verdict" options={VERDICT_STYLES} value={settings.verdictStyle} disabled={off} onChange={(verdictStyle) => set({ verdictStyle })} />
        <Choice label="Speed" options={SPEEDS} value={settings.speed} disabled={off} onChange={(speed) => set({ speed })} />
      </section>

      <section>
        <h2>Atmosphere</h2>
        <Switch label="Film grain" checked={settings.grain} onChange={(grain) => set({ grain })} />
        <Switch label="Vignette" hint="Dark corners." checked={settings.vignette} onChange={(vignette) => set({ vignette })} />
        <Switch label="Camera shake" hint="A jolt when the die stops." checked={settings.shake} disabled={off} onChange={(shake) => set({ shake })} />
      </section>

      <section>
        <h2>This window</h2>
        <Switch
          label="Dice effect"
          hint="The numbers spin, shake and light up here when you roll."
          checked={diceEffect}
          onChange={toggleDiceEffect}
        />
        <Switch
          label="Respect reduced motion"
          hint="Skip the show when the system asks for less movement."
          checked={settings.respectReducedMotion}
          onChange={(respectReducedMotion) => set({ respectReducedMotion })}
        />
      </section>

      <section>
        <h2>Preview</h2>
        <p className="hint">
          {screenOpen
            ? 'Plays on the player screen with a made-up roll. Nothing is added to the session.'
            : 'Open the player screen to see a preview.'}
        </p>
        <div className="preview-buttons">
          <button className="ghost" disabled={!screenOpen} onClick={() => play('roll')}>
            Preview the roll
          </button>
          <button className="ghost" disabled={!screenOpen} onClick={() => play('verdict')}>
            Preview the verdict
          </button>
          {preview && (
            <button className="link" onClick={stopPreview}>
              Stop
            </button>
          )}
        </div>
        <button
          className="ghost danger"
          onClick={() => {
            if (window.confirm('Put every setting back to its default?')) reset()
          }}
        >
          Restore the default settings
        </button>
      </section>
    </div>
  )
}

function Switch(props: { label: string; hint?: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={`setting ${props.disabled ? 'disabled' : ''}`}>
      <input type="checkbox" role="switch" checked={props.checked} disabled={props.disabled} onChange={(e) => props.onChange(e.target.checked)} />
      <span>
        <span className="setting-label">{props.label}</span>
        {props.hint && <span className="setting-hint">{props.hint}</span>}
      </span>
    </label>
  )
}

/** A segmented control: one choice out of a few, all visible at once. */
function Choice<T extends string>(props: {
  label: string
  options: { value: T; label: string; hint?: string }[]
  value: T
  disabled?: boolean
  onChange: (v: T) => void
}) {
  const current = props.options.find((o) => o.value === props.value)
  return (
    <fieldset className={`choice ${props.disabled ? 'disabled' : ''}`} disabled={props.disabled}>
      <legend>{props.label}</legend>
      <div className="segments">
        {props.options.map((o) => (
          <label key={o.value} className={o.value === props.value ? 'current' : ''}>
            <input type="radio" name={props.label} checked={o.value === props.value} onChange={() => props.onChange(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
      {current?.hint && <p className="setting-hint">{current.hint}</p>}
    </fieldset>
  )
}

export type { SettingsValue }
