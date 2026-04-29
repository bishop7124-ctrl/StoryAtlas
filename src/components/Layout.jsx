import { useEffect, useState, useMemo } from 'react'
import UserMenu from './auth/UserMenu'
import AIPanel from './ai/AIPanel'
import Characters from './characters/Characters'
import FamilyTree from './familytree/FamilyTree'
import Factions from './Factions/Factions'
import Lore from './lore/Lore'
import Timeline from './timeline/Timeline'
import WorldHistory from './worldhistory/WorldHistory'
import MapBuilder from './Map/MapBuilder'
import Locations from './Locations/Locations'
import Manuscript from './Manuscript/Manuscript'
import StoryOutline from './outline/StoryOutline'

const DEFAULT_CUSTOM_THEME = {
  bgMain: '#0f1115',
  bgNav: '#14161b',
  textMain: '#f8fafc',
  textMuted: '#64748b',
  accent: '#f59e0b',
  border: '#1e293b',
  hoverAlpha: 0.06,
  accentFadeAlpha: 0.18,
}

// Inspired by popular online palettes (Catppuccin, Nord, Gruvbox, Dracula, Tokyo Night).
const CURATED_PALETTES = [
  {
    id: 'catppuccin-mocha',
    label: 'Catppuccin Mocha',
    theme: {
      bgMain: '#1e1e2e',
      bgNav: '#181825',
      textMain: '#cdd6f4',
      textMuted: '#a6adc8',
      accent: '#89b4fa',
      border: '#313244',
      hoverAlpha: 0.09,
      accentFadeAlpha: 0.22,
    },
  },
  {
    id: 'nord',
    label: 'Nord',
    theme: {
      bgMain: '#2e3440',
      bgNav: '#3b4252',
      textMain: '#eceff4',
      textMuted: '#d8dee9',
      accent: '#88c0d0',
      border: '#4c566a',
      hoverAlpha: 0.07,
      accentFadeAlpha: 0.2,
    },
  },
  {
    id: 'gruvbox-dark',
    label: 'Gruvbox Dark',
    theme: {
      bgMain: '#282828',
      bgNav: '#1d2021',
      textMain: '#ebdbb2',
      textMuted: '#bdae93',
      accent: '#fabd2f',
      border: '#504945',
      hoverAlpha: 0.08,
      accentFadeAlpha: 0.22,
    },
  },
  {
    id: 'dracula',
    label: 'Dracula',
    theme: {
      bgMain: '#282a36',
      bgNav: '#21222c',
      textMain: '#f8f8f2',
      textMuted: '#bd93f9',
      accent: '#ff79c6',
      border: '#44475a',
      hoverAlpha: 0.08,
      accentFadeAlpha: 0.24,
    },
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    theme: {
      bgMain: '#1a1b26',
      bgNav: '#16161e',
      textMain: '#c0caf5',
      textMuted: '#7aa2f7',
      accent: '#bb9af7',
      border: '#292e42',
      hoverAlpha: 0.08,
      accentFadeAlpha: 0.2,
    },
  },
]

const loadCustomTheme = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('nf-custom-theme') || '{}')
    return { ...DEFAULT_CUSTOM_THEME, ...stored }
  } catch {
    return DEFAULT_CUSTOM_THEME
  }
}

const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') return null
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const value = Number.parseInt(clean, 16)
  if (Number.isNaN(value)) return null
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

