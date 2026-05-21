import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { saveAppData, saveSceneDoc, deleteSceneDoc } from '../utils/firestoreSync'
import { buildAllProjectStats, buildProjectStats } from '../utils/projectStats'

const load = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? def }
  catch { return def }
}
const save = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (error) {
    if (key === 'nf_novels' && Array.isArray(val)) {
      try {
        const withoutCovers = val.map(item => ({ ...item, coverPhoto: null }))
        localStorage.setItem(key, JSON.stringify(withoutCovers))
        console.warn('Project data was saved without cover photos because browser storage is full.', error)
        return
      } catch {
        // Fall through to the shared warning below.
      }
    }
    console.warn(`Could not save ${key} to browser storage.`, error)
  }
}
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const countWords = value => {
  if (!value || typeof value !== 'string') return 0
  return value.trim().match(/\S+/g)?.length || 0
}
const dateKey = value => {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const withSceneContentHistory = (scene, content, now = Date.now()) => {
  const today = dateKey(now)
  const wordCount = countWords(content)
  const history = Array.isArray(scene.wordHistory) ? [...scene.wordHistory] : []
  const lastIndex = history.findLastIndex(entry => entry.date === today)
  const entry = { date: today, words: wordCount, timestamp: now }
  const wordHistory = lastIndex >= 0
    ? history.map((item, index) => index === lastIndex ? entry : item)
    : [...history, entry].slice(-120)
  return { ...scene, content, lastModified: now, wordHistory }
}

// Simple debounce helper: returns a function that delays calling fn by ms
function debounce(fn, ms) {
  let timer
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms) }
}

