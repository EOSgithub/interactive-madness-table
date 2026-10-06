import { Check, Copy, DownloadSimple, Plus, Trash, UploadSimple, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { exportTableSet, readTableSet } from '../shared/io'
import { DEFAULT_SETS } from '../content/defaults'
import { countEntries } from '../shared/library'
import { THEMES, themeOf } from '../shared/themes'
import type { TableSet } from '../shared/types'
import { useStore } from '../state/store'

// The DM's saved table sets: open one, start a new one, copy, import, export,
// delete. Opening a set makes it the one Play rolls on and Edit changes; the
// others wait in the browser's storage, untouched.

export function downloadSet(tables: TableSet) {
  const url = URL.createObjectURL(new Blob([exportTableSet(tables)], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${tables.name.trim().replace(/[^\w-]+/g, '-').toLowerCase() || 'madness-tables'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export interface Message {
  ok: boolean
  text: string
}

/** A hidden file picker that reads a table set and adds it to the library as a new set. */
export function useImport(onMessage: (m: Message) => void) {
  const createSet = useStore((s) => s.createSet)
  const picker = useRef<HTMLInputElement>(null)
  const input = (
    <input
      ref={picker}
      type="file"
      accept="application/json,.json"
      hidden
      onChange={(e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        void file.text().then((text) => {
          const result = readTableSet(text)
          if (result.ok) {
            createSet(result.tables)
            onMessage({ ok: true, text: `Added "${result.tables.name}" as a new set and opened it.` })
          } else {
            onMessage({ ok: false, text: `Not loaded. ${result.error}` })
          }
        })
      }}
    />
  )
  return { input, pick: () => picker.current?.click() }
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

const day = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** A modal dialog with a title and a close button. showModal gives the focus trap, the Esc key and the backdrop for free. */
export function Dialog(props: { open: boolean; onClose: () => void; onClosed?: () => void; title: string; children: ReactNode }) {
  const { open, onClose, onClosed } = props
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
    if (!open) onClosed?.()
  }, [open, onClosed])

  return (
    <dialog
      ref={dialog}
      className="dialog"
      aria-label={props.title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose() // a click on the backdrop
      }}
    >
      <div className="dialog-body">
        <header className="dialog-head">
          <h2>{props.title}</h2>
          <button className="icon" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </header>
        {props.children}
      </div>
    </dialog>
  )
}

export function SetsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sets = useStore((s) => s.sets)
  const activeId = useStore((s) => s.activeId)
  const tables = useStore((s) => s.tables)
  const switchSet = useStore((s) => s.switchSet)
  const createSet = useStore((s) => s.createSet)
  const deleteSet = useStore((s) => s.deleteSet)
  const [message, setMessage] = useState<Message | null>(null)
  const { input, pick } = useImport(setMessage)
  const clear = useCallback(() => setMessage(null), [])

  return (
    <Dialog open={open} onClose={onClose} title="Your table sets" onClosed={clear}>
        <p className="hint">Each set is saved in this browser. Open one to play and edit it; the others stay as they are.</p>

        <ul className="set-list">
          {sets.map((set) => {
            const active = set.id === activeId
            // The active set is shown from the working copy, which is the freshest.
            const t = active ? tables : set.tables
            return (
              <li key={set.id} className={active ? 'current' : ''}>
                <button
                  className="set-open"
                  aria-current={active}
                  onClick={() => {
                    switchSet(set.id)
                    onClose()
                  }}
                >
                  <span className="set-name">{t.name || 'Untitled tables'}</span>
                  <span className="set-meta">
                    {THEMES.find((x) => x.id === themeOf(t))?.label}. {count(t.categories.length, 'table', 'tables')},{' '}
                    {count(countEntries(t), 'entry', 'entries')}. Changed {day.format(set.updatedAt)}
                  </span>
                </button>
                {active ? (
                  <span className="set-active">
                    <Check /> Open
                  </span>
                ) : (
                  <button
                    className="icon danger"
                    aria-label={`Delete ${t.name}`}
                    onClick={() => {
                      if (window.confirm(`Delete "${t.name}" for good? Export it first if you might want it back.`)) deleteSet(set.id)
                    }}
                  >
                    <Trash />
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        <div className="sets-actions">
          <button className="ghost" onClick={() => createSet('blank')}>
            <Plus /> New empty set
          </button>
          <button className="ghost" onClick={() => createSet('copy')}>
            <Copy /> Copy the open set
          </button>
          <button className="ghost" onClick={pick}>
            <UploadSimple /> Import a file
          </button>
          <button className="ghost" onClick={() => downloadSet(tables)}>
            <DownloadSimple /> Export the open set
          </button>
          {input}
        </div>

        <h3>Start from a default</h3>
        <p className="hint">One for each theme. You get your own copy to change.</p>
        <div className="sets-actions">
          {DEFAULT_SETS.map((d) => (
            <button key={d.name} className="ghost" onClick={() => createSet(d)}>
              {d.name}
            </button>
          ))}
        </div>
        {message && (
          <p className={message.ok ? 'note' : 'note bad'} role="status">
            {message.text}
          </p>
        )}
    </Dialog>
  )
}
