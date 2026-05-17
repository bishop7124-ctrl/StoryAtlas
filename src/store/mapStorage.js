// IndexedDB storage for large map pixel data (heightmap + overlay).
// localStorage (used by Zustand persist) has a ~5 MB per-origin limit which
// the raw Float32Array / Uint8Array arrays would easily exceed.

const DB_NAME = 'yow-maps'
const LEGACY_DB_NAME = 'yow-maps-legacy'
const STORE   = 'pixel-data'
const VERSION = 1

let _db = null
let _legacyDb = null

function openDB(name = DB_NAME) {
  if (name === DB_NAME && _db) return Promise.resolve(_db)
  if (name === LEGACY_DB_NAME && _legacyDb) return Promise.resolve(_legacyDb)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, VERSION)
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE)
    req.onsuccess = e => {
      if (name === LEGACY_DB_NAME) _legacyDb = e.target.result
      else _db = e.target.result
      resolve(e.target.result)
    }
    req.onerror   = () => reject(req.error)
  })
}

function tx(mode, name = DB_NAME) {
  return openDB(name).then(db => db.transaction(STORE, mode).objectStore(STORE))
}

async function getMapPixels(mapId, name = DB_NAME) {
  const store = await tx('readonly', name)
  return await new Promise((resolve, reject) => {
    const req = store.get(mapId)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror   = () => reject(req.error)
  })
}

export async function loadMapPixels(mapId) {
  try {
    const current = await getMapPixels(mapId)
    if (current) return current

    const legacy = await getMapPixels(mapId, LEGACY_DB_NAME)
    if (legacy) {
      const store = await tx('readwrite')
      await new Promise((resolve, reject) => {
        const req = store.put(legacy, mapId)
        req.onsuccess = resolve
        req.onerror   = () => reject(req.error)
      })
    }
    return legacy
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
