import {
  ArrowCounterClockwise,
  Books,
  CaretDown,
  DiceFive,
  Eye,
  FilmSlate,
  IconContext,
  PencilSimpleLine,
  SkipForward,
  SlidersHorizontal
} from '@phosphor-icons/react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useState } from 'react'
import { fairRoll } from '../shared/dice'
import { checkCategory, findEntry } from '../shared/tables'
import type { Category } from '../shared/types'
import { currentCategory, useStore, type Verdict } from '../state/store'
import { Editor } from './Editor'
import { Monitor } from './Monitor'
import { ScreenControl } from './ScreenControl'
import { SetsDialog } from './Sets'
import { Settings } from './Settings'
import { useKeys } from './shortcuts'
import { Stage } from './Stage'
import { TableMode } from './TableMode'

// The DM window: the header, the four sections, the play screen and the footer.

const PATREON = 'https://www.patreon.com/ToolsmithDev'

const KIND_LABEL = { boon: 'Boon', neutral: 'Manifestation', bane: 'Bane' } as const

const TABS = [
  { id: 'play', label: 'Play', icon: DiceFive },
  { id: 'edit', label: 'Edit', icon: PencilSimpleLine },
  { id: 'stage', label: 'Stage', icon: FilmSlate },
  { id: 'settings', label: 'Settings', icon: SlidersHorizontal }
] as const

type Tab = (typeof TABS)[number]['id']

/** How a section, or a step of the roll, arrives and leaves. */
const arrive = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.16, ease: 'easeIn' as const } }
}

export function App() {
  const name = useStore((s) => s.tables.name)
  const insight = useStore((s) => s.history.length)
  const toggleBlackout = useStore((s) => s.toggleBlackout)
  const [tab, setTab] = useState<Tab>('play')
  const [tableMode, setTableMode] = useState(false)
  const [sets, setSets] = useState(false)
  useKeys({ b: toggleBlackout, t: () => setTableMode((open) => !open) }, (tab === 'play' || tableMode) && !sets)

  return (
    <IconContext.Provider value={{ weight: 'light', size: '1.15em' }}>
      {/* "user": someone who asked the system for less motion gets fades and no movement. */}
      <MotionConfig reducedMotion="user">
        <div className="shell">
          <header className="top">
            <h1>Interactive Madness Table</h1>
            <nav className="tabs" aria-label="Sections">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} className={tab === id ? 'current' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
                  <Icon />
                  <span>{label}</span>
                  {tab === id && <motion.span className="tab-mark" layoutId="tab-mark" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                </button>
              ))}
            </nav>
            <button className="set-switch" onClick={() => setSets(true)} title="Open, add or switch table sets">
              <Books />
              <span className="set-switch-name">{name || 'Untitled tables'}</span>
              <CaretDown />
            </button>
            <p className="insight" title="Verdicts this session. The moon on the player screen reddens as it grows.">
              <Eye />
              <span className="insight-count">{insight}</span>
              <span className="insight-label">Insight</span>
            </p>
          </header>
          <ScreenControl onTableMode={() => setTableMode(true)} />
          <SetsDialog open={sets} onClose={() => setSets(false)} />
          {tableMode && <TableMode onClose={() => setTableMode(false)} />}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} className="section" {...arrive}>
              {tab === 'play' ? <Play paused={sets} /> : tab === 'edit' ? <Editor /> : tab === 'stage' ? <Stage /> : <Settings />}
            </motion.div>
          </AnimatePresence>
          <footer className="foot">
            <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" />
            <p>
              A ToolsmithDev tool. New tools and early builds are on{' '}
              <a href={PATREON} target="_blank" rel="noreferrer">
                Patreon
              </a>
              .
            </p>
            <p className="legal">
              This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, available at
              https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0
              International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.
            </p>
          </footer>
        </div>
      </MotionConfig>
    </IconContext.Provider>
  )
}

/** The play screen: the monitor, the step of the roll under it, and the session beside them. */
function Play({ paused }: { paused: boolean }) {
  const step = useStore((s) => s.step)
  const shortcuts = useStore((s) => s.settings.shortcuts)
  return (
    <div className="layout">
      <main className="stage">
        <Monitor />
        <ShowControls />
        <div className="step" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} {...arrive}>
              {step === 'category' && <ChooseCategory paused={paused} />}
              {step === 'first' && <RollStep which="first" />}
              {step === 'second' && <RollStep which="second" />}
              {step === 'verdict' && <VerdictStep />}
            </motion.div>
          </AnimatePresence>
        </div>
        {shortcuts && (
          <p className="keys">
            <kbd>1</kbd> to <kbd>9</kbd> pick a table, <kbd>Space</kbd> or <kbd>R</kbd> rolls, <kbd>Esc</kbd> goes back, <kbd>B</kbd> blacks out the
            player screen, <kbd>T</kbd> opens table mode.
          </p>
        )}
      </main>
      <History />
    </div>
  )
}

