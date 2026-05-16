import { Component, useEffect, useState, useMemo } from 'react'
import UserMenu from './auth/UserMenu'
import AIPanel from './ai/AIPanel'
import AIAssistant from './ai/AIAssistant'
import Characters from './characters/Characters'
import FamilyTree from './familytree/FamilyTree'
import Factions from './Factions/Factions'
import Lore from './lore/Lore'
import IdeasBoard from './ideas/IdeasBoard'
import Timeline from './timeline/Timeline'
import WorldHistory from './worldhistory/WorldHistory'
import MapBuilder from './Map/MapBuilder'
import Locations from './Locations/Locations'
import Manuscript from './Manuscript/Manuscript'
import StoryOutline from './outline/StoryOutline'
import ProjectDashboard from './dashboard/ProjectDashboard'
import ScheduleCalendar from './schedule/ScheduleCalendar'
import { getProjectType } from '../constants/projectTypes'
import { StudioFrame, StudioWorkspace, StudioTab, StudioButton } from './presentation/Studio'

// ─── Icons ───────────────────────────────────────────────────────────────────

function Icon({ name, size = 16 }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
  }
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    planning: <><path d="M4 5h16" /><path d="M4 12h10" /><path d="M4 19h16" /><path d="M16 9l3 3-3 3" /></>,
    lore: <><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4-4z" /><path d="M5 4v16" /><path d="M9 8h6" /><path d="M9 12h5" /></>,
    characters: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><circle cx="17" cy="10" r="2.5" /><path d="M14.5 20a4.5 4.5 0 0 1 6 0" /></>,
    atlas: <><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3z" /><path d="M9 3v15" /><path d="M15 6v15" /></>,
    history: <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /><path d="M4 4l3 3" /></>,
    manuscript: <><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4" /><path d="M9 12h6" /><path d="M9 16h6" /></>,
    outline: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
    familytree: <><circle cx="12" cy="5" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M12 8v4" /><path d="M6 15v-3h12v3" /></>,
    factions: <><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>,
    locations: <><path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    ideas: <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M8.5 14.5a6 6 0 1 1 7 0c-.8.7-1.5 1.5-1.5 2.5h-4c0-1-.7-1.8-1.5-2.5z" /></>,
    timeline: <><path d="M4 5v14" /><circle cx="4" cy="5" r="1.5" /><circle cx="4" cy="12" r="1.5" /><circle cx="4" cy="19" r="1.5" /><path d="M8 5h12" /><path d="M8 12h9" /><path d="M8 19h12" /></>,
    worldhistory: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></>,
    map: <><path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z" /><path d="M9 4v13" /><path d="M15 7v13" /></>,
    note: <><path d="M5 4h14v16H5z" /><path d="M8 8h8" /><path d="M8 12h8" /><path d="M8 16h5" /></>,
    schedule: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /></>,
  }
  return <svg {...common}>{paths[name] || paths.note}</svg>
}

// ─── Error boundary ───────────────────────────────────────────────────────────

class SectionErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <p className="text-[var(--text-main)] font-semibold">This section ran into an error.</p>
        <p className="text-[var(--text-muted)] text-sm max-w-xs">{this.state.error?.message}</p>
        <button onClick={() => this.setState({ error: null })} className="mt-1 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--bg-main)] font-bold text-xs">Retry</button>
      </div>
    )
    return this.props.children
  }
}

// ─── Theme data ───────────────────────────────────────────────────────────────

