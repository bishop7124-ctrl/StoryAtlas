import { supabase } from '../supabase'

export async function loadUserData(userId) {
  const [{ data: appData }, { data: scenesData }] = await Promise.all([
    supabase.from('user_data').select('data').eq('user_id', userId).maybeSingle(),
    supabase.from('scenes').select('data').eq('user_id', userId)
  ])

  const d = appData?.data ?? {}
  return {
    novels:        d.novels        ?? [],
    characters:    d.characters    ?? [],
    factions:      d.factions      ?? [],
    locations:     d.locations     ?? [],
    timeline:      d.timeline      ?? [],
    worldHistory:  d.worldHistory  ?? [],
    acts:          d.acts          ?? [],
    chapters:      d.chapters      ?? [],
    loreEntries:   d.loreEntries   ?? [],
    ideaEntries:   d.ideaEntries   ?? [],
    maps:          d.maps          ?? [],
    activeMapByNovel: d.activeMapByNovel ?? {},
    whiteboards:   d.whiteboards   ?? [],
    series:        d.series        ?? [],
    storySchedule: d.storySchedule ?? [],
    currentYear:   d.currentYear   ?? 0,
    activeNovelId: d.activeNovelId ?? null,
    scenes: (scenesData ?? []).map(s => s.data)
  }
}

export async function saveAppData(userId, data) {
  await supabase.from('user_data').upsert({ user_id: userId, data })
}

export async function saveSceneDoc(userId, scene) {
  await supabase.from('scenes').upsert({ user_id: userId, scene_id: scene.id, data: scene })
}

export async function deleteSceneDoc(userId, sceneId) {
  await supabase.from('scenes').delete().eq('user_id', userId).eq('scene_id', sceneId)
}
