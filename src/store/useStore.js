import { useState, useEffect, useCallback, useRef } from 'react'
import { saveAppData, saveSceneDoc, deleteSceneDoc } from '../utils/firestoreSync'

const load = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? def }
  catch { return def }
}
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val))
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

// Simple debounce helper: returns a function that delays calling fn by ms
function debounce(fn, ms) {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms) }
}

export function useStore(userId = null) {
  const [novels, setNovels] = useState(() => load('nf_novels', []))
  const [activeNovelId, setActiveNovelId] = useState(() => load('nf_activeNovel', null))
  const [characters, setCharacters] = useState(() => load('nf_characters', []))
  const [factions, setFactions] = useState(() => load('nf_factions', []))
  const [locations, setLocations] = useState(() => load('nf_locations', []))
  const [timeline, setTimeline] = useState(() => load('nf_timeline', []))
  const [worldHistory, setWorldHistory] = useState(() => load('nf_worldHistory', []))
  const [currentYear, setCurrentYear] = useState(() => load('nf_currentYear', 0))
  const [acts, setActs] = useState(() => load('nf_acts', []))
  const [chapters, setChapters] = useState(() => load('nf_chapters', []))
  const [scenes, setScenes] = useState(() => load('nf_scenes', []))
  const [loreEntries, setLoreEntries] = useState(() => load('nf_loreEntries', []))

  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [selectedLocationId, setSelectedLocationId] = useState(null)

  // Track whether we're mid-import to suppress Firestore saves during bulk load
  const importing = useRef(false)

  // localStorage persistence
  useEffect(() => save('nf_novels', novels), [novels])
  useEffect(() => save('nf_activeNovel', activeNovelId), [activeNovelId])
  useEffect(() => save('nf_characters', characters), [characters])
  useEffect(() => save('nf_factions', factions), [factions])
  useEffect(() => save('nf_locations', locations), [locations])
  useEffect(() => save('nf_timeline', timeline), [timeline])
  useEffect(() => save('nf_worldHistory', worldHistory), [worldHistory])
  useEffect(() => save('nf_currentYear', currentYear), [currentYear])
  useEffect(() => save('nf_acts', acts), [acts])
  useEffect(() => save('nf_chapters', chapters), [chapters])
  useEffect(() => save('nf_scenes', scenes), [scenes])
  useEffect(() => save('nf_loreEntries', loreEntries), [loreEntries])

  // Debounced Firestore save for all non-scene data (2s delay)
  const debouncedSaveAppData = useCallback(
    debounce((uid, data) => saveAppData(uid, data).catch(console.error), 2000),
    []
  )

  // Debounced Firestore save for individual scenes (1s delay)
  const debouncedSaveScene = useCallback(
    debounce((uid, scene) => saveSceneDoc(uid, scene).catch(console.error), 1000),
    []
  )

  // Sync non-scene data to Firestore whenever anything changes
  useEffect(() => {
    if (!userId || importing.current) return
    debouncedSaveAppData(userId, {
      novels, characters, factions, locations, timeline,
      worldHistory, acts, chapters, loreEntries,
      currentYear, activeNovelId
    })
  }, [userId, novels, characters, factions, locations, timeline,
      worldHistory, acts, chapters, loreEntries, currentYear, activeNovelId])

  // Bulk import from Firestore after login
  const importData = useCallback((data) => {
    importing.current = true
    setNovels(data.novels ?? [])
    setCharacters(data.characters ?? [])
    setFactions(data.factions ?? [])
    setLocations(data.locations ?? [])
    setTimeline(data.timeline ?? [])
    setWorldHistory(data.worldHistory ?? [])
    setActs(data.acts ?? [])
    setChapters(data.chapters ?? [])
    setScenes(data.scenes ?? [])
    setLoreEntries(data.loreEntries ?? [])
    setCurrentYear(data.currentYear ?? 0)
    setActiveNovelId(data.activeNovelId ?? null)
    // Allow effects to settle before re-enabling Firestore saves
    setTimeout(() => { importing.current = false }, 500)
  }, [])

  // Clear all local state on sign-out
  const clearData = useCallback(() => {
    importing.current = true
    setNovels([]); setCharacters([]); setFactions([]); setLocations([])
    setTimeline([]); setWorldHistory([]); setActs([]); setChapters([])
    setScenes([]); setLoreEntries([]); setCurrentYear(0); setActiveNovelId(null)
    setTimeout(() => { importing.current = false }, 500)
  }, [])

  const activeNovel = novels.find(n => n.id === activeNovelId) ?? null

  const novelActs = acts.filter(a => a.novelId === activeNovelId).sort((a, b) => a.order - b.order)
  const novelChapters = chapters.filter(c => c.novelId === activeNovelId).sort((a, b) => a.order - b.order)
  const novelScenes = scenes.filter(s => s.novelId === activeNovelId).sort((a, b) => a.order - b.order)
  const novelTimeline = timeline.filter(e => e.novelId === activeNovelId)
  const novelWorldHistory = worldHistory.filter(h => h.novelId === activeNovelId)
  const novelFactions = factions.filter(f => f.novelId === activeNovelId)
  const novelLoreEntries = loreEntries.filter(e => e.novelId === activeNovelId)

  const addAct = (title) => {
    const newAct = { id: uid(), novelId: activeNovelId, title, synopsis: '', order: novelActs.length }
    setActs(prev => [...prev, newAct])
    return newAct
  }

  const addChapter = (actId, title) => {
    const newChap = { id: uid(), novelId: activeNovelId, actId, title, synopsis: '', order: novelChapters.length }
    setChapters(prev => [...prev, newChap])
    return newChap
  }

  const addScene = (chapterId, title) => {
    const newScene = {
      id: uid(),
      novelId: activeNovelId,
      chapterId,
      title,
      synopsis: '',
      content: '',
      order: novelScenes.length,
      lastModified: Date.now()
    }
    setScenes(prev => [...prev, newScene])
    if (userId) saveSceneDoc(userId, newScene).catch(console.error)
    return newScene
  }

  const reorderAct = (id, direction) => {
    setActs(prev => {
      const scoped = prev.filter(a => a.novelId === activeNovelId).sort((a, b) => a.order - b.order)
      const idx = scoped.findIndex(a => a.id === id)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= scoped.length) return prev
      const newOrder = scoped[swapIdx].order
      const oldOrder = scoped[idx].order
      return prev.map(a => {
        if (a.id === id) return { ...a, order: newOrder }
        if (a.id === scoped[swapIdx].id) return { ...a, order: oldOrder }
        return a
      })
    })
  }

  const reorderChapter = (id, direction) => {
    setChapters(prev => {
      const chapter = prev.find(c => c.id === id)
      if (!chapter) return prev
      const scoped = prev.filter(c => c.actId === chapter.actId).sort((a, b) => a.order - b.order)
      const idx = scoped.findIndex(c => c.id === id)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= scoped.length) return prev
      const newOrder = scoped[swapIdx].order
      const oldOrder = scoped[idx].order
      return prev.map(c => {
        if (c.id === id) return { ...c, order: newOrder }
        if (c.id === scoped[swapIdx].id) return { ...c, order: oldOrder }
        return c
      })
    })
  }

  const reorderScene = (id, direction) => {
    setScenes(prev => {
      const scene = prev.find(s => s.id === id)
      if (!scene) return prev
      const scoped = prev.filter(s => s.chapterId === scene.chapterId).sort((a, b) => a.order - b.order)
      const idx = scoped.findIndex(s => s.id === id)
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= scoped.length) return prev
      const newOrder = scoped[swapIdx].order
      const oldOrder = scoped[idx].order
      return prev.map(s => {
        if (s.id === id) return { ...s, order: newOrder }
        if (s.id === scoped[swapIdx].id) return { ...s, order: oldOrder }
        return s
      })
    })
  }

  const updateSceneContent = useCallback((sceneId, content) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== sceneId) return s
      const updated = { ...s, content, lastModified: Date.now() }
      if (userId) debouncedSaveScene(userId, updated)
      return updated
    }))
  }, [userId])

  const deleteAct = (id) => setActs(prev => prev.filter(a => a.id !== id))
  const deleteChapter = (id) => setChapters(prev => prev.filter(c => c.id !== id))
  const deleteScene = (id) => {
    setScenes(prev => prev.filter(s => s.id !== id))
    if (userId) deleteSceneDoc(userId, id).catch(console.error)
  }
  const updateAct = (id, data) => setActs(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
  const updateChapter = (id, data) => setChapters(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  const updateScene = (id, data) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== id) return s
      const updated = { ...s, ...data }
      if (userId) debouncedSaveScene(userId, updated)
      return updated
    }))
  }

  const saveCharacter = (data, id) => {
    if (id) {
      setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    } else {
      setCharacters(prev => [...prev, { id: uid(), novelId: activeNovelId, ...data }])
    }
  }
  const deleteCharacter = (id) => setCharacters(prev => prev.filter(c => c.id !== id))

  const saveLocation = (data, id) => {
    if (id) {
      setLocations(prev => prev.map(l => l.id === id ? { ...l, ...data } : l))
      return locations.find(l => l.id === id)
    } else {
      const newLoc = { id: uid(), novelId: activeNovelId, ...data }
      setLocations(prev => [...prev, newLoc])
      return newLoc
    }
  }
  const deleteLocation = (id) => setLocations(prev => prev.filter(l => l.id !== id))

  const addEvent = (data) => {
    const event = { id: uid(), novelId: activeNovelId, createdAt: Date.now(), ...data }
    setTimeline(prev => [...prev, event])
    return event
  }
  const updateEvent = (id, data) => setTimeline(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  const deleteEvent = (id) => setTimeline(prev => prev.filter(e => e.id !== id))

  const addHistoryEntry = (data) => {
    const entry = { id: uid(), novelId: activeNovelId, createdAt: Date.now(), ...data }
    setWorldHistory(prev => [...prev, entry])
    return entry
  }
  const updateHistoryEntry = (id, data) => setWorldHistory(prev => prev.map(h => h.id === id ? { ...h, ...data } : h))
  const deleteHistoryEntry = (id) => setWorldHistory(prev => prev.filter(h => h.id !== id))

  const addLoreEntry = (data) => {
    const entry = { id: uid(), novelId: activeNovelId, createdAt: Date.now(), characterIds: [], category: '', content: '', ...data }
    setLoreEntries(prev => [...prev, entry])
    return entry
  }
  const updateLoreEntry = (id, data) => setLoreEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  const deleteLoreEntry = (id) => setLoreEntries(prev => prev.filter(e => e.id !== id))

  const updateCurrentYear = (value) => {
    const next = Number(value)
    setCurrentYear(Number.isFinite(next) ? next : 0)
  }

  const addNovel = (data) => {
    const novel = { id: uid(), createdAt: new Date().toISOString(), ...data }
    setNovels(prev => [...prev, novel]); setActiveNovelId(novel.id); return novel
  }
  const deleteNovel = (id) => {
    setNovels(prev => prev.filter(n => n.id !== id))
    setCharacters(prev => prev.filter(c => c.novelId !== id))
    setFactions(prev => prev.filter(f => f.novelId !== id))
    setLocations(prev => prev.filter(l => l.novelId !== id))
    setTimeline(prev => prev.filter(e => e.novelId !== id))
    setWorldHistory(prev => prev.filter(h => h.novelId !== id))
    setActs(prev => prev.filter(a => a.novelId !== id))
    setChapters(prev => prev.filter(c => c.novelId !== id))
    setScenes(prev => {
      const toDelete = prev.filter(s => s.novelId === id)
      if (userId) toDelete.forEach(s => deleteSceneDoc(userId, s.id).catch(console.error))
      return prev.filter(s => s.novelId !== id)
    })
    setLoreEntries(prev => prev.filter(e => e.novelId !== id))
    if (activeNovelId === id) setActiveNovelId(null)
    setSelectedCharacterId(null)
    setSelectedLocationId(null)
  }

  return {
    novels, activeNovelId, activeNovel, setActiveNovelId, addNovel, deleteNovel,
    characters: characters.filter(c => c.novelId === activeNovelId),
    saveCharacter, deleteCharacter,
    factions: novelFactions,
    setFactions: (updater) => {
      setFactions(prev => {
        const untouched = prev.filter(f => f.novelId !== activeNovelId)
        const scoped = prev.filter(f => f.novelId === activeNovelId)
        const nextScoped = typeof updater === 'function' ? updater(scoped) : updater
        return [...untouched, ...nextScoped.map(f => ({ ...f, novelId: f.novelId ?? activeNovelId }))]
      })
    },
    locations: locations.filter(l => l.novelId === activeNovelId),
    saveLocation, deleteLocation,
    timeline: novelTimeline,
    addEvent, updateEvent, deleteEvent,
    worldHistory: novelWorldHistory,
    addHistoryEntry, updateHistoryEntry, deleteHistoryEntry,
    currentYear, updateCurrentYear,
    loreEntries: novelLoreEntries, addLoreEntry, updateLoreEntry, deleteLoreEntry,
    acts: novelActs, addAct, deleteAct, updateAct, reorderAct,
    chapters: novelChapters, addChapter, deleteChapter, updateChapter, reorderChapter,
    scenes: novelScenes, addScene, deleteScene, updateScene, reorderScene,
    updateSceneContent,
    selectedCharacterId, setSelectedCharacterId,
    selectedLocationId, setSelectedLocationId,
    importData, clearData
  }
}
