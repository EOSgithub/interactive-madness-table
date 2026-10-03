import { useEffect, useRef } from 'react'
import { useStore } from '../state/store'

// Keyboard shortcuts for the DM. They are single keys, so they follow the rules
// that keep single keys safe (WCAG 2.1.4): they can be switched off in Settings,
// they never fire while the DM is typing, and they leave alone any key pressed
// together with Ctrl, Alt or Cmd, which belongs to the browser.

const FIELDS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
/** Space and Enter already press the control that has focus. */
const PRESSABLE = new Set(['BUTTON', 'A', 'SUMMARY'])

/** The name a key is listed under: letters in lower case, the space bar as "space". */
export function keyName(key: string): string {
  return key === ' ' ? 'space' : key.toLowerCase()
}

/** True when the key press belongs to the page and not to a shortcut. */
export function belongsToPage(e: { ctrlKey: boolean; metaKey: boolean; altKey: boolean; repeat: boolean }, key: string, tag: string, editable: boolean): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return true
  if (FIELDS.has(tag) || editable) return true
  return (key === 'space' || key === 'enter') && PRESSABLE.has(tag)
}

/**
 * Runs a handler when its key is pressed, for as long as the component is mounted.
 * Keys are named as in keyName: 'r', '1', 'space', 'escape'.
 */
export function useKeys(keys: Record<string, (() => void) | undefined>, enabled = true) {
  const on = useStore((s) => s.settings.shortcuts)
  // The handlers change at every render; the listener reads the latest ones.
  const latest = useRef(keys)
  latest.current = keys

  useEffect(() => {
    if (!on || !enabled) return
    const onKey = (e: KeyboardEvent) => {
      const key = keyName(e.key)
      const handler = latest.current[key]
      if (!handler) return
      const target = e.target instanceof HTMLElement ? e.target : null
      if (belongsToPage(e, key, target?.tagName ?? '', target?.isContentEditable ?? false)) return
      e.preventDefault() // the space bar would scroll the page
      handler()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [on, enabled])
}