const PRESET_THEMES = [
  { id: 'atelier',     label: 'Atelier',     description: 'Dark forest studio',   swatches: { bgMain: '#0e1512', bgNav: '#141c16', textMain: '#dce8d7', textMuted: '#6b856d', accent: '#8fcb9e', border: '#1e2c20' } },
  { id: 'scriptorium', label: 'Scriptorium', description: 'Warm dark desk',      swatches: { bgMain: '#14100c', bgNav: '#241b13', textMain: '#f4ead9', textMuted: '#b8a58f', accent: '#c89445', border: '#3c3023' } },
  { id: 'ink',         label: 'Night Ink',   description: 'Cool low-light focus', swatches: { bgMain: '#0d1114', bgNav: '#171d20', textMain: '#edf1ee', textMuted: '#95a39d', accent: '#8bb9a8', border: '#283237' } },
  { id: 'vellum',      label: 'Vellum',      description: 'Soft paper mode',      swatches: { bgMain: '#f3ead9', bgNav: '#e6d8bf', textMain: '#221b14', textMuted: '#71624e', accent: '#8a3f2d', border: '#c9b89e' } },
  { id: 'maproom',     label: 'Map Room',    description: 'Muted green studio',   swatches: { bgMain: '#101719', bgNav: '#1b2726', textMain: '#e8efe8', textMuted: '#97aaa1', accent: '#b6a15d', border: '#33413c' } },
]

const CURATED_PALETTES = [
  { id: 'catppuccin', label: 'Catppuccin',    swatches: { bgMain: '#1e1e2e', bgNav: '#181825', textMain: '#cdd6f4', textMuted: '#a6adc8', accent: '#89b4fa', border: '#313244' } },
  { id: 'nord',       label: 'Nord',          swatches: { bgMain: '#2e3440', bgNav: '#3b4252', textMain: '#eceff4', textMuted: '#d8dee9', accent: '#88c0d0', border: '#4c566a' } },
  { id: 'dracula',    label: 'Dracula',       swatches: { bgMain: '#282a36', bgNav: '#21222c', textMain: '#f8f8f2', textMuted: '#bd93f9', accent: '#ff79c6', border: '#44475a' } },
  { id: 'tokyo',      label: 'Tokyo Night',   swatches: { bgMain: '#1a1b26', bgNav: '#16161e', textMain: '#c0caf5', textMuted: '#7aa2f7', accent: '#bb9af7', border: '#292e42' } },
  { id: 'rosepine',   label: 'Rosé Pine',     swatches: { bgMain: '#191724', bgNav: '#1f1d2e', textMain: '#e0def4', textMuted: '#908caa', accent: '#ebbcba', border: '#403d52' } },
  { id: 'gruvbox',    label: 'Gruvbox Dark',  swatches: { bgMain: '#282828', bgNav: '#1d2021', textMain: '#ebdbb2', textMuted: '#bdae93', accent: '#fabd2f', border: '#504945' } },
  { id: 'everforest', label: 'Everforest',    swatches: { bgMain: '#2d353b', bgNav: '#272e33', textMain: '#d3c6aa', textMuted: '#9da9a0', accent: '#a7c080', border: '#414b50' } },
  { id: 'solarized',  label: 'Solarized',     swatches: { bgMain: '#002b36', bgNav: '#073642', textMain: '#839496', textMuted: '#657b83', accent: '#268bd2', border: '#094556' } },
]

const FONT_OPTIONS = [
  { id: 'system',    label: 'System UI',  value: 'system-ui, sans-serif' },
  { id: 'serif',     label: 'Serif',      value: 'Georgia, "Times New Roman", serif' },
  { id: 'mono',      label: 'Mono',       value: '"SFMono-Regular", Consolas, "Liberation Mono", monospace' },
  { id: 'dyslexia',  label: 'Readable',   value: 'Atkinson Hyperlegible, Verdana, Arial, sans-serif' },
]

const RADIUS_OPTIONS = [
  { id: 'sharp',   label: 'Sharp' },
  { id: 'default', label: 'Default' },
  { id: 'rounded', label: 'Soft' },
]

const CUSTOM_COLOR_FIELDS = [
  { key: 'bgMain',    label: 'Background' },
  { key: 'bgNav',     label: 'Panels' },
  { key: 'textMain',  label: 'Main Text' },
  { key: 'textMuted', label: 'Muted Text' },
  { key: 'accent',    label: 'Accent' },
  { key: 'border',    label: 'Borders' },
]