/** Play the show again, or jump to its end, in every window at once. */
function ShowControls() {
  const step = useStore((s) => s.step)
  const replay = useStore((s) => s.replay)
  const skip = useStore((s) => s.skip)
  const running = step === 'second' || step === 'verdict'
  return (
    <div className="show-controls">
      <button className="link" onClick={replay} disabled={!running}>
        <ArrowCounterClockwise /> Play it again
      </button>
      <button className="link" onClick={skip} disabled={!running}>
        <SkipForward /> Skip to the end
      </button>
    </div>
  )
}

function ChooseCategory({ paused }: { paused: boolean }) {
  const categories = useStore((s) => s.tables.categories)
  const choose = useStore((s) => s.chooseCategory)
  const toggle = useStore((s) => s.toggleSubRoll)
  // 1 to 9 pick a table, in the order shown.
  useKeys(
    Object.fromEntries(categories.slice(0, 9).map((c, i) => [String(i + 1), checkCategory(c).length === 0 ? () => choose(c.id) : undefined])),
    !paused
  )
  return (
    <section>
      <h2>Which madness takes hold?</h2>
      <ol className="tables">
        {categories.map((c, i) => {
          const broken = checkCategory(c)
          return (
            <li key={c.id} className="table-row">
              <button className="table-main" onClick={() => choose(c.id)} disabled={broken.length > 0}>
                {i < 9 && <kbd>{i + 1}</kbd>}
                <span className="table-text">
                  <span className="table-title">{c.label || 'Untitled'}</span>
                  {c.blurb && <span className="table-blurb">{c.blurb}</span>}
                </span>
                <span className="table-dice">
                  d{c.die}
                  {c.subRoll ? `, then d${c.subDie}` : ''}
                </span>
              </button>
              <label className="switch">
                <input type="checkbox" role="switch" checked={c.subRoll} onChange={() => toggle(c.id)} />
                Second roll
              </label>
              {broken.length > 0 && <p className="table-error">{broken[0].message} Fix it in the editor.</p>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function RollStep({ which }: { which: 'first' | 'second' }) {
  // Null for a moment while this step leaves the screen after the roll was dropped.
  const category = useStore(currentCategory) as Category | null
  const first = useStore((s) => s.first)
  const roll = useStore((s) => (which === 'first' ? s.rollFirst : s.rollSecond))
  const back = useStore((s) => s.back)
  const sides = (which === 'first' ? category?.die : category?.subDie) ?? 2
  const entry = category && which === 'second' && first !== null ? findEntry(category, first) : null
  const [manual, setManual] = useState('')
  const typed = Number(manual)
  const valid = manual !== '' && Number.isInteger(typed) && typed >= 1 && typed <= sides

  // The roll is committed at once: the monitor above and the player screen start the show at the same moment.
  const rollNow = () => roll(fairRoll(sides))
  useKeys({ space: rollNow, r: rollNow, escape: back })
  if (!category) return null

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
        <button className="primary" onClick={rollNow}>
          <DiceFive weight="fill" /> Roll d{sides}
        </button>
        <form
          className="manual"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) roll(typed)
          }}
        >
          <label htmlFor="manual">or enter the table's roll, 1 to {sides}</label>
          <input id="manual" type="number" inputMode="numeric" min={1} max={sides} value={manual} onChange={(e) => setManual(e.target.value)} />
          <button type="submit" className="ghost" disabled={!valid}>
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
  const verdict = useStore((s) => s.verdict)
  const restart = useStore((s) => s.restart)
  useKeys({ space: restart, r: restart })
  if (!verdict) return null // leaving the screen after a restart
  return (
    <section>
      <VerdictCard verdict={verdict} />
      <div className="roll">
        <button className="primary" onClick={restart}>
          Roll for someone else
        </button>
      </div>
    </section>
  )
}

function VerdictCard({ verdict, compact = false }: { verdict: Verdict; compact?: boolean }) {
  return (
    <article className={`verdict ${verdict.kind ?? 'plain'} ${compact ? 'compact' : ''}`}>
      <p className="tags">
        <span>{verdict.categoryLabel}</span>
        <span>
          rolled {verdict.first}
          {verdict.second !== null && `, then ${verdict.second}`}
        </span>
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
        <p className="hint">No one has gone mad yet. Every verdict lands here, newest first.</p>
      ) : (
        <ol>
          <AnimatePresence initial={false}>
            {history.map((v) => (
              <motion.li
                key={v.id}
                layout
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              >
                <VerdictCard verdict={v} compact />
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </aside>
  )
}
