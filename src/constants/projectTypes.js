// defaultSections: sections shown by default for this project type.
// All sections in ALL_SECTIONS (Layout.jsx) are available to enable per project.
// Projects may override with an enabledSections field on the novel object.

export const PROJECT_TYPES = {
  novel: {
    label: 'Novel',
    icon: '📚',
    description: 'Full-length prose fiction with rich worldbuilding',
    structure: { level1: 'Act', level2: 'Chapter', level3: 'Scene' },
    planningTab: 'PLANNING',
    writingTab: 'WRITING',
    defaultSections: [
      'outline','characters','familytree','factions',
      'locations','lore','ideas','schedule','timeline','worldhistory',
    ],
    // map available but not default — enable via project settings
  },
  novella: {
    label: 'Novella',
    icon: '📖',
    description: 'Medium-length prose fiction — lighter than a novel',
    structure: { level1: 'Part', level2: 'Chapter', level3: 'Scene' },
    planningTab: 'PLANNING',
    writingTab: 'WRITING',
    defaultSections: [
      'outline','characters','locations','lore','ideas','schedule','timeline',
    ],
    // familytree, factions, map, worldhistory available but not default
  },
  short_story: {
    label: 'Short Story',
    icon: '📄',
    description: 'Brief prose fiction — focused and stripped-down',
    structure: { level1: 'Part', level2: 'Section', level3: 'Scene' },
    planningTab: 'PLANNING',
    writingTab: 'WRITING',
    defaultSections: [
      'outline','characters','locations','lore','ideas','schedule','timeline',
    ],
    // heavy sections (factions, map, worldhistory) available but not default
  },
  play: {
    label: 'Play',
    icon: '🎭',
    description: 'Stage play or theatrical script',
    structure: { level1: 'Act', level2: 'Scene', level3: 'Beat' },
    planningTab: 'PLANNING',
    writingTab: 'SCRIPT',
    defaultSections: [
      'outline','characters','familytree','locations','lore','ideas','schedule',
    ],
    // map, timeline, factions not default — locations kept for stage settings
  },
  screenplay: {
    label: 'Screenplay',
    icon: '🎬',
    description: 'Feature film or short film script',
    structure: { level1: 'Act', level2: 'Sequence', level3: 'Scene' },
    planningTab: 'PLANNING',
    writingTab: 'SCRIPT',
    defaultSections: [
      'outline','characters','familytree','factions',
      'locations','lore','ideas','schedule','timeline',
    ],
    // relationships enabled by default for character-heavy scripts
  },
  tv_show: {
    label: 'TV Series',
    icon: '📺',
    description: 'Multi-episode television series',
    structure: { level1: 'Season', level2: 'Episode', level3: 'Act' },
    planningTab: 'PLANNING',
    writingTab: 'EPISODES',
    defaultSections: [
      'outline','characters','familytree','factions',
      'locations','lore','ideas','schedule','timeline','worldhistory',
    ],
    // map available but not default
  },
  dnd_campaign: {
    label: 'D&D Campaign',
    icon: '⚔️',
    description: 'Dungeons & Dragons fantasy tabletop adventure',
    hint: 'Designed for D&D — classes, gods, dungeons, monsters, and high-fantasy lore.',
    structure: { level1: 'Story Arc', level2: 'Session', level3: 'Encounter' },
    planningTab: 'WORLDBUILDING',
    writingTab: 'SESSIONS',
    defaultSections: [
      'outline','characters','familytree','factions',
      'locations','lore','ideas','schedule','timeline','worldhistory','map',
    ],
  },
  tabletop_rpg: {
    label: 'TTRPG Campaign',
    icon: '🎲',
    description: 'System-agnostic tabletop roleplaying campaign',
    hint: 'System-neutral — works for any ruleset: PF2e, Call of Cthulhu, Blades in the Dark, homebrew, and more.',
    structure: { level1: 'Story Arc', level2: 'Session', level3: 'Encounter' },
    planningTab: 'WORLDBUILDING',
    writingTab: 'SESSIONS',
    defaultSections: [
      'outline','characters','familytree','factions',
      'locations','lore','ideas','schedule','timeline','worldhistory','map',
    ],
  },
  comic: {
    label: 'Comic / Graphic Novel',
    icon: '💬',
    description: 'Sequential art narrative',
    structure: { level1: 'Volume', level2: 'Issue', level3: 'Page' },
    planningTab: 'PLANNING',
    writingTab: 'PAGES',
    defaultSections: [
      'outline','characters','familytree','locations',
      'lore','ideas','schedule','timeline','map',
    ],
    // worldhistory available but not default for comics
  },
  video_game: {
    label: 'Video Game',
    icon: '🎮',
    description: 'Interactive narrative or game world',
    // TODO: future structure options — quests, missions, dialogue trees, branching paths
    structure: { level1: 'Act', level2: 'Chapter', level3: 'Scene' },
    planningTab: 'WORLDBUILDING',
    writingTab: 'LEVELS',
    defaultSections: [
      'outline','characters','factions',
      'locations','lore','ideas','schedule','timeline','worldhistory','map',
    ],
    // familytree intentionally not default for party/faction relationships
    // TODO: quests, missions, dialogue trees, branching paths, choice consequences
  },
}

export const getProjectType = (type) => PROJECT_TYPES[type] ?? PROJECT_TYPES.novel

export const DEFAULT_TYPE = 'novel'

// All section IDs that exist in the app — used to validate enabledSections overrides.
export const ALL_SECTION_IDS = [
  'outline','characters','familytree','factions',
  'locations','lore','ideas','schedule','timeline','worldhistory','map',
]

// Returns the active section list for a project, supporting per-project overrides.
// Default: all sections on. Users opt-out via project settings.
// Use novel.enabledSections (saved by ProjectSettings) to persist preferences.
export const getEnabledSections = (novel) => {
  const override = novel?.enabledSections
  if (Array.isArray(override)) return override.filter(id => id !== 'network')
  return ALL_SECTION_IDS
}