const PRESET_IDS = new Set(PRESET_THEMES.map(t => t.id))
const DEFAULT_THEME = PRESET_THEMES[0].id
const THEME_CSS_VARS = ['--bg-main', '--bg-nav', '--text-main', '--text-muted', '--accent', '--border', '--bg-hover', '--accent-fade']

const loadThemeChoice = () => {
  const stored = localStorage.getItem('nf-theme')
  return PRESET_IDS.has(stored) || stored === 'custom' ? stored : DEFAULT_THEME
}

const loadCustomColors = () => {
  try { return JSON.parse(localStorage.getItem('nf-custom-colors') || '{}') }
  catch { return {} }
}

const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') return null
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const v = parseInt(clean, 16)
  if (isNaN(v)) return null
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }
}

const rgbaFromHex = (hex, alpha) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(255,255,255,${alpha})`
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

const DEFAULT_CUSTOM_COLORS = PRESET_THEMES[0].swatches

// ─── Theme editor ─────────────────────────────────────────────────────────────

function ThemeEditor({ theme, setTheme, fontChoice, setFontChoice, customColors, setCustomColors, onClose }) {
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [copied, setCopied] = useState(false)
  const [radiusChoice, setRadiusChoice] = useState(() => localStorage.getItem('nf-radius') || 'default')

  useEffect(() => {
    localStorage.setItem('nf-radius', radiusChoice)
    const root = document.documentElement
    if (radiusChoice === 'sharp') { root.setAttribute('data-radius', 'sharp') }
    else if (radiusChoice === 'rounded') { root.setAttribute('data-radius', 'rounded') }
    else { root.removeAttribute('data-radius') }
  }, [radiusChoice])

  const applyPalette = (swatches) => {
    setCustomColors(swatches)
    setTheme('custom')
  }

  const handleExport = () => {
    const json = JSON.stringify(customColors, null, 2)
    navigator.clipboard?.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText)
      setCustomColors({ ...DEFAULT_CUSTOM_COLORS, ...parsed })
      setTheme('custom')
      setImportError('')
      setImportText('')
    } catch {
      setImportError('Invalid JSON — check format.')
    }
  }

  const effectiveColors = theme === 'custom'
    ? { ...DEFAULT_CUSTOM_COLORS, ...customColors }
    : PRESET_THEMES.find(t => t.id === theme)?.swatches || DEFAULT_CUSTOM_COLORS

  return (
    <div className="theme-editor-overlay">
      {/* Header */}
      <div className="theme-editor-header">
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--accent)', fontWeight: 900, fontSize: 15 }}>◈</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>Appearance</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            style={{
              height: 28, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 4,
              background: 'var(--accent)', color: 'var(--bg-main)',
              fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            Done
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Three columns */}
      <div className="theme-editor-body">

        {/* Col 1 — Presets */}
        <div className="theme-editor-col">
          <p className="eyebrow mb-3">Built-in</p>
          <div className="space-y-1.5 mb-6">
            {PRESET_THEMES.map(p => (
              <button key={p.id} onClick={() => setTheme(p.id)}
                className="w-full text-left px-3 py-2.5 rounded transition-colors"
                style={{
                  border: `1px solid ${theme === p.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: theme === p.id ? 'var(--accent-fade)' : 'transparent',
                }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontSize: 12, fontWeight: 700, color: theme === p.id ? 'var(--accent)' : 'var(--text-main)' }}>{p.label}</span>
                  {theme === p.id && <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800 }}>Active</span>}
                </div>
                <div className="flex gap-1">
                  {[p.swatches.bgMain, p.swatches.bgNav, p.swatches.accent, p.swatches.textMain].map(c => (
                    <span key={c} className="w-5 h-3 rounded-sm" style={{ background: c, border: '1px solid rgba(0,0,0,.2)' }} />
                  ))}
                </div>
              </button>
            ))}
          </div>

          <p className="eyebrow mb-3">Community Palettes</p>
          <div className="space-y-1.5 mb-6">
            {CURATED_PALETTES.map(p => (
              <button key={p.id} onClick={() => applyPalette(p.swatches)}
                className="w-full text-left px-3 py-2 rounded transition-colors"
                style={{ border: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>{p.label}</div>
                <div className="flex gap-1">
                  {[p.swatches.bgMain, p.swatches.bgNav, p.swatches.accent, p.swatches.textMain].map(c => (
                    <span key={c} className="w-5 h-3 rounded-sm" style={{ background: c, border: '1px solid rgba(0,0,0,.2)' }} />
                  ))}
                </div>
              </button>
            ))}
          </div>

          <p className="eyebrow mb-2">Export / Import</p>
          <button onClick={handleExport}
            className="w-full text-left px-3 py-2 rounded mb-2 transition-colors"
            style={{ border: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: copied ? 'var(--accent)' : 'var(--text-muted)' }}>
            {copied ? '✓ Copied' : '↑ Copy as JSON'}
          </button>
          <textarea value={importText} onChange={e => setImportText(e.target.value)}
            placeholder="Paste JSON to import…" rows={3}
            style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-main)', resize: 'none' }}
          />
          {importError && <p style={{ fontSize: 10, color: '#f87171', marginTop: 4 }}>{importError}</p>}
          <button onClick={handleImport} disabled={!importText.trim()}
            style={{ width: '100%', marginTop: 6, padding: '6px 0', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'none', cursor: 'pointer' }}>
            ↓ Import
          </button>
        </div>

        {/* Col 2 — Custom colors */}
        <div className="theme-editor-col">
          <p className="eyebrow mb-5">Custom Colors</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px', maxWidth: 560 }}>
            {CUSTOM_COLOR_FIELDS.map(({ key, label }) => {
              const val = effectiveColors[key] || '#888888'
              return (
                <div key={key}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="color" value={val}
                      onChange={e => { setCustomColors(p => ({ ...p, [key]: e.target.value })); setTheme('custom') }}
                      style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
                    />
                    <input value={val}
                      onChange={e => { setCustomColors(p => ({ ...p, [key]: e.target.value })); setTheme('custom') }}
                      style={{ flex: 1, background: 'var(--bg-nav)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 10px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-main)' }}
                    />
                    <div style={{ width: 32, height: 40, borderRadius: 4, background: val, border: '1px solid var(--border)', flexShrink: 0 }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Accent glow slider */}
          <div style={{ marginTop: 32, maxWidth: 560 }}>
            <p className="eyebrow mb-4">Atmosphere</p>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Accent Glow</span>
              </div>
              <input type="range" min={0.08} max={0.4} step={0.01}
                defaultValue={0.18}
                onChange={e => {
                  const alpha = Number(e.target.value)
                  const hex = effectiveColors.accent || '#888'
                  document.documentElement.style.setProperty('--accent-fade', rgbaFromHex(hex, alpha))
                }}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
        </div>

        {/* Col 3 — Type, radius, preview */}
        <div className="theme-editor-col">
          <p className="eyebrow mb-3">Font Family</p>
          <div className="space-y-2 mb-6">
            {FONT_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setFontChoice(opt.id)}
                className="w-full text-left px-3 py-2.5 rounded transition-colors"
                style={{
                  fontFamily: opt.value,
                  border: `1px solid ${fontChoice === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: fontChoice === opt.id ? 'var(--accent-fade)' : 'transparent',
                  color: fontChoice === opt.id ? 'var(--accent)' : 'var(--text-muted)',
                }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</div>
                <div style={{ fontSize: 10, marginTop: 2, opacity: 0.6 }}>The quick brown fox</div>
              </button>
            ))}
          </div>

          <p className="eyebrow mb-3">Corner Style</p>
          <div className="flex gap-2 mb-6">
            {RADIUS_OPTIONS.map(opt => (
              <button key={opt.id} onClick={() => setRadiusChoice(opt.id)}
                style={{
                  flex: 1, padding: '8px 0',
                  borderRadius: opt.id === 'sharp' ? 2 : opt.id === 'default' ? 5 : 999,
                  border: `1px solid ${radiusChoice === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: radiusChoice === opt.id ? 'var(--accent-fade)' : 'transparent',
                  color: radiusChoice === opt.id ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '.06em', textTransform: 'uppercase',
                }}>
                {opt.label}
              </button>
            ))}
          </div>

          <p className="eyebrow mb-3">Preview</p>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: effectiveColors.bgNav || 'var(--bg-nav)', borderBottom: `1px solid ${effectiveColors.border || 'var(--border)'}` }}>
              <span style={{ color: effectiveColors.accent, fontWeight: 900, fontSize: 13 }}>StoryAtlas</span>
            </div>
            <div style={{ padding: 12, background: effectiveColors.bgMain || 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ padding: '6px 10px', borderRadius: 5, background: effectiveColors.bgNav, color: effectiveColors.textMain, border: `1px solid ${effectiveColors.border}`, fontSize: 11 }}>
                Panel surface
              </div>
              <div style={{ padding: '6px 10px', borderRadius: 5, background: effectiveColors.accent, color: effectiveColors.bgMain, fontSize: 11, fontWeight: 700 }}>
                Accent button
              </div>
              <span style={{ fontSize: 11, color: effectiveColors.textMuted }}>Muted text sample</span>
              <span style={{ fontSize: 11, color: effectiveColors.textMain }}>Primary text sample</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Navigation config ────────────────────────────────────────────────────────

const ALL_SECTIONS = [
  { id: 'dashboard',    label: 'Overview',     icon: 'overview' },
  { id: 'outline',      label: 'Outline',      icon: 'outline' },
  { id: 'characters',   label: 'Characters',   icon: 'characters' },
  { id: 'familytree',   label: 'Family Tree',  icon: 'familytree' },
  { id: 'factions',     label: 'Factions',     icon: 'factions' },
  { id: 'locations',    label: 'Locations',    icon: 'locations' },
  { id: 'lore',         label: 'Lore',         icon: 'lore' },
  { id: 'ideas',        label: 'Notes',        icon: 'ideas' },
  { id: 'schedule',     label: 'Schedule',     icon: 'schedule' },
  { id: 'timeline',     label: 'Timeline',     icon: 'timeline' },
  { id: 'worldhistory', label: 'History',      icon: 'worldhistory' },
  { id: 'map',          label: 'Map',          icon: 'map' },
]

const STUDIO_ROOMS = [
  { id: 'overview',    label: 'Overview',    icon: 'overview',    sections: ['dashboard'] },
  { id: 'planning',    label: 'Planning',    icon: 'planning',    sections: ['outline', 'ideas', 'schedule'] },
  { id: 'characters',  label: 'Characters',  icon: 'characters',  sections: ['characters', 'familytree', 'factions'] },
  { id: 'atlas',       label: 'Atlas',       icon: 'atlas',       sections: ['locations', 'map'] },
  { id: 'lore',        label: 'Lore',        icon: 'lore',        sections: ['lore', 'timeline', 'worldhistory'] },
]

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function Layout({ store, section, setSection }) {
  const projectTypeCfg = getProjectType(store.activeNovel?.type)
  const planningSections = ALL_SECTIONS.filter(s => s.id === 'dashboard' || projectTypeCfg.sections.includes(s.id))

  const [viewMode, setViewMode] = useState('writing')
  const [lhnOpen, setLhnOpen] = useState(true)
  const [aiOpen, setAiOpen] = useState(false)
  const [theme, setTheme] = useState(loadThemeChoice)
  const [showThemeEditor, setShowThemeEditor] = useState(false)
  const [fontChoice, setFontChoice] = useState(() => localStorage.getItem('nf-font') || 'system')
  const [customColors, setCustomColors] = useState(loadCustomColors)

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'custom') {
      const colors = { ...DEFAULT_CUSTOM_COLORS, ...customColors }
      root.setAttribute('data-theme', 'custom')
      root.style.setProperty('--bg-main', colors.bgMain)
      root.style.setProperty('--bg-nav', colors.bgNav)
      root.style.setProperty('--text-main', colors.textMain)
      root.style.setProperty('--text-muted', colors.textMuted)
      root.style.setProperty('--accent', colors.accent)
      root.style.setProperty('--border', colors.border)
      root.style.setProperty('--bg-hover', rgbaFromHex(colors.textMain, 0.06))
      root.style.setProperty('--accent-fade', rgbaFromHex(colors.accent, 0.18))
    } else {
      THEME_CSS_VARS.forEach(v => root.style.removeProperty(v))
      root.setAttribute('data-theme', theme)
    }
    localStorage.setItem('nf-theme', theme)
  }, [theme, customColors])

  // Save custom colors
  useEffect(() => {
    localStorage.setItem('nf-custom-colors', JSON.stringify(customColors))
  }, [customColors])

  // Apply font
  useEffect(() => {
    const font = FONT_OPTIONS.find(o => o.id === fontChoice) || FONT_OPTIONS[0]
    localStorage.setItem('nf-font', fontChoice)
    document.documentElement.style.setProperty('--font', font.value)
  }, [fontChoice])

  useEffect(() => {
    const handleTeleport = (e) => {
      if (e.detail?.section) {
        setSection(e.detail.section)
        if (ALL_SECTIONS.find(s => s.id === e.detail.section)) setViewMode('planning')
      }
    }
    window.addEventListener('switch-section', handleTeleport)
    return () => window.removeEventListener('switch-section', handleTeleport)
  }, [setSection])

  const initialContext = useMemo(() => {
    if (viewMode === 'writing') return { characterIds: [], locationIds: [], loreEntryIds: [], chapterIds: store.chapters.map(c => c.id), customInstruction: '' }
    if (section === 'characters' && store.selectedCharacterId) return { characterIds: [store.selectedCharacterId], locationIds: [], loreEntryIds: [], chapterIds: [], customInstruction: '' }
    if (section === 'locations' && store.selectedLocationId) return { characterIds: [], locationIds: [store.selectedLocationId], loreEntryIds: [], chapterIds: [], customInstruction: '' }
    return { characterIds: [], locationIds: [], loreEntryIds: [], chapterIds: [], customInstruction: '' }
  }, [viewMode, section, store.selectedCharacterId, store.selectedLocationId, store.chapters])

  const databaseContent = {
    dashboard:    <ProjectDashboard store={store} />,
    outline:      <StoryOutline store={store} />,
    characters:   <Characters store={store} />,
    familytree:   <FamilyTree store={store} />,
    factions:     <Factions store={store} />,
    locations:    <Locations store={store} />,
    lore:         <Lore store={store} />,
    ideas:        <IdeasBoard store={store} />,
    schedule:     <ScheduleCalendar store={store} />,
    timeline:     <Timeline store={store} />,
    worldhistory: <WorldHistory store={store} />,
    map:          <MapBuilder store={store} />,
  }

  const activeSection = planningSections.find(s => s.id === section) || planningSections[0]
  const availableSectionIds = new Set(planningSections.map(s => s.id))
  const visibleRooms = STUDIO_ROOMS
    .map(room => ({ ...room, sections: room.sections.filter(id => availableSectionIds.has(id)) }))
    .filter(room => room.sections.length > 0)

  const activeRoom = viewMode === 'writing'
    ? { id: 'manuscript', label: 'Manuscript', sections: [] }
    : visibleRooms.find(room => room.sections.includes(section)) || visibleRooms[0]

  const activeRoomSections = activeRoom?.id === 'manuscript'
    ? []
    : planningSections.filter(s => activeRoom?.sections.includes(s.id))

  const openRoom = (room) => {
    setViewMode('planning')
    if (!room.sections.includes(section)) setSection(room.sections[0])
  }

  const roomNav = visibleRooms.map(room => ({
    ...room,
    icon: <Icon name={room.icon} />,
    description: room.sections.map(id => ALL_SECTIONS.find(s => s.id === id)?.label).filter(Boolean).join(' · '),
  }))

  return (
    <>
      <StudioFrame
        projectTitle={store.activeNovel?.title || 'Draft'}
        projectType={projectTypeCfg.label}
        rooms={roomNav}
        activeRoomId={activeRoom?.id}
        onOpenRoom={openRoom}
        account={<UserMenu />}
        primaryAction={(
          <StudioButton
            tone={viewMode === 'writing' ? 'primary' : 'secondary'}
            size="md"
            className="studio-write-button"
            onClick={() => setViewMode('writing')}
          >
            Write
          </StudioButton>
        )}
        topBar={null}
        utilityContent={(
          <div className="studio-utility-btns">
            <button
              className={`studio-utility-btn${showThemeEditor ? ' is-active' : ''}`}
              onClick={() => setShowThemeEditor(v => !v)}
              title="Appearance"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
              Themes
            </button>
            <button
              className="studio-utility-btn"
              onClick={() => store.setActiveNovelId(null)}
              title="Back to projects"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Exit
            </button>
          </div>
        )}
        contextRail={null}
      >
        <StudioWorkspace
          eyebrow={viewMode === 'writing' ? 'Writing' : 'Reference'}
          title={activeRoom?.label || activeSection?.label}
          meta={viewMode === 'writing' ? projectTypeCfg.writingTab : activeSection?.label}
          roomId={activeRoom?.id}
          actions={viewMode === 'planning' ? (
            <StudioButton tone="secondary" size="sm" onClick={() => setLhnOpen(v => !v)}>
              {lhnOpen ? 'Hide tools' : 'Show tools'}
            </StudioButton>
          ) : null}
          tabs={viewMode === 'planning' && lhnOpen && activeRoomSections.length > 1 ? (
            <>
              {activeRoomSections.map(s => (
                <StudioTab key={s.id} onClick={() => setSection(s.id)} active={section === s.id}>
                  <span><Icon name={s.icon} size={14} /></span>
                  <span>{s.label}</span>
                </StudioTab>
              ))}
            </>
          ) : null}
        >
          <div className="h-full relative flex flex-col">
            {viewMode === 'planning' ? (
              <>
                <main className="flex-1 overflow-hidden relative min-h-0">
                  <SectionErrorBoundary key={section}>
                    {databaseContent[section] || databaseContent['characters']}
                  </SectionErrorBoundary>
                </main>
                <AIAssistant
                  store={store}
                  section={section}
                  onOpenChat={() => setAiOpen(v => !v)}
                  aiOpen={aiOpen}
                />
              </>
            ) : (
              <>
                <main className="flex-1 overflow-hidden min-h-0">
                  <SectionErrorBoundary key="manuscript">
                    <Manuscript store={store} />
                  </SectionErrorBoundary>
                </main>
                <AIAssistant
                  store={store}
                  section="manuscript"
                  onOpenChat={() => setAiOpen(v => !v)}
                  aiOpen={aiOpen}
                />
              </>
            )}
          </div>
        </StudioWorkspace>
      </StudioFrame>

      {showThemeEditor && (
        <ThemeEditor
          theme={theme}
          setTheme={setTheme}
          fontChoice={fontChoice}
          setFontChoice={setFontChoice}
          customColors={customColors}
          setCustomColors={setCustomColors}
          onClose={() => setShowThemeEditor(false)}
        />
      )}

      <AIPanel store={store} open={aiOpen} onClose={() => setAiOpen(false)} initialContext={initialContext} />
    </>
  )
}
