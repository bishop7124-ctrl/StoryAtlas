// defaultSections: sections shown by default for this project type.
// All sections in ALL_SECTIONS (Layout.jsx) are available to enable per project.
// Projects may override with an enabledSections field on the novel object.

export const PROJECT_TYPES = {
  novel: {
    label: 'Novel',
    icon: '📚',
    description: 'Full-length prose fiction with rich worldbuilding',
    structure: { level1: 'Act', level2: 'Chapter', level3: 'Scene' },
    storyEventIndicators: [
      { id: 'hook', label: 'Hook', color: '#38bdf8' },
      { id: 'inciting_incident', label: 'Inciting incident', color: '#f97316' },
      { id: 'first_plot_point', label: 'First plot point', color: '#a855f7' },
      { id: 'midpoint', label: 'Midpoint', color: '#22c55e' },
      { id: 'dark_night', label: 'Dark night', color: '#64748b' },
      { id: 'climax', label: 'Climax', color: '#ef4444' },
      { id: 'resolution', label: 'Resolution', color: '#eab308' },
    ],
    planningTab: 'PLANNING',
    writingTab: 'WRITING',
    defaultSections: [
      'outline','characters','familytree','factions',
      'locations','lore','ideas','schedule','timeline','worldhistory','aitools',
    ],
    // map available but not default — enable via project settings
  },
  novella: {
    label: 'Novella',
    icon: '📖',
    description: 'Medium-length prose fiction — lighter than a novel',
    structure: { level1: 'Part', level2: 'Chapter', level3: 'Scene' },
    storyEventIndicators: [
      { id: 'opening_turn', label: 'Opening turn', color: '#38bdf8' },
      { id: 'inciting_incident', label: 'Inciting incident', color: '#f97316' },
      { id: 'point_of_no_return', label: 'Point of no return', color: '#a855f7' },
      { id: 'reversal', label: 'Reversal', color: '#22c55e' },
      { id: 'climax', label: 'Climax', color: '#ef4444' },
      { id: 'fallout', label: 'Fallout', color: '#eab308' },
    ],
    planningTab: 'PLANNING',
    writingTab: 'WRITING',
    defaultSections: [
      'outline','characters','locations','lore','ideas','schedule','timeline','aitools',
    ],
    // familytree, factions, map, worldhistory available but not default
  },
  short_story: {
    label: 'Short Story',
    icon: '📄',
    description: 'Brief prose fiction — focused and stripped-down',
    structure: { level1: 'Part', level2: 'Section', level3: 'Scene' },
    storyEventIndicators: [
      { id: 'opening_image', label: 'Opening image', color: '#38bdf8' },
      { id: 'disruption', label: 'Disruption', color: '#f97316' },
      { id: 'turn', label: 'Turn', color: '#a855f7' },
      { id: 'reveal', label: 'Reveal', color: '#22c55e' },
      { id: 'climax', label: 'Climax', color: '#ef4444' },
      { id: 'final_image', label: 'Final image', color: '#eab308' },
    ],
    planningTab: 'PLANNING',
    writingTab: 'WRITING',
    defaultSections: [
      'outline','characters','locations','lore','ideas','schedule','timeline','aitools',
    ],
    // heavy sections (factions, map, worldhistory) available but not default
  },
  play: {
    label: 'Play',
    icon: '🎭',
    description: 'Stage play or theatrical script',
    structure: { level1: 'Act', level2: 'Scene', level3: 'Beat' },
    storyEventIndicators: [
      { id: 'opening_tableau', label: 'Opening tableau', color: '#38bdf8' },
      { id: 'inciting_action', label: 'Inciting action', color: '#f97316' },
      { id: 'entrance', label: 'Key entrance', color: '#a855f7' },
      { id: 'reversal', label: 'Reversal', color: '#22c55e' },
      { id: 'curtain', label: 'Curtain moment', color: '#eab308' },
      { id: 'climax', label: 'Climax', color: '#ef4444' },
      { id: 'denouement', label: 'Denouement', color: '#14b8a6' },
    ],
    planningTab: 'PLANNING',
    writingTab: 'SCRIPT',
    defaultSections: [
      'outline','characters','familytree','locations','lore','ideas','schedule','aitools',
    ],
    // map, timeline, factions not default — locations kept for stage settings
  },
  screenplay: {
    label: 'Screenplay',
    icon: '🎬',
    description: 'Feature film or short film script',
    structure: { level1: 'Act', level2: 'Sequence', level3: 'Scene' },
    storyEventIndicators: [
      { id: 'opening_image', label: 'Opening image', color: '#38bdf8' },
      { id: 'inciting_incident', label: 'Inciting incident', color: '#f97316' },
      { id: 'break_into_two', label: 'Break into Act II', color: '#a855f7' },
      { id: 'midpoint', label: 'Midpoint', color: '#22c55e' },
      { id: 'all_is_lost', label: 'All is lost', color: '#64748b' },
      { id: 'finale', label: 'Finale', color: '#ef4444' },
      { id: 'final_image', label: 'Final image', color: '#eab308' },
    ],
    planningTab: 'PLANNING',
    writingTab: 'SCRIPT',
    defaultSections: [
      'outline','characters','familytree','factions',
      'locations','lore','ideas','schedule','timeline','aitools',
    ],
    // relationships enabled by default for character-heavy scripts
  },
  tv_show: {
    label: 'TV Series',
    icon: '📺',
    description: 'Multi-episode television series',
    structure: { level1: 'Season', level2: 'Episode', level3: 'Act' },
    storyEventIndicators: [
      { id: 'pilot_hook', label: 'Pilot hook', color: '#38bdf8' },
      { id: 'case_engine', label: 'Story engine', color: '#f97316' },
      { id: 'episode_break', label: 'Episode break', color: '#a855f7' },
      { id: 'midseason_turn', label: 'Midseason turn', color: '#22c55e' },
      { id: 'bottle_episode', label: 'Bottle episode', color: '#14b8a6' },
      { id: 'season_climax', label: 'Season climax', color: '#ef4444' },
      { id: 'cliffhanger', label: 'Cliffhanger', color: '#eab308' },
    ],
    planningTab: 'PLANNING',
    writingTab: 'EPISODES',
    defaultSections: [
      'outline','characters','familytree','factions',
      'locations','lore','ideas','schedule','timeline','worldhistory','aitools',
    ],
    // map available but not default
  },
  dnd_campaign: {
    label: 'D&D Campaign',
    icon: '⚔️',
    description: 'Dungeons & Dragons fantasy tabletop adventure',
    hint: 'Designed for D&D — classes, gods, dungeons, monsters, and high-fantasy lore.',
    structure: { level1: 'Story Arc', level2: 'Session', level3: 'Encounter' },
    storyEventIndicators: [
      { id: 'quest_hook', label: 'Quest hook', color: '#38bdf8' },
      { id: 'inciting_quest', label: 'Inciting quest', color: '#f97316' },
      { id: 'dungeon_reveal', label: 'Dungeon reveal', color: '#a855f7' },
      { id: 'boss_battle', label: 'Boss battle', color: '#ef4444' },
      { id: 'party_setback', label: 'Party setback', color: '#64748b' },
      { id: 'arc_climax', label: 'Arc climax', color: '#dc2626' },
      { id: 'reward_fallout', label: 'Reward / fallout', color: '#eab308' },
    ],
    planningTab: 'WORLDBUILDING',
    writingTab: 'SESSIONS',
    defaultSections: [
      'outline','characters','familytree','factions',
      'locations','lore','ideas','schedule','timeline','worldhistory','map','aitools',
    ],
  },
  tabletop_rpg: {
    label: 'TTRPG Campaign',
    icon: '🎲',
    description: 'System-agnostic tabletop roleplaying campaign',
    hint: 'System-neutral — works for any ruleset: PF2e, Call of Cthulhu, Blades in the Dark, homebrew, and more.',
    structure: { level1: 'Story Arc', level2: 'Session', level3: 'Encounter' },
    storyEventIndicators: [
      { id: 'adventure_hook', label: 'Adventure hook', color: '#38bdf8' },
      { id: 'mission_start', label: 'Mission start', color: '#f97316' },
      { id: 'complication', label: 'Complication', color: '#a855f7' },
      { id: 'player_choice', label: 'Major choice', color: '#22c55e' },
      { id: 'showdown', label: 'Showdown', color: '#ef4444' },
      { id: 'arc_climax', label: 'Arc climax', color: '#dc2626' },
      { id: 'consequences', label: 'Consequences', color: '#eab308' },
    ],
    planningTab: 'WORLDBUILDING',
    writingTab: 'SESSIONS',
    defaultSections: [
      'outline','characters','familytree','factions',
      'locations','lore','ideas','schedule','timeline','worldhistory','map','aitools',
    ],
  },
  comic: {
    label: 'Comic / Graphic Novel',
    icon: '💬',
    description: 'Sequential art narrative',
    structure: { level1: 'Volume', level2: 'Issue', level3: 'Page' },
    storyEventIndicators: [
      { id: 'splash', label: 'Splash moment', color: '#38bdf8' },
      { id: 'inciting_panel', label: 'Inciting panel', color: '#f97316' },
      { id: 'page_turn', label: 'Page turn', color: '#a855f7' },
      { id: 'reveal', label: 'Reveal', color: '#22c55e' },
      { id: 'issue_climax', label: 'Issue climax', color: '#ef4444' },
      { id: 'stinger', label: 'Stinger', color: '#eab308' },
    ],
    planningTab: 'PLANNING',
    writingTab: 'PAGES',
    defaultSections: [
      'outline','characters','familytree','locations',
      'lore','ideas','schedule','timeline','map','aitools',
    ],
    // worldhistory available but not default for comics
  },
  video_game: {
    label: 'Video Game',
    icon: '🎮',
    description: 'Interactive narrative or game world',
    // TODO: future structure options — quests, missions, dialogue trees, branching paths
    structure: { level1: 'Act', level2: 'Chapter', level3: 'Scene' },
    storyEventIndicators: [
      { id: 'tutorial_hook', label: 'Tutorial hook', color: '#38bdf8' },
      { id: 'call_to_action', label: 'Call to action', color: '#f97316' },
      { id: 'first_choice', label: 'First major choice', color: '#22c55e' },
      { id: 'quest_turn', label: 'Quest turn', color: '#a855f7' },
      { id: 'boss_encounter', label: 'Boss encounter', color: '#ef4444' },
      { id: 'final_mission', label: 'Final mission', color: '#dc2626' },
      { id: 'ending_state', label: 'Ending state', color: '#eab308' },
    ],
    planningTab: 'WORLDBUILDING',
    writingTab: 'LEVELS',
    defaultSections: [
      'outline','characters','factions',
      'locations','lore','ideas','schedule','timeline','worldhistory','map','aitools',
    ],
    // familytree intentionally not default for party/faction relationships
    // TODO: quests, missions, dialogue trees, branching paths, choice consequences
  },
}

export const getProjectType = (type) => PROJECT_TYPES[type] ?? PROJECT_TYPES.novel

export const getStoryEventIndicators = (type) =>
  getProjectType(type).storyEventIndicators ?? PROJECT_TYPES.novel.storyEventIndicators

export const DEFAULT_TYPE = 'novel'

// All section IDs that exist in the app — used to validate enabledSections overrides.
export const ALL_SECTION_IDS = [
  'outline','characters','familytree','factions',
  'locations','lore','ideas','schedule','timeline','worldhistory','map','aitools',
]

// Returns the active section list for a project, supporting per-project overrides.
// Default: all sections on. Users opt-out via project settings.
// Use novel.enabledSections (saved by ProjectSettings) to persist preferences.
export const getEnabledSections = (novel) => {
  const override = novel?.enabledSections
  if (Array.isArray(override)) return override.filter(id => id !== 'network')
  return ALL_SECTION_IDS
}
