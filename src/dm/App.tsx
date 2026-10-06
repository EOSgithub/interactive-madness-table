import {
  ArrowCounterClockwise,
  ArrowLeft,
  Books,
  CaretDown,
  CaretRight,
  DiceFive,
  FilmSlate,
  IconContext,
  Info,
  PencilSimpleLine,
  SkipForward,
  SlidersHorizontal
} from '@phosphor-icons/react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { fairRoll } from '../shared/dice'
import { checkCategory, findEntry } from '../shared/tables'
import { themeOf } from '../shared/themes'
import type { Category } from '../shared/types'
import { currentCategory, useStore, type Verdict } from '../state/store'
import { Editor } from './Editor'
import { Monitor } from './Monitor'
import { ScreenControl } from './ScreenControl'
import { Dialog, SetsDialog } from './Sets'
import { Settings } from './Settings'
import { useKeys } from './shortcuts'
import { Stage } from './Stage'
import { TableMode } from './TableMode'

// The DM window: the rail, the top bar, the four sections and the play screen.

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
  const theme = useStore((s) => themeOf(s.tables))
  const [tab, setTab] = useState<Tab>('play')
  const [tableMode, setTableMode] = useState(false)
  const [sets, setSets] = useState(false)
  const [about, setAbout] = useState(false)
  const modal = sets || about
  useKeys({ t: () => setTableMode((open) => !open) }, (tab === 'play' || tableMode) && !modal)

  // The whole window takes the look of the open set's theme (styles/themes.css).
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <IconContext.Provider value={{ weight: 'regular', size: '1.2em' }}>
      {/* "user": someone who asked the system for less motion gets fades and no movement. */}
      <MotionConfig reducedMotion="user">
        <div className="app">
          {/* The rail: where you are in the tool. On a phone it becomes a bar along the bottom. */}
          <aside className="rail">
            <nav className="tabs" aria-label="Sections">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} className={tab === id ? 'current' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
                  {tab === id && <motion.span className="tab-mark" layoutId="tab-mark" transition={{ type: 'spring', stiffness: 420, damping: 36 }} />}
                  <Icon weight={tab === id ? 'fill' : 'regular'} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
            <button className="rail-about" onClick={() => setAbout(true)}>
              <Info />
              <span>About</span>
            </button>
          </aside>

          <div className="main">
            {/* The bar: which set is open, and the state of the player screen. */}
            <header className="top">
              <h1>
                Interactive <em>Madness</em> Table
              </h1>
              <button className="set-switch" onClick={() => setSets(true)} title="Open, add or switch table sets">
                <Books />
                <span className="set-switch-name">{name || 'Untitled tables'}</span>
                <CaretDown size="0.9em" />
              </button>
              <ScreenControl onTableMode={() => setTableMode(true)} />
            </header>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tab} className="section" {...arrive}>
                {tab === 'play' ? <Play paused={modal} /> : tab === 'edit' ? <Editor /> : tab === 'stage' ? <Stage /> : <Settings />}
              </motion.div>
            </AnimatePresence>
          </div>

          <SetsDialog open={sets} onClose={() => setSets(false)} />
          <AboutDialog open={about} onClose={() => setAbout(false)} />
          {tableMode && <TableMode onClose={() => setTableMode(false)} />}
        </div>
      </MotionConfig>
    </IconContext.Provider>
  )
}

/** Who made the tool, and the licences of what it is built from. */
function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="About">
      <div className="about">
        <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" />
        <p>
          Interactive Madness Table is a ToolsmithDev tool. New tools and early builds are on{' '}
          <a href={PATREON} target="_blank" rel="noreferrer">
            Patreon
          </a>
          .
        </p>
      </div>
      <h3>Licences</h3>
      <p className="legal">
        This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC, available at
        https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0
        International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.
      </p>
      <p className="legal">
        The fonts are Bodoni Moda, Geist, EB Garamond, Josefin Sans, Fraunces, IM Fell English, Special Elite and Cinzel, under the SIL
        Open Font License 1.1. The icons are Phosphor Icons, under the MIT
        License. The face of the moon is a photograph by NASA/GSFC/Arizona State University and the eclipse is one by NASA/Carla Thomas, both in the
        public domain. The eye in the Surreal theme is a lithograph by Odilon Redon, from 1882, and the gorgon in the Hellenic theme is a photograph by Bibi Saint-Pol of an Attic cup
        in Paris, both in the public domain.
      </p>
    </Dialog>
  )
}

/** The play screen: the monitor, and the roll beside it. */
function Play({ paused }: { paused: boolean }) {
  const step = useStore((s) => s.step)
  return (
    <div className="layout">
      <div className="stage-col">
        <Monitor>
          <ShowControls />
        </Monitor>
      </div>
      <div className="side-col">
        <main className="panel step" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} {...arrive}>
              {step === 'category' && <ChooseCategory paused={paused} />}
              {step === 'first' && <RollStep which="first" />}
              {step === 'second' && <RollStep which="second" />}
              {step === 'verdict' && <VerdictStep />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
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
      <button className="chip" onClick={replay} disabled={!running}>
        <ArrowCounterClockwise /> Play it again
      </button>
      <button className="chip" onClick={skip} disabled={!running}>
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
      <p className="crumb">Choose a table</p>
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
                <CaretRight className="table-go" />
              </button>
              <span className="table-dice">
                d{c.die}
                {c.subRoll ? `, then d${c.subDie}` : ''}
              </span>
              {/* A table whose entries have no outcomes is a one-roll table: the effect comes with the first die. */}
              {c.entries.some((e) => e.outcomes.length > 0) && (
                <label className="switch">
                  <input type="checkbox" role="switch" checked={c.subRoll} onChange={() => toggle(c.id)} />
                  Second roll
                </label>
              )}
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
      <button className="chip" onClick={back}>
        <ArrowLeft /> Back
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

function VerdictCard({ verdict }: { verdict: Verdict }) {
  return (
    <article className={`verdict ${verdict.kind ?? 'plain'}`}>
      <p className="tags">
        <span>{verdict.categoryLabel}</span>
        <span>
          rolled {verdict.first}
          {verdict.second !== null && `, then ${verdict.second}`}
        </span>
        {verdict.kind && <span className="kind">{KIND_LABEL[verdict.kind]}</span>}
      </p>
      <h3>{verdict.title}</h3>
      <p className="lead">{verdict.description}</p>
      {verdict.text && (
        <p className="effect">
          <strong>{verdict.duration}</strong> {verdict.text}
        </p>
      )}
    </article>
  )
}
