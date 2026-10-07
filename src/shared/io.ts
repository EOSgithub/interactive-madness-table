import { BANNER_KINDS } from './banner'
import { parseTheme } from './themes'
import type { Category, Duration, Entry, Outcome, OutcomeKind, Range, Staging, TableSet } from './types'

// Reading a table set from a file the DM picked. The file is untrusted: it is
// parsed as `unknown` and every field is checked here, at the boundary, so the
// rest of the app can rely on the types. Errors say where the fault is.

export const FILE_KIND = 'interactive-madness-table'
export const FILE_VERSION = 1

export type Parsed = { ok: true; tables: TableSet } | { ok: false; error: string }

class Fault extends Error {}

const KINDS: OutcomeKind[] = ['boon', 'neutral', 'bane']

export function newId(): string {
  return crypto.randomUUID()
}

function obj(v: unknown, at: string): Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new Fault(`${at} should be an object.`)
  return v as Record<string, unknown>
}

function str(v: unknown, at: string, fallback?: string): string {
  if (typeof v === 'string') return v
  if (v === undefined && fallback !== undefined) return fallback
  throw new Fault(`${at} should be text.`)
}

function int(v: unknown, at: string, min: number, max: number, fallback?: number): number {
  if (v === undefined && fallback !== undefined) return fallback
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
    throw new Fault(`${at} should be a whole number from ${min} to ${max}.`)
  }
  return v
}

function list(v: unknown, at: string): unknown[] {
  if (!Array.isArray(v)) throw new Fault(`${at} should be a list.`)
  return v
}

function range(v: unknown, at: string): Range {
  const pair = list(v, at)
  if (pair.length !== 2) throw new Fault(`${at} should be two numbers, like [1, 10].`)
  return [int(pair[0], `${at}[0]`, 1, 1000), int(pair[1], `${at}[1]`, 1, 1000)]
}

function staging(v: unknown, at: string): Staging | undefined {
  if (v === undefined || v === null) return undefined
  const o = obj(v, at)
  const out: Staging = {}
  if (o.animation === 'ratchet' || o.animation === 'glitch' || o.animation === 'plain') out.animation = o.animation
  for (const key of ['image', 'video', 'audio'] as const) if (typeof o[key] === 'string') out[key] = o[key]
  if (typeof o.volume === 'number') out.volume = Math.min(1, Math.max(0, o.volume))
  if (typeof o.loop === 'boolean') out.loop = o.loop
  return Object.keys(out).length > 0 ? out : undefined
}

function duration(v: unknown, at: string): Duration {
  if (v === undefined) return { kind: 'fixed', text: '' }
  const o = obj(v, at)
  if (o.kind === 'dice') return { kind: 'dice', die: int(o.die, `${at}.die`, 2, 1000), unit: str(o.unit, `${at}.unit`) }
  if (o.kind === 'fixed') return { kind: 'fixed', text: str(o.text, `${at}.text`) }
  throw new Fault(`${at}.kind should be "fixed" or "dice".`)
}

/** A table's own banner words. Anything that is not text, or is empty, is dropped. */
function banner(v: unknown, at: string): Category['banner'] {
  if (v === undefined || v === null) return undefined
  const o = obj(v, at)
  const out: NonNullable<Category['banner']> = {}
  for (const key of BANNER_KINDS) {
    const word = o[key]
    if (typeof word === 'string' && word.trim() !== '') out[key] = word
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function outcome(v: unknown, at: string): Outcome {
  const o = obj(v, at)
  if (!KINDS.includes(o.kind as OutcomeKind)) throw new Fault(`${at}.kind should be boon, neutral or bane.`)
  return {
    id: str(o.id, `${at}.id`, newId()),
    range: range(o.range, `${at}.range`),
    kind: o.kind as OutcomeKind,
    text: str(o.text, `${at}.text`, ''),
    staging: staging(o.staging, `${at}.staging`)
  }
}

function entry(v: unknown, at: string): Entry {
  const o = obj(v, at)
  return {
    id: str(o.id, `${at}.id`, newId()),
    range: range(o.range, `${at}.range`),
    title: str(o.title, `${at}.title`),
    description: str(o.description, `${at}.description`, ''),
    text: o.text === undefined ? undefined : str(o.text, `${at}.text`),
    outcomes: list(o.outcomes ?? [], `${at}.outcomes`).map((x, i) => outcome(x, `${at}.outcomes[${i}]`)),
    staging: staging(o.staging, `${at}.staging`)
  }
}

function category(v: unknown, at: string): Category {
  const o = obj(v, at)
  return {
    id: str(o.id, `${at}.id`, newId()),
    label: str(o.label, `${at}.label`),
    blurb: str(o.blurb, `${at}.blurb`, ''),
    duration: duration(o.duration, `${at}.duration`),
    banner: banner(o.banner, `${at}.banner`),
    die: int(o.die, `${at}.die`, 2, 1000, 100),
    subRoll: typeof o.subRoll === 'boolean' ? o.subRoll : false,
    subDie: int(o.subDie, `${at}.subDie`, 2, 1000, 10),
    entries: list(o.entries, `${at}.entries`).map((x, i) => entry(x, `${at}.entries[${i}]`))
  }
}

/** Checks a parsed JSON value and returns a clean table set, or the first fault found. */
export function parseTableSet(value: unknown): Parsed {
  try {
    const root = obj(value, 'The file')
    // An exported file wraps the tables; a bare table set is accepted too.
    const body = root.kind === FILE_KIND ? obj(root.tables, 'tables') : root
    const categories = list(body.categories, 'categories').map((x, i) => category(x, `categories[${i}]`))
    if (categories.length === 0) return { ok: false, error: 'The file has no categories.' }
    return { ok: true, tables: { name: str(body.name, 'name', 'Untitled tables'), theme: parseTheme(body.theme), categories } }
  } catch (e) {
    if (e instanceof Fault) return { ok: false, error: e.message }
    throw e
  }
}

/** Reads the text of a file the DM picked. */
export function readTableSet(text: string): Parsed {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This is not a JSON file.' }
  }
  return parseTableSet(value)
}

export function exportTableSet(tables: TableSet): string {
  return `${JSON.stringify({ kind: FILE_KIND, version: FILE_VERSION, tables }, null, 2)}\n`
}

/**
 * Splits a die into `count` ranges of near-equal size, in order. The earlier
 * rows take the extra faces when the die does not divide evenly.
 */
export function spreadRanges(count: number, sides: number): Range[] {
  if (count < 1) return []
  const n = Math.min(count, sides)
  const base = Math.floor(sides / n)
  const extra = sides % n
  const out: Range[] = []
  let from = 1
  for (let i = 0; i < n; i++) {
    const size = base + (i < extra ? 1 : 0)
    out.push([from, from + size - 1])
    from += size
  }
  return out
}