export function useStore(userId = null, options = {}) {
  const readOnly = Boolean(options.readOnly)
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
  const [ideaEntries, setIdeaEntries] = useState(() => load('nf_ideaEntries', []))
  const [maps, setMaps] = useState(() => load('nf_maps', []))
  const [activeMapByNovel, setActiveMapByNovel] = useState(() => load('nf_activeMapByNovel', {}))
  const [whiteboards, setWhiteboards] = useState(() => load('nf_whiteboards', []))
  const [series, setSeries] = useState(() => load('nf_series', []))
  const [storySchedule, setStorySchedule] = useState(() => load('nf_storySchedule', []))

  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [selectedLocationId, setSelectedLocationId] = useState(null)
  const [selectedLoreEntryId, setSelectedLoreEntryId] = useState(null)
  const [selectedIdeaEntryId, setSelectedIdeaEntryId] = useState(null)

  // Track whether we're mid-import to suppress Firestore saves during bulk load
  const importing = useRef(false)
  const remoteReady = useRef(!userId)
  const previousUserId = useRef(userId)

  useEffect(() => {
    if (previousUserId.current === userId) return
    previousUserId.current = userId
    remoteReady.current = !userId
    importing.current = Boolean(userId)
  }, [userId])

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
  useEffect(() => save('nf_ideaEntries', ideaEntries), [ideaEntries])
  useEffect(() => save('nf_maps', maps), [maps])
  useEffect(() => save('nf_activeMapByNovel', activeMapByNovel), [activeMapByNovel])
  useEffect(() => save('nf_whiteboards', whiteboards), [whiteboards])
  useEffect(() => save('nf_series', series), [series])
  useEffect(() => save('nf_storySchedule', storySchedule), [storySchedule])

  // Debounced Firestore save for all non-scene data (2s delay)
  const debouncedSaveAppData = useMemo(
    () => debounce((uid, data) => saveAppData(uid, data).catch(console.error), 2000),
    []
  )

  // Debounced Firestore save for individual scenes (1s delay)
  const debouncedSaveScene = useMemo(
    () => debounce((uid, scene) => saveSceneDoc(uid, scene).catch(console.error), 1000),
    []
  )

  // Sync non-scene data to Firestore whenever anything changes
  useEffect(() => {
    if (!userId || importing.current || !remoteReady.current) return
    debouncedSaveAppData(userId, {
      novels, characters, factions, locations, timeline,
      worldHistory, acts, chapters, loreEntries, ideaEntries,
      maps, activeMapByNovel, whiteboards, series, storySchedule,
      currentYear, activeNovelId
    })
  }, [userId, novels, characters, factions, locations, timeline,
      worldHistory, acts, chapters, loreEntries, ideaEntries, maps, activeMapByNovel, whiteboards, series, storySchedule, currentYear, activeNovelId, debouncedSaveAppData])

  // Bulk import from Firestore after login
  const importData = useCallback((data) => {
    importing.current = true
    remoteReady.current = false
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
    setIdeaEntries(data.ideaEntries ?? [])
    setMaps(data.maps ?? [])
    setActiveMapByNovel(data.activeMapByNovel ?? {})
    setWhiteboards(data.whiteboards ?? [])
    setSeries(data.series ?? [])
    setStorySchedule(data.storySchedule ?? [])
    setCurrentYear(data.currentYear ?? 0)
    setActiveNovelId(data.activeNovelId ?? null)
    // Allow effects to settle before re-enabling Firestore saves
    setTimeout(() => {
      importing.current = false
      remoteReady.current = true
    }, 500)
  }, [])

  const finishRemoteLoad = useCallback(() => {
    importing.current = false
    remoteReady.current = true
  }, [])

  const replaceData = useCallback((data) => {
    importData(data)

    if (!userId) return

    setTimeout(() => {
      saveAppData(userId, {
        novels: data.novels ?? [],
        characters: data.characters ?? [],
        factions: data.factions ?? [],
        locations: data.locations ?? [],
        timeline: data.timeline ?? [],
        worldHistory: data.worldHistory ?? [],
        acts: data.acts ?? [],
        chapters: data.chapters ?? [],
        loreEntries: data.loreEntries ?? [],
        ideaEntries: data.ideaEntries ?? [],
        maps: data.maps ?? [],
        activeMapByNovel: data.activeMapByNovel ?? {},
        whiteboards: data.whiteboards ?? [],
        series: data.series ?? [],
        storySchedule: data.storySchedule ?? [],
        currentYear: data.currentYear ?? 0,
        activeNovelId: data.activeNovelId ?? null
      }).catch(console.error)

      ;(data.scenes ?? []).forEach(scene => {
        saveSceneDoc(userId, scene).catch(console.error)
      })
    }, 700)
  }, [importData, userId])

  // Clear all local state on sign-out
  const clearData = useCallback(() => {
    importing.current = true
    remoteReady.current = false
    setNovels([]); setCharacters([]); setFactions([]); setLocations([])
    setTimeline([]); setWorldHistory([]); setActs([]); setChapters([])
    setScenes([]); setLoreEntries([]); setIdeaEntries([]); setMaps([]); setActiveMapByNovel({}); setWhiteboards([]); setSeries([]); setStorySchedule([]); setCurrentYear(0); setActiveNovelId(null)
    setTimeout(() => { importing.current = false }, 500)
  }, [])

  const activeNovel = novels.find(n => n.id === activeNovelId) ?? null
  const projectStatsData = {
    characters,
    factions,
    locations,
    timeline,
    worldHistory,
    acts,
    chapters,
    scenes,
    loreEntries,
    ideaEntries,
    maps,
    activeMapByNovel,
    whiteboards,
  }
  const allProjectStats = buildAllProjectStats(novels, projectStatsData)
  const activeProjectStats = activeNovel ? buildProjectStats(activeNovel, projectStatsData) : null

  // Series sync: when a category is in syncCategories, include data from all projects in the same series
  const activeSeries = activeNovel?.seriesId ? series.find(s => s.id === activeNovel.seriesId) : null
  const syncCategories = activeSeries?.syncCategories ?? []
  const seriesNovelIds = activeSeries
    ? novels.filter(n => n.seriesId === activeSeries.id).map(n => n.id)
    : []

  const seriesScope = (arr, category) =>
    syncCategories.includes(category)
      ? arr.filter(item => seriesNovelIds.includes(item.novelId))
      : arr.filter(item => item.novelId === activeNovelId)

  // Manuscripts (acts/chapters/scenes) are NEVER synced — always project-only
  const novelActs = acts.filter(a => a.novelId === activeNovelId).sort((a, b) => a.order - b.order)
  const novelChapters = chapters.filter(c => c.novelId === activeNovelId).sort((a, b) => a.order - b.order)
  const novelScenes = scenes.filter(s => s.novelId === activeNovelId).sort((a, b) => a.order - b.order)
  const novelTimeline = seriesScope(timeline, 'timeline')
  const novelWorldHistory = seriesScope(worldHistory, 'worldhistory')
  const novelFactions = seriesScope(factions, 'factions')
  const novelLoreEntries = seriesScope(loreEntries, 'lore')
  const novelIdeaEntries = seriesScope(ideaEntries, 'ideas')
  const novelStorySchedule = storySchedule.filter(e => e.novelId === activeNovelId)
  const novelMaps = maps.filter(m => m.novelId === activeNovelId)
  const activeMapId = activeMapByNovel[activeNovelId] ?? novelMaps[0]?.id ?? null
  const activeWhiteboard = whiteboards.find(w => w.novelId === activeNovelId) ?? null
  const whiteboard = activeWhiteboard?.whiteboard || { notes: [], groups: [] }
  const mapProject = activeNovel ? {
    id: activeNovel.id,
    name: activeNovel.title || activeNovel.name || 'Untitled',
    type: activeNovel.type || 'novel',
    locations: locations.filter(l => l.novelId === activeNovelId),
    maps: novelMaps,
    activeMapId,
    whiteboard,
    mapData: null,
    mapPins: [],
    mapType: null,
  } : null

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const updateMapProject = useCallback((updater) => {
    if (!activeNovelId) return
    const currentMaps = maps.filter(m => m.novelId === activeNovelId)
    const currentActiveMapId = activeMapByNovel[activeNovelId] ?? currentMaps[0]?.id ?? null
    const currentWhiteboard = whiteboards.find(w => w.novelId === activeNovelId)?.whiteboard || { notes: [], groups: [] }
    const currentProject = {
      id: activeNovelId,
      type: activeNovel?.type || 'novel',
      locations: locations.filter(l => l.novelId === activeNovelId),
      maps: currentMaps,
      activeMapId: currentActiveMapId,
      whiteboard: currentWhiteboard,
      mapData: null,
      mapPins: [],
      mapType: null,
    }
    const patch = updater(currentProject) || {}

    if (Object.prototype.hasOwnProperty.call(patch, 'maps')) {
      setMaps(prev => [
        ...prev.filter(m => m.novelId !== activeNovelId),
        ...(patch.maps || []).map(m => ({ ...m, novelId: m.novelId ?? activeNovelId })),
      ])
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'activeMapId')) {
      setActiveMapByNovel(prev => ({ ...prev, [activeNovelId]: patch.activeMapId ?? null }))
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'whiteboard')) {
      setWhiteboards(prev => {
        const existing = prev.find(w => w.novelId === activeNovelId)
        const currentWhiteboard = existing?.whiteboard || { notes: [], groups: [] }
        const nextWhiteboard = typeof patch.whiteboard === 'function'
          ? patch.whiteboard(currentWhiteboard)
          : patch.whiteboard
        const entry = { id: existing?.id || uid(), novelId: activeNovelId, whiteboard: nextWhiteboard || { notes: [], groups: [] } }
        return [...prev.filter(w => w.novelId !== activeNovelId), entry]
      })
    }
  }, [activeNovelId, activeNovel?.type, activeMapByNovel, locations, maps, whiteboards]) // eslint-disable-line react-hooks/preserve-manual-memoization

  const updateWhiteboard = useCallback((updater) => {
    if (!activeNovelId) return
    setWhiteboards(prev => {
      const existing = prev.find(w => w.novelId === activeNovelId)
      const currentWhiteboard = existing?.whiteboard || { notes: [], groups: [] }
      const nextWhiteboard = typeof updater === 'function'
        ? updater(currentWhiteboard)
        : updater
      const entry = {
        id: existing?.id || uid(),
        novelId: activeNovelId,
        whiteboard: nextWhiteboard || { notes: [], groups: [] },
      }
      return [...prev.filter(w => w.novelId !== activeNovelId), entry]
    })
  }, [activeNovelId])

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
      lastModified: Date.now() // eslint-disable-line react-hooks/purity
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

  const moveAct = useCallback((actId, toIndex) => {
    setActs(prev => {
      const scoped = prev.filter(a => a.novelId === activeNovelId).sort((a, b) => a.order - b.order)
      const others = prev.filter(a => a.novelId !== activeNovelId)
      const fromIndex = scoped.findIndex(a => a.id === actId)
      if (fromIndex === -1) return prev
      const reordered = [...scoped]
      const [item] = reordered.splice(fromIndex, 1)
      const clampedTo = Math.max(0, Math.min(toIndex, reordered.length))
      reordered.splice(clampedTo, 0, item)
      return [...others, ...reordered.map((a, i) => ({ ...a, order: i }))]
    })
  }, [activeNovelId])

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

  const moveChapter = useCallback((chapterId, toActId, toIndex) => {
    setChapters(prev => {
      const chapter = prev.find(c => c.id === chapterId)
      if (!chapter) return prev
      const updatedChapter = { ...chapter, actId: toActId }
      const destChaps = prev.filter(c => c.actId === toActId && c.id !== chapterId).sort((a, b) => a.order - b.order)
      const clampedTo = Math.max(0, Math.min(toIndex, destChaps.length))
      const reinserted = [...destChaps.slice(0, clampedTo), updatedChapter, ...destChaps.slice(clampedTo)]
        .map((c, i) => ({ ...c, order: i }))
      if (chapter.actId !== toActId) {
        const srcChaps = prev.filter(c => c.actId === chapter.actId && c.id !== chapterId)
          .sort((a, b) => a.order - b.order).map((c, i) => ({ ...c, order: i }))
        const others = prev.filter(c => c.actId !== toActId && c.actId !== chapter.actId)
        return [...others, ...srcChaps, ...reinserted]
      }
      const others = prev.filter(c => c.actId !== toActId)
      return [...others, ...reinserted]
    })
  }, [])

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

  const moveScene = useCallback((sceneId, toChapterId, toIndex) => {
    setScenes(prev => {
      const scene = prev.find(s => s.id === sceneId)
      if (!scene) return prev
      const updatedScene = { ...scene, chapterId: toChapterId }
      const destScenes = prev.filter(s => s.chapterId === toChapterId && s.id !== sceneId).sort((a, b) => a.order - b.order)
      const clampedTo = Math.max(0, Math.min(toIndex, destScenes.length))
      const reinserted = [...destScenes.slice(0, clampedTo), updatedScene, ...destScenes.slice(clampedTo)]
        .map((s, i) => ({ ...s, order: i }))
      if (scene.chapterId !== toChapterId) {
        const srcScenes = prev.filter(s => s.chapterId === scene.chapterId && s.id !== sceneId)
          .sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }))
        const others = prev.filter(s => s.chapterId !== toChapterId && s.chapterId !== scene.chapterId)
        return [...others, ...srcScenes, ...reinserted]
      }
      const others = prev.filter(s => s.chapterId !== toChapterId)
      return [...others, ...reinserted]
    })
  }, [])

  const updateSceneContent = useCallback((sceneId, content) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== sceneId) return s
      const updated = withSceneContentHistory(s, content)
      if (userId) debouncedSaveScene(userId, updated)
      return updated
    }))
  }, [userId, debouncedSaveScene])

  const deleteAct = (id) => {
    const chapterIds = chapters.filter(c => c.actId === id).map(c => c.id)
    const sceneIds = scenes.filter(s => chapterIds.includes(s.chapterId)).map(s => s.id)
    setActs(prev => prev.filter(a => a.id !== id))
    setChapters(prev => prev.filter(c => c.actId !== id))
    setScenes(prev => prev.filter(s => {
      const keep = !sceneIds.includes(s.id)
      if (!keep && userId) deleteSceneDoc(userId, s.id).catch(console.error)
      return keep
    }))
  }
  const deleteChapter = (id) => {
    const sceneIds = scenes.filter(s => s.chapterId === id).map(s => s.id)
    setChapters(prev => prev.filter(c => c.id !== id))
    setScenes(prev => prev.filter(s => {
      const keep = !sceneIds.includes(s.id)
      if (!keep && userId) deleteSceneDoc(userId, s.id).catch(console.error)
      return keep
    }))
  }
  const deleteScene = (id) => {
    setScenes(prev => prev.filter(s => s.id !== id))
    if (userId) deleteSceneDoc(userId, id).catch(console.error)
  }
  const updateAct = (id, data) => setActs(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
  const updateChapter = (id, data) => setChapters(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
  const updateScene = (id, data) => {
    setScenes(prev => prev.map(s => {
      if (s.id !== id) return s
      const hasContent = Object.prototype.hasOwnProperty.call(data, 'content')
      const updated = hasContent && data.content !== s.content
        ? withSceneContentHistory({ ...s, ...data }, data.content)
        : { ...s, ...data }
      if (userId) debouncedSaveScene(userId, updated)
      return updated
    }))
  }

  const saveCharacter = (data, id) => {
    const characterId = id || uid()
    const childIds = data.childIds || []
    const parentIds = data.parentIds || []
    const spouseIds = data.spouseIds || []
    setCharacters(prev => {
      const next = id
        ? prev.map(c => c.id === id ? { ...c, ...data } : c)
        : [...prev, { id: characterId, novelId: activeNovelId, ...data }]

      return next.map(c => {
        if (c.id === characterId || c.novelId !== activeNovelId) return c
        let updated = c
        let changed = false

        // childIds → sync parentIds on children
        const cParents = updated.parentIds || []
        const shouldBeChild = childIds.includes(c.id)
        if (shouldBeChild && !cParents.includes(characterId)) {
          updated = { ...updated, parentIds: [...cParents, characterId] }
          changed = true
        } else if (!shouldBeChild && cParents.includes(characterId)) {
          updated = { ...updated, parentIds: cParents.filter(p => p !== characterId) }
          changed = true
        }

        // parentIds → sync childIds on parents
        const cChildren = updated.childIds || []
        const shouldBeParent = parentIds.includes(c.id)
        if (shouldBeParent && !cChildren.includes(characterId)) {
          updated = { ...updated, childIds: [...cChildren, characterId] }
          changed = true
        } else if (!shouldBeParent && cChildren.includes(characterId)) {
          updated = { ...updated, childIds: cChildren.filter(ch => ch !== characterId) }
          changed = true
        }

        // spouseIds → sync bidirectionally
        const cSpouses = updated.spouseIds || []
        const shouldBeSpouse = spouseIds.includes(c.id)
        if (shouldBeSpouse && !cSpouses.includes(characterId)) {
          updated = { ...updated, spouseIds: [...cSpouses, characterId] }
          changed = true
        } else if (!shouldBeSpouse && cSpouses.includes(characterId)) {
          updated = { ...updated, spouseIds: cSpouses.filter(s => s !== characterId) }
          changed = true
        }

        return changed ? updated : c
      })
    })
    return characterId
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
    const eventId = uid()
    const historyId = uid()
    const createdAt = Date.now() // eslint-disable-line react-hooks/purity
    const event = { id: eventId, novelId: activeNovelId, createdAt, worldHistoryEntryId: historyId, ...data }
    const historyEntry = {
      id: historyId,
      novelId: activeNovelId,
      createdAt,
      timelineEventId: eventId,
      title: data.title ?? '',
      era: '',
      dateRange: data.date ?? '',
      content: data.description ?? '',
      tags: data.tags ?? [],
    }
    setTimeline(prev => [...prev, event])
    setWorldHistory(prev => [...prev, historyEntry])
    return event
  }
  const updateEvent = (id, data) => {
    setTimeline(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
    setWorldHistory(prev => prev.map(h => h.timelineEventId === id ? {
      ...h,
      title: data.title ?? h.title,
      dateRange: data.date ?? h.dateRange,
      content: data.description ?? h.content,
      tags: data.tags ?? h.tags,
    } : h))
  }
  const deleteEvent = (id) => {
    setTimeline(prev => prev.filter(e => e.id !== id))
    setWorldHistory(prev => prev.filter(h => h.timelineEventId !== id))
  }

  const addScheduleEvent = (data) => {
    const entry = { id: uid(), novelId: activeNovelId, createdAt: Date.now(), category: 'scene', duration: 1, tags: [], linkedCharacters: [], linkedLocations: [], ...data } // eslint-disable-line react-hooks/purity
    setStorySchedule(prev => [...prev, entry])
    return entry
  }
  const updateScheduleEvent = (id, data) => setStorySchedule(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  const deleteScheduleEvent = (id) => setStorySchedule(prev => prev.filter(e => e.id !== id))

  const addHistoryEntry = (data) => {
    const entry = { id: uid(), novelId: activeNovelId, createdAt: Date.now(), ...data } // eslint-disable-line react-hooks/purity
    setWorldHistory(prev => [...prev, entry])
    return entry
  }
  const updateHistoryEntry = (id, data) => setWorldHistory(prev => prev.map(h => h.id === id ? { ...h, ...data } : h))
  const deleteHistoryEntry = (id) => setWorldHistory(prev => prev.filter(h => h.id !== id))

  const addLoreEntry = (data) => {
    const entry = { id: uid(), novelId: activeNovelId, createdAt: Date.now(), characterIds: [], category: '', content: '', ...data } // eslint-disable-line react-hooks/purity
    setLoreEntries(prev => [...prev, entry])
    return entry
  }
  const updateLoreEntry = (id, data) => setLoreEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  const deleteLoreEntry = (id) => setLoreEntries(prev => prev.filter(e => e.id !== id))

  const addIdeaEntry = (data) => {
    const entry = {
      id: uid(),
      novelId: activeNovelId,
      createdAt: Date.now(), // eslint-disable-line react-hooks/purity
      title: '',
      body: '',
      group: '',
      tags: [],
      color: 'amber',
      x: 40 + (novelIdeaEntries.length % 4) * 230,
      y: 40 + Math.floor(novelIdeaEntries.length / 4) * 170,
      ...data,
    }
    setIdeaEntries(prev => [...prev, entry])
    return entry
  }
  const updateIdeaEntry = (id, data) => setIdeaEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  const deleteIdeaEntry = (id) => setIdeaEntries(prev => prev.filter(e => e.id !== id))

  const addMap = (name, mapType) => {
    const map = { id: uid(), novelId: activeNovelId, name, mapType: mapType || 'regional', mapPins: [], mapRegions: [], created: Date.now() } // eslint-disable-line react-hooks/purity
    setMaps(prev => [...prev, map])
    setActiveMapByNovel(prev => ({ ...prev, [activeNovelId]: map.id }))
    return map.id
  }

  const selectMap = (mapId) => {
    setActiveMapByNovel(prev => ({ ...prev, [activeNovelId]: mapId }))
  }

  const deleteMap = (mapId) => {
    setMaps(prev => prev.filter(m => m.id !== mapId))
    setActiveMapByNovel(prev => {
      if (prev[activeNovelId] !== mapId) return prev
      const nextMap = maps.find(m => m.novelId === activeNovelId && m.id !== mapId)
      return { ...prev, [activeNovelId]: nextMap?.id || null }
    })
  }

  const renameMap = (mapId, name) => {
    setMaps(prev => prev.map(m => m.id === mapId ? { ...m, name } : m))
  }

  const updateActiveMapData = (updater) => {
    const currentActiveMapId = activeMapByNovel[activeNovelId] ?? maps.find(m => m.novelId === activeNovelId)?.id
    if (!currentActiveMapId) return
    setMaps(prev => prev.map(m => {
      if (m.id !== currentActiveMapId) return m
      const patch = updater(m) || {}
      delete patch.mapData
      delete patch.mapOverlay
      return { ...m, ...patch }
    }))
  }

  const updateCurrentYear = (value) => {
    const next = Number(value)
    const normalized = Number.isFinite(next) ? next : 0
    if (activeNovelId) {
      setNovels(prev => prev.map(n => n.id === activeNovelId ? { ...n, currentYear: normalized } : n))
    } else {
      setCurrentYear(normalized)
    }
  }

  const addNovel = (data) => {
    const novel = { id: uid(), createdAt: new Date().toISOString(), ...data }
    setNovels(prev => [...prev, novel]); setActiveNovelId(novel.id); return novel
  }
  const updateNovel = (id, data) => setNovels(prev => prev.map(n => n.id === id ? { ...n, ...data } : n))

  const getProjectExportData = (id) => {
    const project = novels.find(n => n.id === id) ?? null
    if (!project) return null
    const projectSeries = project.seriesId
      ? series.find(s => s.id === project.seriesId) ?? null
      : null
    return {
      exportedAt: new Date().toISOString(),
      project,
      series: projectSeries,
      activeMapId: activeMapByNovel[id] ?? null,
      characters: characters.filter(c => c.novelId === id),
      factions: factions.filter(f => f.novelId === id),
      locations: locations.filter(l => l.novelId === id),
      timeline: timeline.filter(e => e.novelId === id),
      worldHistory: worldHistory.filter(h => h.novelId === id),
      acts: acts.filter(a => a.novelId === id),
      chapters: chapters.filter(c => c.novelId === id),
      scenes: scenes.filter(s => s.novelId === id),
      loreEntries: loreEntries.filter(e => e.novelId === id),
      ideaEntries: ideaEntries.filter(e => e.novelId === id),
      maps: maps.filter(m => m.novelId === id),
      whiteboards: whiteboards.filter(w => w.novelId === id),
      storySchedule: storySchedule.filter(e => e.novelId === id),
    }
  }

  const addSeries = (name) => {
    const s = { id: uid(), name, createdAt: new Date().toISOString() }
    setSeries(prev => [...prev, s])
    return s
  }
  const deleteSeries = (id) => {
    setSeries(prev => prev.filter(s => s.id !== id))
    setNovels(prev => prev.map(n => n.seriesId === id ? { ...n, seriesId: null } : n))
  }
  const updateSeries = (id, data) => setSeries(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
  const reorderSeries = (orderedIds) => setSeries(prev => {
    const map = new Map(prev.map(s => [s.id, s]))
    return orderedIds.map(id => map.get(id)).filter(Boolean)
  })
  const reorderNovels = (orderedIds) => setNovels(prev => {
    const map = new Map(prev.map(n => [n.id, n]))
    return orderedIds.map(id => map.get(id)).filter(Boolean)
  })
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
    setIdeaEntries(prev => prev.filter(e => e.novelId !== id))
    setMaps(prev => prev.filter(m => m.novelId !== id))
    setWhiteboards(prev => prev.filter(w => w.novelId !== id))
    setStorySchedule(prev => prev.filter(e => e.novelId !== id))
    setActiveMapByNovel(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (activeNovelId === id) setActiveNovelId(null)
    setSelectedCharacterId(null)
    setSelectedLocationId(null)
    setSelectedLoreEntryId(null)
    setSelectedIdeaEntryId(null)
  }

  const notifyReadOnly = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('membership-read-only'))
    }
  }

  const readOnlyValue = (name) => {
    notifyReadOnly()
    if (name.startsWith('add') || name === 'saveLocation') return null
    return undefined
  }

  const api = {
    readOnly,
    novels, activeNovelId, activeNovel, setActiveNovelId, addNovel, updateNovel, deleteNovel, getProjectExportData,
    series, addSeries, deleteSeries, updateSeries, reorderSeries, reorderNovels,
    allProjectStats, activeProjectStats,
    characters: seriesScope(characters, 'characters'),
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
    locations: seriesScope(locations, 'locations'),
    saveLocation, deleteLocation,
    timeline: novelTimeline,
    addEvent, updateEvent, deleteEvent,
    worldHistory: novelWorldHistory,
    addHistoryEntry, updateHistoryEntry, deleteHistoryEntry,
    currentYear: activeNovel?.currentYear ?? currentYear, updateCurrentYear,
    loreEntries: novelLoreEntries, addLoreEntry, updateLoreEntry, deleteLoreEntry,
    ideaEntries: novelIdeaEntries, addIdeaEntry, updateIdeaEntry, deleteIdeaEntry,
    whiteboard, updateWhiteboard, mapProject, updateMapProject, addMap, selectMap, deleteMap, renameMap, updateActiveMapData,
    addLocation: saveLocation,
    acts: novelActs, addAct, deleteAct, updateAct, reorderAct, moveAct,
    chapters: novelChapters, addChapter, deleteChapter, updateChapter, reorderChapter, moveChapter,
    scenes: novelScenes, addScene, deleteScene, updateScene, reorderScene, moveScene,
    updateSceneContent,
    selectedCharacterId, setSelectedCharacterId,
    selectedLocationId, setSelectedLocationId,
    selectedLoreEntryId, setSelectedLoreEntryId,
    selectedIdeaEntryId, setSelectedIdeaEntryId,
    storySchedule: novelStorySchedule, addScheduleEvent, updateScheduleEvent, deleteScheduleEvent,
    importData, replaceData, clearData, finishRemoteLoad
  }

  if (!readOnly) return api

  const guardedMethods = [
    'addNovel', 'updateNovel', 'deleteNovel', 'addSeries', 'deleteSeries', 'updateSeries', 'reorderSeries', 'reorderNovels',
    'saveCharacter', 'deleteCharacter', 'setFactions', 'saveLocation', 'deleteLocation',
    'addEvent', 'updateEvent', 'deleteEvent', 'addHistoryEntry', 'updateHistoryEntry', 'deleteHistoryEntry',
    'updateCurrentYear', 'addLoreEntry', 'updateLoreEntry', 'deleteLoreEntry',
    'addIdeaEntry', 'updateIdeaEntry', 'deleteIdeaEntry', 'updateWhiteboard', 'updateMapProject',
    'addMap', 'deleteMap', 'renameMap', 'updateActiveMapData', 'addLocation',
    'addAct', 'deleteAct', 'updateAct', 'reorderAct', 'moveAct',
    'addChapter', 'deleteChapter', 'updateChapter', 'reorderChapter', 'moveChapter',
    'addScene', 'deleteScene', 'updateScene', 'reorderScene', 'moveScene', 'updateSceneContent',
    'addScheduleEvent', 'updateScheduleEvent', 'deleteScheduleEvent', 'replaceData',
  ]

  const guardedApi = { ...api }
  guardedMethods.forEach(name => {
    guardedApi[name] = () => readOnlyValue(name)
  })
  return guardedApi
}
