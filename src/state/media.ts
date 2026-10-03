import { mediaKind, type MediaKind } from '../shared/staging'

// The DM's uploaded files: images, videos and sounds. They live in IndexedDB,
// because localStorage cannot hold files. Both windows are on the same origin,
// so the player screen reads the same store; only the id of a file travels
// between the windows.

const DB = 'interactive-madness-table-media'
const STORE = 'files'

export interface MediaFile {
  id: string
  name: string
  type: string
  kind: MediaKind
  size: number
  addedAt: number
}

interface Stored extends MediaFile {
  blob: Blob
}

let opening: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return opening
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const request = work(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(request.result)
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error)
      })
  )
}

const meta = ({ id, name, type, kind, size, addedAt }: Stored): MediaFile => ({ id, name, type, kind, size, addedAt })

export type AddResult = { ok: true; file: MediaFile } | { ok: false; error: string }

/** Saves a file the DM picked. Refuses anything that is not an image, a video or a sound. */
export async function addFile(file: File): Promise<AddResult> {
  const kind = mediaKind(file.type)
  if (!kind) return { ok: false, error: `"${file.name}" is not an image, a video or a sound.` }
  // Ask the browser not to clear this data when the disk runs low. It may say no; the files still work.
  void navigator.storage?.persist?.()
  const stored: Stored = { id: crypto.randomUUID(), name: file.name, type: file.type, kind, size: file.size, addedAt: Date.now(), blob: file }
  try {
    await run('readwrite', (s) => s.put(stored))
    return { ok: true, file: meta(stored) }
  } catch (e) {
    const full = e instanceof DOMException && e.name === 'QuotaExceededError'
    return { ok: false, error: full ? `No room left in this browser for "${file.name}".` : `"${file.name}" could not be saved.` }
  }
}

export async function listFiles(): Promise<MediaFile[]> {
  const all = await run<Stored[]>('readonly', (s) => s.getAll())
  return all.map(meta).sort((a, b) => b.addedAt - a.addedAt)
}

export async function removeFile(id: string): Promise<void> {
  const url = urls.get(id)
  if (url) {
    URL.revokeObjectURL(await url.catch(() => ''))
    urls.delete(id)
  }
  await run('readwrite', (s) => s.delete(id))
}

// One object URL per file per window, made on first use and kept: a show can ask
// for the same file on every frame.
const urls = new Map<string, Promise<string>>()

/** A URL the page can play or show the file from. Rejects when the file is gone. */
export function urlFor(id: string): Promise<string> {
  let url = urls.get(id)
  if (!url) {
    url = run<Stored | undefined>('readonly', (s) => s.get(id)).then((stored) => {
      if (!stored) throw new Error(`File ${id} is not in this browser.`)
      return URL.createObjectURL(stored.blob)
    })
    url.catch(() => urls.delete(id))
    urls.set(id, url)
  }
  return url
}

/** How much this site stores in the browser, and how much it may. Null where the browser does not say. */
export async function storageUse(): Promise<{ used: number; quota: number } | null> {
  const estimate = await navigator.storage?.estimate?.()
  if (!estimate?.quota) return null
  return { used: estimate.usage ?? 0, quota: estimate.quota }
}
