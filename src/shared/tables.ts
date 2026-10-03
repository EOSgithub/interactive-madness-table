import type { Category, Entry, Outcome, Range, TableSet } from './types'

// Looking a roll up in a table, and checking that a table can be rolled on at all.
// Pure functions: the DM window, the editor and the tests all use the same ones.

export function inRange(n: number, [from, to]: Range): boolean {
  return n >= from && n <= to
}

export function findEntry(category: Category, roll: number): Entry | null {
  return category.entries.find((e) => inRange(roll, e.range)) ?? null
}

export function findOutcome(entry: Entry, roll: number): Outcome | null {
  return entry.outcomes.find((o) => inRange(roll, o.range)) ?? null
}

/** A whole number from 1 to `sides`. `random` is injectable so tests can pin it. */
export function rollDie(sides: number, random: () => number = Math.random): number {
  return Math.floor(random() * sides) + 1
}

export type ProblemKind = 'empty' | 'invalid' | 'out-of-bounds' | 'overlap' | 'gap'

export interface Problem {
  kind: ProblemKind
  /** Where it is, for the editor to point at: a category, or an entry inside one. */
  categoryId: string
  entryId?: string
  /** Plain words for the DM. */
  message: string
}

interface Spanned {
  range: Range
}

/**
 * Checks that ranges cover 1..sides exactly once. Returns one line per fault:
 * a table with a gap would leave a roll with no result, and an overlap would
 * make the result depend on the order of the rows.
 */
export function checkCoverage(items: Spanned[], sides: number): { kind: ProblemKind; message: string }[] {
  if (items.length === 0) return [{ kind: 'empty', message: `No rows: the d${sides} has nothing to land on.` }]

  const out: { kind: ProblemKind; message: string }[] = []
  for (const { range } of items) {
    const [from, to] = range
    if (!Number.isInteger(from) || !Number.isInteger(to) || from > to) {
      out.push({ kind: 'invalid', message: `${from}-${to} is not a valid range.` })
    } else if (from < 1 || to > sides) {
      out.push({ kind: 'out-of-bounds', message: `${from}-${to} goes outside the d${sides}.` })
    }
  }
  if (out.length > 0) return out

  const sorted = [...items].sort((a, b) => a.range[0] - b.range[0])
  let next = 1
  for (const { range } of sorted) {
    const [from, to] = range
    if (from < next) out.push({ kind: 'overlap', message: `${from}-${to} overlaps the row before it.` })
    else if (from > next) out.push({ kind: 'gap', message: `Nothing covers ${next}${from - 1 > next ? `-${from - 1}` : ''}.` })
    next = Math.max(next, to + 1)
  }
  if (next <= sides) out.push({ kind: 'gap', message: `Nothing covers ${next}${sides > next ? `-${sides}` : ''}.` })
  return out
}

/** Every fault in one category: its own rows, and each entry's outcomes when the second roll is on. */
export function checkCategory(category: Category): Problem[] {
  const problems: Problem[] = checkCoverage(category.entries, category.die).map((p) => ({
    ...p,
    categoryId: category.id
  }))
  if (category.subRoll) {
    for (const entry of category.entries) {
      for (const p of checkCoverage(entry.outcomes, category.subDie)) {
        problems.push({ ...p, categoryId: category.id, entryId: entry.id })
      }
    }
  }
  return problems
}

export function checkTableSet(set: TableSet): Problem[] {
  return set.categories.flatMap(checkCategory)
}
