// IndexedDB storage for large map pixel data (heightmap + overlay).
// localStorage (used by Zustand persist) has a ~5 MB per-origin limit which
// the raw Float32Array / Uint8Array arrays would easily exceed.

const DB_NAME = 'story-atlas-worldforge-maps'
const STORE   = 'pixel-data'
const VERSION = 1

let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE)
    req.onsuccess = e => { _db = e.target.result; resolve(_db) }
    req.onerror   = () => reject(req.error)
  })
}

function tx(mode) {
  return openDB().then(db => db.transaction(STORE, mode).objectStore(STORE))
}

export async function loadMapPixels(mapId) {
  try {
    const store = await tx('readonly')
    return await new Promise((resolve, reject) => {
      const req = store.get(mapId)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror   = () => reject(req.error)
    })
  } catch {
    return null
  }
}

export async function saveMapPixels(mapId, hm, ov, colorOv) {
  try {
    const store = await tx('readwrite')
    const data = { hm: new Float32Array(hm), ov: new Uint8Array(ov) }
    if (colorOv) data.colorOv = new Uint8Array(colorOv)
    await new Promise((resolve, reject) => {
      const req = store.put(data, mapId)
      req.onsuccess = resolve
      req.onerror   = () => reject(req.error)
    })
  } catch (e) {
    console.error('mapStorage: save failed', e)
  }
}

export async function deleteMapPixels(mapId) {
  try {
    const store = await tx('readwrite')
    await new Promise((resolve, reject) => {
      const req = store.delete(mapId)
      req.onsuccess = resolve
      req.onerror   = () => reject(req.error)
    })
  } catch { /* ignore */ }
}
