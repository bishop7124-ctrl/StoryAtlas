import { supabase } from '../supabase'

const PROJECT_FIELDS = [
  'characters', 'factions', 'locations', 'timeline',
  'worldHistory', 'acts', 'chapters', 'loreEntries',
  'ideaEntries', 'maps', 'whiteboards', 'storySchedule',
]

export async function loadUserData(userId) {
  const [{ data: appData }, { data: projectRows }, { data: scenesData }] = await Promise.all([
    supabase.from('user_data').select('data').eq('user_id', userId).maybeSingle(),
    supabase.from('project_data').select('project_id, data').eq('user_id', userId),
    supabase.from('scenes').select('data').eq('user_id', userId)
  ])

  const ud = appData?.data ?? {}

  const flat = {
    characters: [], factions: [], locations: [], timeline: [],
    worldHistory: [], acts: [], chapters: [], loreEntries: [],
    ideaEntries: [], maps: [], whiteboards: [], storySchedule: [],
    activeMapByNovel: {},
  }

  for (const row of (projectRows ?? [])) {
    const pd = row.data ?? {}
    for (const field of PROJECT_FIELDS) {
      flat[field].push(...(pd[field] ?? []))
    }
    if (pd.activeMapId != null) {
      flat.activeMapByNovel[row.project_id] = pd.activeMapId
    }
  }

  // Migration: if no project_data rows exist yet, read project-level arrays from old user_data blob
  if (!projectRows?.length && PROJECT_FIELDS.some(f => ud[f]?.length > 0)) {
    for (const field of PROJECT_FIELDS) {
      flat[field].push(...(ud[field] ?? []))
    }
    if (ud.activeMapByNovel) {
      Object.assign(flat.activeMapByNovel, ud.activeMapByNovel)
    }
  }

  return {
    novels:        ud.novels        ?? [],
    series:        ud.series        ?? [],
    activeNovelId: ud.activeNovelId ?? null,
    ...flat,
    scenes: (scenesData ?? []).map(s => s.data)
  }
}

export async function saveAppData(userId, data) {
  // Group project-scoped arrays by novelId into per-project blobs
  const projectBlobs = {}
  for (const field of PROJECT_FIELDS) {
    for (const item of (data[field] ?? [])) {
      if (!item?.novelId) continue
      const b = (projectBlobs[item.novelId] ??= {})
      ;(b[field] ??= []).push(item)
    }
  }
  for (const [novelId, mapId] of Object.entries(data.activeMapByNovel ?? {})) {
    ;(projectBlobs[novelId] ??= {}).activeMapId = mapId
  }

  const userData = {
    novels:        data.novels        ?? [],
    series:        data.series        ?? [],
    activeNovelId: data.activeNovelId ?? null,
  }

  await Promise.all([
    supabase.from('user_data').upsert({ user_id: userId, data: userData }),
    ...Object.entries(projectBlobs).map(([projectId, pData]) =>
      supabase.from('project_data').upsert({ user_id: userId, project_id: projectId, data: pData })
    )
  ])
}

export async function saveSceneDoc(userId, scene) {
  await supabase.from('scenes').upsert({ user_id: userId, scene_id: scene.id, data: scene })
}

export async function deleteSceneDoc(userId, sceneId) {
  await supabase.from('scenes').delete().eq('user_id', userId).eq('scene_id', sceneId)
}

export async function deleteProjectData(userId, projectId) {
  await supabase.from('project_data').delete().eq('user_id', userId).eq('project_id', projectId)
}
