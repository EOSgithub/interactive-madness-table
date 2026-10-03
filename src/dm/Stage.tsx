import { useEffect, useRef, useState } from 'react'
import * as E from '../shared/edit'
import { ROLL_STYLES } from '../shared/settings'
import { formatSize, mediaIds, tidy, type MediaKind } from '../shared/staging'
import type { Category, Entry, Outcome, RollStyle, Staging } from '../shared/types'
import { addFile, listFiles, removeFile, storageUse, urlFor, type MediaFile } from '../state/media'
import { usePresence } from '../state/sync'
import { useStore } from '../state/store'
import { Monitor } from './Monitor'
import { useSound } from './sound'

// Stage: the DM's own files, and which result plays which. A result can have an
// image that fades in, a video, a sound, and its own roll animation. An outcome's
// choices win over its entry's; what neither sets comes from Settings.

const PREVIEW_MS = 12000

export function Stage() {
  const tables = useStore((s) => s.tables)
  const [files, setFiles] = useState<MediaFile[]>([])
  const [selected, setSelected] = useState(tables.categories[0]?.id ?? null)
  const category = tables.categories.find((c) => c.id === selected) ?? tables.categories[0] ?? null
  const refresh = () => void listFiles().then(setFiles)
  useEffect(refresh, [])

  // A test ends by itself, and when the DM leaves this tab.
  const stopPreview = useStore((s) => s.stopPreview)
  const startPreview = useStore((s) => s.startPreview)
  const timer = useRef(0)
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      stopPreview()
    },
    [stopPreview]
  )
  function test(target: { categoryId: string; entryId: string; outcomeId?: string }) {
    window.clearTimeout(timer.current)
    startPreview('verdict', target)
    timer.current = window.setTimeout(stopPreview, PREVIEW_MS)
  }

  const used = new Set(tables.categories.flatMap((c) => c.entries.flatMap((e) => [...mediaIds(e.staging), ...e.outcomes.flatMap((o) => mediaIds(o.staging))])))

  return (
    <div className="stage-tab">
      <Library files={files} used={used} onChange={refresh} />
      <section className="stage-main">
        <nav className="pills" aria-label="Categories">
          {tables.categories.map((c) => (
            <button key={c.id} className={c.id === category?.id ? 'current' : ''} onClick={() => setSelected(c.id)}>
              {c.label}
            </button>
          ))}
        </nav>
        <Notices />
        {category && (
          <ol className="stage-rows">
            {[...category.entries]
              .sort((a, b) => a.range[0] - b.range[0])
              .map((entry) => (
                <EntryStage key={entry.id} category={category} entry={entry} files={files} onTest={test} />
              ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function Notices() {
  const screenOpen = usePresence((s) => s.open)
  const blocked = useSound((s) => s.blocked)
  const preview = useStore((s) => s.preview)
  const stopPreview = useStore((s) => s.stopPreview)
  return (
    <>
      <p className="hint">
        {screenOpen
          ? 'Test plays a result on the monitor and on the player screen, without a real roll. Sound comes from this window.'
          : 'Test plays a result on the monitor, without a real roll. Sound comes from this window.'}
        {preview && (
          <>
            {' '}
            <button className="link" onClick={stopPreview}>
              Stop the test
            </button>
          </>
        )}
      </p>
      {blocked && (
        <p className="note bad" role="alert">
          The browser blocked the sound. Click anywhere in this window and test again.
        </p>
      )}
    </>
  )
}

function Library({ files, used, onChange }: { files: MediaFile[]; used: Set<string>; onChange: () => void }) {
  const picker = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [use, setUse] = useState<{ used: number; quota: number } | null>(null)
  useEffect(() => void storageUse().then(setUse), [files])

  async function upload(list: File[]) {
    const faults: string[] = []
    for (const file of list) {
      const result = await addFile(file)
      if (!result.ok) faults.push(result.error)
    }
    setErrors(faults)
    onChange()
  }

  return (
    <aside className="library">
      <Monitor label="Tests play here." />
      <h2>Your files</h2>
      <button className="ghost" onClick={() => picker.current?.click()}>
        Add images, videos or sounds
      </button>
      <input
        ref={picker}
        type="file"
        accept="image/*,video/*,audio/*"
        multiple
        hidden
        onChange={(e) => {
          // Copy the list first: clearing the input below empties the live FileList.
          if (e.target.files?.length) void upload([...e.target.files])
          e.target.value = ''
        }}
      />
      {errors.map((error) => (
        <p key={error} className="note bad" role="alert">
          {error}
        </p>
      ))}
      {files.length === 0 ? (
        <p className="hint">Nothing yet. Files stay in this browser, on this computer.</p>
      ) : (
        <ul className="file-list">
          {files.map((f) => (
            <FileRow key={f.id} file={f} inUse={used.has(f.id)} onChange={onChange} />
          ))}
        </ul>
      )}
      {use && (
        <p className="hint">
          {formatSize(use.used)} used of about {formatSize(use.quota)} this browser allows.
        </p>
      )}
    </aside>
  )
}

function FileRow({ file, inUse, onChange }: { file: MediaFile; inUse: boolean; onChange: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => void urlFor(file.id).then(setUrl, () => setUrl(null)), [file.id])
  return (
    <li className="file">
      <div className="file-thumb">
        {url && file.kind === 'image' && <img src={url} alt="" />}
        {url && file.kind === 'video' && <video src={url} muted preload="metadata" />}
        {file.kind === 'audio' && <span>Sound</span>}
      </div>
      <div className="file-info">
        <span className="file-name" title={file.name}>
          {file.name}
        </span>
        <span className="hint">
          {file.kind}, {formatSize(file.size)}
          {inUse ? ', in use' : ''}
        </span>
        {url && file.kind === 'audio' && <audio src={url} controls preload="none" />}
      </div>
      <button
        className="link"
        onClick={() => {
          const warning = inUse ? `"${file.name}" is used by a result. Delete it anyway?` : `Delete "${file.name}"?`
          if (window.confirm(warning)) void removeFile(file.id).then(onChange)
        }}
      >
        Delete
      </button>
    </li>
  )
}

type Test = (target: { categoryId: string; entryId: string; outcomeId?: string }) => void

function EntryStage({ category, entry, files, onTest }: { category: Category; entry: Entry; files: MediaFile[]; onTest: Test }) {
  const edit = useStore((s) => s.edit)
  const staged = mediaIds(entry.staging).length + entry.outcomes.reduce((n, o) => n + mediaIds(o.staging).length, 0)
  const [open, setOpen] = useState(false)
  return (
    <li className={`row ${open ? 'open' : ''}`}>
      <div className="row-head">
        <span className="range">
          {entry.range[0]} to {entry.range[1]}
        </span>
        <button className="row-title" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span>{entry.title || 'Untitled'}</span>
          {staged > 0 && <span className="badge quiet">{staged}</span>}
          <span className="chevron">{open ? 'Close' : 'Stage'}</span>
        </button>
      </div>
      {open && (
        <div className="row-body">
          <StagingEditor
            label={category.subRoll ? 'For every outcome of this entry' : 'When this entry comes up'}
            value={entry.staging}
            files={files}
            onChange={(staging) => edit(E.patchEntry(category.id, entry.id, { staging }))}
            onTest={() => onTest({ categoryId: category.id, entryId: entry.id })}
          />
          {category.subRoll &&
            [...entry.outcomes]
              .sort((a, b) => a.range[0] - b.range[0])
              .map((o) => (
                <StagingEditor
                  key={o.id}
                  label={`${outcomeName(o)}, ${o.range[0]} to ${o.range[1]}: overrides the entry`}
                  kind={o.kind}
                  value={o.staging}
                  files={files}
                  onChange={(staging) => edit(E.patchOutcome(category.id, entry.id, o.id, { staging }))}
                  onTest={() => onTest({ categoryId: category.id, entryId: entry.id, outcomeId: o.id })}
                />
              ))}
        </div>
      )}
    </li>
  )
}

const outcomeName = (o: Outcome) => ({ boon: 'Boon', neutral: 'Neutral', bane: 'Bane' })[o.kind]

function StagingEditor(props: {
  label: string
  kind?: Outcome['kind']
  value?: Staging
  files: MediaFile[]
  onChange: (s: Staging | undefined) => void
  onTest: () => void
}) {
  const value = props.value ?? {}
  const patch = (p: Partial<Staging>) => props.onChange(tidy({ ...value, ...p }))
  const hasSound = Boolean(value.audio || value.video)
  return (
    <fieldset className={`staging ${props.kind ?? ''}`}>
      <legend>{props.label}</legend>
      <label>
        <span>Roll animation</span>
        <select value={value.animation ?? ''} onChange={(e) => patch({ animation: (e.target.value || undefined) as RollStyle | undefined })}>
          <option value="">As in Settings</option>
          {ROLL_STYLES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <FilePick label="Image, fades in" kind="image" value={value.image} files={props.files} onChange={(image) => patch({ image })} />
      <FilePick label="Video" kind="video" value={value.video} files={props.files} onChange={(video) => patch({ video })} />
      <FilePick label="Sound" kind="audio" value={value.audio} files={props.files} onChange={(audio) => patch({ audio })} />
      {hasSound && (
        <>
          <label>
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={value.volume ?? 1}
              onChange={(e) => patch({ volume: Number(e.target.value) })}
            />
          </label>
          <label className="switch">
            <input type="checkbox" checked={value.loop ?? false} onChange={(e) => patch({ loop: e.target.checked })} />
            Loop the sound
          </label>
        </>
      )}
      <button className="ghost" onClick={props.onTest}>
        Test
      </button>
    </fieldset>
  )
}

function FilePick(props: { label: string; kind: MediaKind; value?: string; files: MediaFile[]; onChange: (id: string | undefined) => void }) {
  const options = props.files.filter((f) => f.kind === props.kind)
  const missing = props.value && !options.some((f) => f.id === props.value)
  return (
    <label>
      <span>{props.label}</span>
      <select value={props.value ?? ''} onChange={(e) => props.onChange(e.target.value || undefined)}>
        <option value="">None</option>
        {missing && <option value={props.value}>A file that is no longer here</option>}
        {options.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>
    </label>
  )
}
