import { useEffect, useState } from 'react'
import * as E from '../shared/edit'
import { checkCategory, type Problem } from '../shared/tables'
import type { Category, Duration, Entry, Outcome, OutcomeKind, Range } from '../shared/types'
import { useStore } from '../state/store'
import { downloadSet, useImport, type Message } from './Sets'

// The editor: every category, entry and outcome of the tables can be changed
// here. Each field writes straight to the store, which saves on every change.

export function Editor() {
  const tables = useStore((s) => s.tables)
  const edit = useStore((s) => s.edit)
  const [selected, setSelected] = useState(tables.categories[0]?.id ?? null)
  const category = tables.categories.find((c) => c.id === selected) ?? tables.categories[0] ?? null

  return (
    <div className="editor">
      <aside className="editor-side">
        <label className="field">
          <span>Name of this set</span>
          <input value={tables.name} onChange={(e) => edit(E.renameSet(e.target.value))} />
        </label>
        <h2>Categories</h2>
        <ul className="category-list">
          {tables.categories.map((c) => {
            const faults = checkCategory(c).length
            return (
              <li key={c.id}>
                <button className={c.id === category?.id ? 'current' : ''} onClick={() => setSelected(c.id)}>
                  <span>{c.label || 'Untitled'}</span>
                  {faults > 0 && <span className="badge">{faults}</span>}
                </button>
              </li>
            )
          })}
        </ul>
        <button className="ghost" onClick={() => edit(E.addCategory())}>
          Add a category
        </button>
        <Files />
      </aside>
      {category ? (
        <CategoryForm key={category.id} category={category} canRemove={tables.categories.length > 1} />
      ) : (
        <p className="hint">There are no categories. Add one to start.</p>
      )}
    </div>
  )
}

function Files() {
  const tables = useStore((s) => s.tables)
  const resetTables = useStore((s) => s.resetTables)
  const [message, setMessage] = useState<Message | null>(null)
  // An imported file becomes a new set: it never overwrites the one being edited.
  const { input, pick } = useImport(setMessage)

  return (
    <div className="files">
      <h2>File</h2>
      <button className="ghost" onClick={() => downloadSet(tables)}>
        Export this set
      </button>
      <button className="ghost" onClick={pick}>
        Import as a new set
      </button>
      {input}
      <button
        className="ghost danger"
        onClick={() => {
          if (window.confirm('Replace the tables of this set with the default ones? Export first if you want to keep them.')) {
            resetTables()
            setMessage({ ok: true, text: 'Default tables restored.' })
          }
        }}
      >
        Restore the defaults
      </button>
      {message && (
        <p className={message.ok ? 'note' : 'note bad'} role="status">
          {message.text}
        </p>
      )}
    </div>
  )
}

function CategoryForm({ category, canRemove }: { category: Category; canRemove: boolean }) {
  const edit = useStore((s) => s.edit)
  const [open, setOpen] = useState<string | null>(null)
  const problems = checkCategory(category)
  const tableProblems = problems.filter((p) => !p.entryId)
  const patch = (p: Partial<Category>) => edit(E.patchCategory(category.id, p))

  return (
    <section className="editor-main">
      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input value={category.label} onChange={(e) => patch({ label: e.target.value })} />
        </label>
        <label className="field wide">
          <span>Line under the name</span>
          <input value={category.blurb} onChange={(e) => patch({ blurb: e.target.value })} />
        </label>
        <label className="field narrow">
          <span>First die</span>
          <NumberField value={category.die} min={2} max={1000} onChange={(die) => patch({ die })} />
        </label>
        <label className="switch field">
          <input type="checkbox" checked={category.subRoll} onChange={(e) => patch({ subRoll: e.target.checked })} />
          Second roll picks an outcome
        </label>
        {category.subRoll && (
          <label className="field narrow">
            <span>Second die</span>
            <NumberField value={category.subDie} min={2} max={1000} onChange={(subDie) => patch({ subDie })} />
          </label>
        )}
        <DurationFields duration={category.duration} onChange={(duration) => patch({ duration })} />
      </div>

      <div className="rows-head">
        <h2>Entries on the d{category.die}</h2>
        <button className="ghost" onClick={() => edit(E.spreadEntries(category.id))}>
          Spread evenly
        </button>
        <button className="ghost" onClick={() => edit(E.addEntry(category.id))}>
          Add an entry
        </button>
      </div>
      <Faults problems={tableProblems} />

      <ol className="rows">
        {[...category.entries]
          .sort((a, b) => a.range[0] - b.range[0])
          .map((entry) => (
            <EntryRow
              key={entry.id}
              category={category}
              entry={entry}
              problems={problems.filter((p) => p.entryId === entry.id)}
              open={open === entry.id}
              onToggle={() => setOpen(open === entry.id ? null : entry.id)}
            />
          ))}
      </ol>

      {canRemove && (
        <button
          className="ghost danger"
          onClick={() => {
            if (window.confirm(`Delete "${category.label}" and its ${category.entries.length} entries?`)) {
              edit(E.removeCategory(category.id))
            }
          }}
        >
          Delete this category
        </button>
      )}
    </section>
  )
}