const rgbaFromHex = (hex, alpha) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(255,255,255,${alpha})`
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
}

const PLANNING_SECTIONS = [
  { id: 'outline', label: 'Story Outline', icon: '📋' },
  { id: 'characters', label: 'Characters', icon: '👤' },
  { id: 'familytree', label: 'Family Tree', icon: '🌳' },
  { id: 'factions', label: 'Factions', icon: '🚩' },
  { id: 'locations', label: 'Locations', icon: '📍' },
  { id: 'lore', label: 'Lore', icon: '📖' },
  { id: 'timeline', label: 'Timeline', icon: '⏳' },
  { id: 'worldhistory', label: 'World History', icon: '📜' },
  { id: 'map', label: 'World Map', icon: '🗺️' },
]

export default function Layout({ store, section, setSection }) {
  const [viewMode, setViewMode] = useState('planning')
  const [aiOpen, setAiOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('nf-theme') || 'midnight')
  const [showThemeEditor, setShowThemeEditor] = useState(false)
  const [customTheme, setCustomTheme] = useState(loadCustomTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('nf-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('nf-custom-theme', JSON.stringify(customTheme))
    if (theme !== 'custom') return

    const root = document.documentElement
    root.style.setProperty('--bg-main', customTheme.bgMain)
    root.style.setProperty('--bg-nav', customTheme.bgNav)
    root.style.setProperty('--text-main', customTheme.textMain)
    root.style.setProperty('--text-muted', customTheme.textMuted)
    root.style.setProperty('--accent', customTheme.accent)
    root.style.setProperty('--border', customTheme.border)
    root.style.setProperty('--bg-hover', rgbaFromHex(customTheme.textMain, customTheme.hoverAlpha))
    root.style.setProperty('--accent-fade', rgbaFromHex(customTheme.accent, customTheme.accentFadeAlpha))
  }, [customTheme, theme])

  const updateCustomTheme = (field, value) => {
    setCustomTheme(prev => ({ ...prev, [field]: value }))
  }

  const resetCustomTheme = () => {
    setCustomTheme(DEFAULT_CUSTOM_THEME)
    setTheme('custom')
  }

  const applyCustomTheme = () => {
    setTheme('custom')
    setShowThemeEditor(false)
  }
  const loadCuratedPalette = (paletteTheme) => {
    setCustomTheme(paletteTheme)
    setTheme('custom')
  }

  useEffect(() => {
    if (!showThemeEditor) return
    if (theme !== 'custom') setTheme('custom')
  }, [showThemeEditor, theme])

  useEffect(() => {
    const handleTeleport = (e) => {
      if (e.detail && e.detail.section) {
        setSection(e.detail.section);
        if (PLANNING_SECTIONS.find(s => s.id === e.detail.section)) {
          setViewMode('planning');
        }
      }
    };
    window.addEventListener('switch-section', handleTeleport);
    return () => window.removeEventListener('switch-section', handleTeleport);
  }, [setSection]);

  // Build a smart initial context hint based on what the user is currently viewing
  const initialContext = useMemo(() => {
    if (viewMode === 'writing') {
      return { characterIds: [], locationIds: [], loreEntryIds: [], chapterIds: store.chapters.map(c => c.id), customInstruction: '' }
    }
    if (section === 'characters' && store.selectedCharacterId) {
      return { characterIds: [store.selectedCharacterId], locationIds: [], loreEntryIds: [], chapterIds: [], customInstruction: '' }
    }
    if (section === 'locations' && store.selectedLocationId) {
      return { characterIds: [], locationIds: [store.selectedLocationId], loreEntryIds: [], chapterIds: [], customInstruction: '' }
    }
    return { characterIds: [], locationIds: [], loreEntryIds: [], chapterIds: [], customInstruction: '' }
  }, [viewMode, section, store.selectedCharacterId, store.selectedLocationId, store.chapters])

  const databaseContent = {
    outline: <StoryOutline store={store} />,
    characters: <Characters store={store} />,
    familytree: <FamilyTree store={store} />, 
    factions: <Factions store={store} />,
    locations: <Locations store={store} />,
    lore: <Lore store={store} />,
    timeline: <Timeline store={store} />,
    worldhistory: <WorldHistory store={store} />,
    map: <MapBuilder store={store} />,
  }

  return (
    <>
    <div className="flex flex-col h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden text-left transition-colors duration-300">
      
      {/* TOP NAVIGATION BAR */}
      <header className="h-14 bg-[var(--bg-nav)] border-b border-[var(--border)] flex items-center justify-between px-6 flex-shrink-0 transition-colors duration-300">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-[var(--accent)] font-black text-lg tracking-tighter leading-none">NovelForge</span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-1">{store.activeNovel?.title || "Draft"}</span>
          </div>

          <nav className="flex gap-1 bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border)]">
            <button 
              onClick={() => setViewMode('planning')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'planning' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              PLANNING
            </button>
            <button 
              onClick={() => setViewMode('writing')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'writing' ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              WRITING
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <select 
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border)] text-xs font-bold px-2 py-1.5 rounded outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="midnight">🌙 Midnight</option>
            <option value="aubergine">🍆 Aubergine</option>
            <option value="paper">📜 Paper</option>
            <option value="ocean">🌊 Ocean</option>
            <option value="custom">🎛 Custom</option>
          </select>
          <button
            onClick={() => setAiOpen(v => !v)}
            className={`flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase transition-colors ${aiOpen ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--accent)]'}`}
            title="AI Assistant"
          >
            <span className="text-base leading-none">✦</span>
            <span>AI</span>
          </button>

          <button
            onClick={() => setShowThemeEditor(v => !v)}
            className="text-xs font-bold tracking-wide uppercase text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            Customize
          </button>

          <button
            onClick={() => store.setActiveNovelId(null)}
            className="text-xs font-bold tracking-wider uppercase text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          >
            Exit
          </button>

          <div className="w-px h-5 bg-[var(--border)]" />
          <UserMenu />
        </div>
      </header>

      {/* MAIN AREA */}
      <div className="flex flex-1 overflow-hidden">
        {showThemeEditor && (
          <aside className="w-72 bg-[var(--bg-nav)] border-r border-[var(--border)] p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Theme Editor</h3>
              <button onClick={() => setShowThemeEditor(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">✕</button>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Curated Palettes</span>
              <div className="grid grid-cols-1 gap-1.5">
                {CURATED_PALETTES.map(palette => (
                  <button
                    key={palette.id}
                    onClick={() => loadCuratedPalette(palette.theme)}
                    className="w-full text-left border border-[var(--border)] rounded px-2 py-1.5 hover:border-[var(--accent)] transition-colors"
                  >
                    <div className="text-xs text-[var(--text-main)] font-semibold">{palette.label}</div>
                    <div className="flex gap-1 mt-1">
                      {[palette.theme.bgMain, palette.theme.bgNav, palette.theme.accent, palette.theme.textMain].map(color => (
                        <span key={`${palette.id}-${color}`} className="w-4 h-2 rounded-sm border border-black/20" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {[
              ['bgMain', 'Background'],
              ['bgNav', 'Panels'],
              ['textMain', 'Main Text'],
              ['textMuted', 'Muted Text'],
              ['accent', 'Accent'],
              ['border', 'Borders'],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={customTheme[key]}
                    onChange={(e) => updateCustomTheme(key, e.target.value)}
                    className="w-9 h-8 bg-transparent border border-[var(--border)] rounded cursor-pointer"
                  />
                  <input
                    value={customTheme[key]}
                    onChange={(e) => updateCustomTheme(key, e.target.value)}
                    className="flex-1 bg-[var(--bg-main)] border border-[var(--border)] rounded px-2 py-1.5 text-xs text-[var(--text-main)]"
                  />
                </div>
              </label>
            ))}

            <label className="block">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Hover Intensity</span>
              <input
                type="range"
                min="0.02"
                max="0.2"
                step="0.01"
                value={customTheme.hoverAlpha}
                onChange={(e) => updateCustomTheme('hoverAlpha', Number(e.target.value))}
                className="w-full mt-2"
              />
            </label>

            <label className="block">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Accent Glow</span>
              <input
                type="range"
                min="0.08"
                max="0.4"
                step="0.01"
                value={customTheme.accentFadeAlpha}
                onChange={(e) => updateCustomTheme('accentFadeAlpha', Number(e.target.value))}
                className="w-full mt-2"
              />
            </label>

            <div className="flex gap-2 pt-2">
              <button onClick={applyCustomTheme} className="flex-1 bg-[var(--accent)] text-[var(--bg-main)] text-xs font-bold py-2 rounded hover:opacity-90">Apply</button>
              <button onClick={resetCustomTheme} className="px-3 text-xs border border-[var(--border)] text-[var(--text-muted)] rounded hover:text-[var(--text-main)]">Reset</button>
            </div>
          </aside>
        )}

        {viewMode === 'planning' ? (
          <>
            <aside className="w-52 bg-[var(--bg-nav)] border-r border-[var(--border)] flex flex-col flex-shrink-0 transition-colors duration-300">
              <nav className="flex-1 p-3 space-y-1">
                {PLANNING_SECTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className="w-full text-left px-3 py-2.5 rounded text-sm flex items-center gap-3 transition-colors"
                    style={{
                      backgroundColor: section === s.id ? 'var(--accent-fade)' : 'transparent',
                      color: section === s.id ? 'var(--accent)' : 'var(--text-muted)',
                      fontWeight: section === s.id ? '600' : '500'
                    }}
                  >
                    <span className="text-base leading-none opacity-80">{s.icon}</span>
                    <span className="hover:text-[var(--text-main)]">{s.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
            <main className="flex-1 overflow-hidden bg-[var(--bg-main)]">
              {databaseContent[section] || databaseContent['characters']}
            </main>
          </>
        ) : (
          <main className="flex-1 overflow-hidden">
            <Manuscript store={store} />
          </main>
        )}
      </div>
    </div>

    <AIPanel
      store={store}
      open={aiOpen}
      onClose={() => setAiOpen(false)}
      initialContext={initialContext}
    />
    </>
  )
}