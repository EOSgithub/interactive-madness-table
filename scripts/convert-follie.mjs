// Converts the tables of the old Follie app (data.js, Italian) into this project's
// model, and writes source/follie.it.json. That file is the starting text for the
// English defaults; it is not shipped with the site.
//
//   node scripts/convert-follie.mjs [path to Follie/data.js]
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const input = resolve(process.argv[2] ?? resolve(root, '..', 'Follie', 'data.js'))

// data.js declares a top-level const; run it in a sandbox and read the value back.
const tables = vm.runInNewContext(`${readFileSync(input, 'utf8')}\n;TABELLE_FOLLIE`)

const CATEGORIES = [
  { key: 'breve', id: 'short-term', label: 'A Breve Termine', blurb: "Un'ombra passeggera che striscia nella mente.", duration: { kind: 'dice', die: 4, unit: 'minuti' } },
  { key: 'lungo', id: 'long-term', label: 'A Lungo Termine', blurb: 'Una macchia tenace che corrompe il corpo.', duration: { kind: 'dice', die: 4, unit: 'settimane' } },
  { key: 'permanente', id: 'indefinite', label: 'Permanente', blurb: "Un marchio scolpito nell'anima.", duration: { kind: 'fixed', text: "D'ora in poi:" } }
]
const KIND = { boon: 'boon', neutro: 'neutral', malus: 'bane' }

const set = {
  name: 'Follie',
  categories: CATEGORIES.map(({ key, id, label, blurb, duration }) => ({
    id,
    label,
    blurb,
    duration,
    die: 100,
    subRoll: true,
    subDie: 10,
    entries: tables[key].map((e, i) => ({
      id: `${id}-${i + 1}`,
      range: e.range,
      title: e.titolo,
      description: e.descrizione,
      outcomes: e.manifestazioni.map((m, j) => ({
        id: `${id}-${i + 1}-${j + 1}`,
        range: m.range,
        kind: KIND[m.tipo],
        text: m.testo
      }))
    }))
  }))
}

const output = resolve(root, 'source', 'follie.it.json')
writeFileSync(output, `${JSON.stringify(set, null, 2)}\n`)
const entries = set.categories.reduce((n, c) => n + c.entries.length, 0)
const outcomes = set.categories.reduce((n, c) => n + c.entries.reduce((m, e) => m + e.outcomes.length, 0), 0)
console.log(`${output}: ${set.categories.length} categories, ${entries} entries, ${outcomes} outcomes`)
