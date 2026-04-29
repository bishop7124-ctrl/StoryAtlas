import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Load all data for a user from Firestore
export async function loadUserData(uid) {
  const [appDataSnap, scenesSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid, 'data', 'appData')),
    getDocs(collection(db, 'users', uid, 'scenes'))
  ])

  const d = appDataSnap.exists() ? appDataSnap.data() : {}
  return {
    novels:       d.novels       ?? [],
    characters:   d.characters   ?? [],
    factions:     d.factions     ?? [],
    locations:    d.locations    ?? [],
    timeline:     d.timeline     ?? [],
    worldHistory: d.worldHistory ?? [],
    acts:         d.acts         ?? [],
    chapters:     d.chapters     ?? [],
    loreEntries:  d.loreEntries  ?? [],
    currentYear:  d.currentYear  ?? 0,
    activeNovelId: d.activeNovelId ?? null,
    scenes: scenesSnap.docs.map(s => s.data())
  }
}

// Save everything except scene content as one document
export async function saveAppData(uid, data) {
  await setDoc(doc(db, 'users', uid, 'data', 'appData'), data)
}

// Save a single scene document (called per scene to avoid 1MB doc limits)
export async function saveSceneDoc(uid, scene) {
  await setDoc(doc(db, 'users', uid, 'scenes', scene.id), scene)
}

export async function deleteSceneDoc(uid, sceneId) {
  await deleteDoc(doc(db, 'users', uid, 'scenes', sceneId))
}
