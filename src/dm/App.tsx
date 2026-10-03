import { useState } from 'react'
import { checkCategory, findEntry } from '../shared/tables'
import type { Category } from '../shared/types'
import { currentCategory, useStore, type Verdict } from '../state/store'
import { Editor } from './Editor'

// The DM window, play screen. Editor, stage and settings come in later phases.

const KIND_LABEL = { boon: 'Boon', neutral: 'Manifestation', bane: 'Bane' } as const

type Tab = 'play' | 'edit'

export function App() {
  const step = useStore((s) => s.step)
  const name = useStore((s) => s.tables.name)
  const [tab, setTab] = useState<Tab>('play')
  return (
    <div className="shell">
      <header className="top">
        <h1>Interactive Madness Table</h1>
        <nav className="tabs" aria-label="Sections">
          <button className={tab === 'play' ? 'current' : ''} onClick={() => setTab('play')}>
            Play
          </button>
          <button className={tab === 'edit' ? 'current' : ''} onClick={() => setTab('edit')}>
            Edit
          </button>
        </nav>
        <span className="top-note">{name}</span>
      </header>
      {tab === 'play' ? (
        <div className="layout">
          <main className="stage" aria-live="polite">
            {step === 'category' && <ChooseCategory />}
            {step === 'first' && <RollStep which="first" />}
            {step === 'second' && <RollStep which="second" />}
            {step === 'verdict' && <VerdictStep />}
          </main>
          <History />
        </div>
      ) : (
        <Editor />
      )}
    </div>
  )
}

function ChooseCategory() {
  const categories = useStore((s) => s.tables.categories)
  const choose = useStore((s) => s.chooseCategory)
  const toggle = useStore((s) => s.toggleSubRoll)
  return (
    <section>
      <h2>Which madness takes hold?</h2>
      <div className="cards">
        {categories.map((c) => {
          const broken = checkCategory(c)
          return (
            <article key={c.id} className="card">
              <button className="card-main" onClick={() => choose(c.id)} disabled={broken.length > 0}>
                <span className="card-title">{c.label}</span>
                <span className="card-blurb">{c.blurb}</span>
                <span className="card-dice">
                  d{c.die}
                  {c.subRoll ? `, then d${c.subDie}` : ''}
                </span>
              </button>
              {broken.length > 0 && <p className="card-error">{broken[0].message} Fix it in the editor.</p>}
              <label className="switch">
                <input type="checkbox" checked={c.subRoll} onChange={() => toggle(c.id)} />
                Second roll
              </label>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function RollStep({ which }: { which: 'first' | 'second' }) {
  const category = useStore(currentCategory) as Category
  const first = useStore((s) => s.first)
  const roll = useStore((s) => (which === 'first' ? s.rollFirst : s.rollSecond))
  const back = useStore((s) => s.back)
  const sides = which === 'first' ? category.die : category.subDie
  const entry = which === 'second' && first !== null ? findEntry(category, first) : null
  const [manual, setManual] = useState('')
  const typed = Number(manual)
  const valid = manual !== '' && Number.isInteger(typed) && typed >= 1 && typed <= sides

  return (
    <section>
      <p className="crumb">{category.label}</p>
      {entry ? (
        <>
          <h2>{entry.title}</h2>
          <p className="lead">{entry.description}</p>
          <p className="hint">
            The d{category.die} came up {first}. Now the d{sides} decides how it shows.
          </p>
        </>
      ) : (
        <h2>Roll the d{sides}</h2>
      )}
      <div className="roll">
        <button className="primary" onClick={() => roll()}>
          Roll d{sides}
        </button>
        <form
          className="manual"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) roll(typed)
          }}
        >
          <label htmlFor="manual">or enter the table's roll (1-{sides})</label>
          <input
            id="manual"
            type="number"
            inputMode="numeric"
            min={1}
            max={sides}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <button type="submit" disabled={!valid}>
            Use it
          </button>
        </form>
      </div>
      <button className="link" onClick={back}>
        Back
      </button>
    </section>
  )
}

function VerdictStep() {
  const verdict = useStore((s) => s.verdict) as Verdict
  const restart = useStore((s) => s.restart)
  return (
    <section>
      <VerdictCard verdict={verdict} />
      <button className="primary" onClick={restart}>
        Roll for someone else
      </button>
    </section>
  )
}

function VerdictCard({ verdict, compact = false }: { verdict: Verdict; compact?: boolean }) {
  return (
    <article className={`verdict ${verdict.kind ?? 'plain'} ${compact ? 'compact' : ''}`}>
      <p className="tags">
        <span>{verdict.categoryLabel}</span>
        <span>first roll {verdict.first}</span>
        {verdict.second !== null && <span>second roll {verdict.second}</span>}
        {verdict.kind && <span className="kind">{KIND_LABEL[verdict.kind]}</span>}
      </p>
      <h3>{verdict.title}</h3>
      {!compact && <p className="lead">{verdict.description}</p>}
      {verdict.text && (
        <p className="effect">
          <strong>{verdict.duration}</strong> {verdict.text}
        </p>
      )}
    </article>
  )
}

function History() {
  const history = useStore((s) => s.history)
  const clear = useStore((s) => s.clearHistory)
  return (
    <aside className="history">
      <div className="history-head">
        <h2>This session</h2>
        {history.length > 0 && (
          <button className="link" onClick={clear}>
            Clear
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <p className="hint">Every verdict lands here, newest first.</p>
      ) : (
        <ol>
          {history.map((v) => (
            <li key={v.id}>
              <VerdictCard verdict={v} compact />
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}