function DurationFields({ duration, onChange }: { duration: Duration; onChange: (d: Duration) => void }) {
  return (
    <fieldset className="field wide duration">
      <legend>How long it lasts</legend>
      <select
        value={duration.kind}
        onChange={(e) =>
          onChange(e.target.value === 'dice' ? { kind: 'dice', die: 4, unit: 'minutes' } : { kind: 'fixed', text: 'From now on:' })
        }
      >
        <option value="fixed">A fixed line</option>
        <option value="dice">A rolled amount</option>
      </select>
      {duration.kind === 'fixed' ? (
        <input
          aria-label="Line shown before the effect"
          placeholder="From now on:"
          value={duration.text}
          onChange={(e) => onChange({ kind: 'fixed', text: e.target.value })}
        />
      ) : (
        <>
          <span>For the next 1d</span>
          <NumberField value={duration.die} min={2} max={1000} onChange={(die) => onChange({ ...duration, die })} />
          <input
            aria-label="Unit of time"
            placeholder="minutes"
            value={duration.unit}
            onChange={(e) => onChange({ ...duration, unit: e.target.value })}
          />
        </>
      )}
    </fieldset>
  )
}

function EntryRow(props: { category: Category; entry: Entry; problems: Problem[]; open: boolean; onToggle: () => void }) {
  const { category, entry, problems, open, onToggle } = props
  const edit = useStore((s) => s.edit)
  const patch = (p: Partial<Entry>) => edit(E.patchEntry(category.id, entry.id, p))

  return (
    <li className={`row ${open ? 'open' : ''}`}>
      <div className="row-head">
        <RangeFields range={entry.range} max={category.die} onChange={(range) => patch({ range })} label="Entry" />
        <button className="row-title" onClick={onToggle} aria-expanded={open}>
          <span>{entry.title || 'Untitled'}</span>
          {problems.length > 0 && <span className="badge">{problems.length}</span>}
          <span className="chevron">{open ? 'Close' : 'Edit'}</span>
        </button>
      </div>
      {open && (
        <div className="row-body">
          <label className="field">
            <span>Title</span>
            <input value={entry.title} onChange={(e) => patch({ title: e.target.value })} />
          </label>
          <label className="field">
            <span>Description, read aloud when the roll lands</span>
            <textarea rows={2} value={entry.description} onChange={(e) => patch({ description: e.target.value })} />
          </label>
          {category.subRoll ? (
            <Outcomes category={category} entry={entry} problems={problems} />
          ) : (
            <label className="field">
              <span>Effect</span>
              <textarea rows={3} value={entry.text ?? ''} onChange={(e) => patch({ text: e.target.value })} />
            </label>
          )}
          <button
            className="ghost danger"
            onClick={() => {
              if (window.confirm(`Delete "${entry.title}"?`)) edit(E.removeEntry(category.id, entry.id))
            }}
          >
            Delete this entry
          </button>
        </div>
      )}
    </li>
  )
}

function Outcomes({ category, entry, problems }: { category: Category; entry: Entry; problems: Problem[] }) {
  const edit = useStore((s) => s.edit)
  const patch = (id: string, p: Partial<Outcome>) => edit(E.patchOutcome(category.id, entry.id, id, p))
  return (
    <div className="outcomes">
      <div className="rows-head">
        <h3>Outcomes on the d{category.subDie}</h3>
        <button className="ghost" onClick={() => edit(E.spreadOutcomes(category.id, entry.id, category.subDie))}>
          Spread evenly
        </button>
        <button className="ghost" onClick={() => edit(E.addOutcome(category.id, entry.id, category.subDie))}>
          Add an outcome
        </button>
      </div>
      <Faults problems={problems} />
      {[...entry.outcomes]
        .sort((a, b) => a.range[0] - b.range[0])
        .map((o) => (
          <div key={o.id} className={`outcome ${o.kind}`}>
            <RangeFields range={o.range} max={category.subDie} onChange={(range) => patch(o.id, { range })} label="Outcome" />
            <select aria-label="Kind of outcome" value={o.kind} onChange={(e) => patch(o.id, { kind: e.target.value as OutcomeKind })}>
              <option value="boon">Boon</option>
              <option value="neutral">Neutral</option>
              <option value="bane">Bane</option>
            </select>
            <textarea aria-label="Outcome text" rows={2} value={o.text} onChange={(e) => patch(o.id, { text: e.target.value })} />
            <button className="ghost danger" onClick={() => edit(E.removeOutcome(category.id, entry.id, o.id))}>
              Remove
            </button>
          </div>
        ))}
    </div>
  )
}

function Faults({ problems }: { problems: Problem[] }) {
  if (problems.length === 0) return null
  return (
    <ul className="faults" role="alert">
      {problems.map((p, i) => (
        <li key={i}>{p.message}</li>
      ))}
    </ul>
  )
}

function RangeFields({ range, max, onChange, label }: { range: Range; max: number; onChange: (r: Range) => void; label: string }) {
  return (
    <span className="range">
      <NumberField aria-label={`${label} from`} value={range[0]} min={1} max={max} onChange={(n) => onChange([n, range[1]])} />
      <span>to</span>
      <NumberField aria-label={`${label} to`} value={range[1]} min={1} max={max} onChange={(n) => onChange([range[0], n])} />
    </span>
  )
}

/** A number box that lets the DM clear it and type, and only reports whole numbers in range. */
function NumberField(props: { value: number; min: number; max: number; onChange: (n: number) => void; 'aria-label'?: string }) {
  const { value, min, max, onChange } = props
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])
  return (
    <input
      className="number"
      type="number"
      inputMode="numeric"
      aria-label={props['aria-label']}
      min={min}
      max={max}
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const n = Number(e.target.value)
        if (e.target.value !== '' && Number.isInteger(n) && n >= min && n <= max) onChange(n)
      }}
      onBlur={() => setText(String(value))}
    />
  )
}
