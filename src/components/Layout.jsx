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
import { PROJECT_TYPES, getProjectType, getEnabledSections, ALL_SECTION_IDS } from '../constants/projectTypes'
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
  { id: 'atelier',     label: 'Atelier',     description: 'Dark forest studio', swatches: { bgMain: '#0e1512', bgNav: '#141c16', textMain: '#dce8d7', textMuted: '#6b856d', accent: '#8fcb9e', border: '#1e2c20' } },
  { id: 'scriptorium', label: 'Scriptorium', description: 'Warm dark desk',     swatches: { bgMain: '#14100c', bgNav: '#241b13', textMain: '#f4ead9', textMuted: '#b8a58f', accent: '#c89445', border: '#3c3023' } },
  { id: 'vellum',      label: 'Vellum',      description: 'Soft paper mode',    swatches: { bgMain: '#f3ead9', bgNav: '#e6d8bf', textMain: '#221b14', textMuted: '#71624e', accent: '#8a3f2d', border: '#c9b89e' } },
]

const QUICK_PALETTES = [
  { id: 'nord',      label: 'Nord',      swatches: { bgMain: '#2e3440', bgNav: '#3b4252', textMain: '#eceff4', textMuted: '#d8dee9', accent: '#88c0d0', border: '#4c566a' } },
  { id: 'rosepine',  label: 'Rosé Pine', swatches: { bgMain: '#191724', bgNav: '#1f1d2e', textMain: '#e0def4', textMuted: '#908caa', accent: '#ebbcba', border: '#403d52' } },
  { id: 'gruvbox',   label: 'Gruvbox',   swatches: { bgMain: '#282828', bgNav: '#1d2021', textMain: '#ebdbb2', textMuted: '#bdae93', accent: '#fabd2f', border: '#504945' } },
]

const loadSavedPresets = () => {
  try { return JSON.parse(localStorage.getItem('nf-saved-presets') || '[]') }
  catch { return [] }
}

const FONT_OPTIONS = [
  { id: 'system',    label: 'System UI',  value: 'system-ui, sans-serif' },
  { id: 'serif',     label: 'Serif',      value: 'Georgia, "Times New Roman", serif' },
  { id: 'mono',      label: 'Mono',       value: '"SFMono-Regular", Consolas, "Liberation Mono", monospace' },
  { id: 'dyslexia',  label: 'Readable',   value: 'Atkinson Hyperlegible, Verdana, Arial, sans-serif' },
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
const THEME_CSS_VARS = ['--bg-main', '--bg-nav', '--text-main', '--text-muted', '--accent', '--border', '--bg-hover', '--accent-fade', '--logo-filter']

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

const logoFilterForBackground = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return 'none'
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
  return luminance > 0.56 ? 'brightness(0)' : 'none'
}

const DEFAULT_CUSTOM_COLORS = PRESET_THEMES[0].swatches

// ─── Theme editor ─────────────────────────────────────────────────────────────

function ThemeEditor({ theme, setTheme, fontChoice, setFontChoice, customColors, setCustomColors, savedPresets, setSavedPresets, onClose }) {
  const [savePresetName, setSavePresetName] = useState('')

  const applyPalette = (swatches) => {
    setCustomColors(swatches)
    setTheme('custom')
  }

  const handleSavePreset = () => {
    const name = savePresetName.trim()
    if (!name) return
    setSavedPresets(prev => [...prev, { id: `saved-${Date.now()}`, label: name, swatches: { ...effectiveColors } }])
    setSavePresetName('')
  }

  const handleDeletePreset = (id) => {
    setSavedPresets(prev => prev.filter(p => p.id !== id))
  }

  const handleMovePreset = (id, dir) => {
    setSavedPresets(prev => {
      const idx = prev.findIndex(p => p.id === id)
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
      return next
    })
  }

  const effectiveColors = theme === 'custom'
    ? { ...DEFAULT_CUSTOM_COLORS, ...customColors }
    : PRESET_THEMES.find(t => t.id === theme)?.swatches || DEFAULT_CUSTOM_COLORS

  const btnStyle = (active) => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
    color: active ? 'var(--text-main)' : 'var(--text-muted)', fontSize: 11, lineHeight: 1,
  })

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

          <p className="eyebrow mb-3">Quick Starts</p>
          <div className="space-y-1 mb-6">
            {QUICK_PALETTES.map(p => (
              <button key={p.id} onClick={() => applyPalette(p.swatches)}
                className="w-full text-left px-3 py-2 rounded transition-colors"
                style={{ border: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>{p.label}</span>
                  <div className="flex gap-1">
                    {[p.swatches.bgMain, p.swatches.bgNav, p.swatches.accent, p.swatches.textMain].map(c => (
                      <span key={c} className="w-4 h-3 rounded-sm" style={{ background: c, border: '1px solid rgba(0,0,0,.2)' }} />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <p className="eyebrow mb-2">My Presets</p>
          {savedPresets.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>No saved presets yet.</p>
          )}
          <div className="space-y-1 mb-3">
            {savedPresets.map((p, i) => (
              <div key={p.id}
                style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => applyPalette(p.swatches)}
                  style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[p.swatches.bgMain, p.swatches.bgNav, p.swatches.accent, p.swatches.textMain].map(c => (
                        <span key={c} style={{ width: 14, height: 14, borderRadius: 2, background: c, border: '1px solid rgba(0,0,0,.2)', display: 'inline-block' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>{p.label}</span>
                  </div>
                </button>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => handleMovePreset(p.id, -1)} disabled={i === 0}
                    style={btnStyle(i > 0)} title="Move up">▲</button>
                  <button onClick={() => handleMovePreset(p.id, 1)} disabled={i === savedPresets.length - 1}
                    style={btnStyle(i < savedPresets.length - 1)} title="Move down">▼</button>
                  <button onClick={() => handleDeletePreset(p.id)}
                    style={{ ...btnStyle(true), color: 'var(--text-muted)', marginLeft: 2 }} title="Delete">✕</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              value={savePresetName}
              onChange={e => setSavePresetName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
              placeholder="Preset name…"
              style={{ flex: 1, background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 8px', fontSize: 11, color: 'var(--text-main)' }}
            />
            <button onClick={handleSavePreset} disabled={!savePresetName.trim()}
              style={{
                padding: '5px 10px', borderRadius: 4, border: '1px solid var(--border)',
                background: savePresetName.trim() ? 'var(--accent)' : 'transparent',
                color: savePresetName.trim() ? 'var(--bg-main)' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 700, cursor: savePresetName.trim() ? 'pointer' : 'default',
              }}>
              Save
            </button>
          </div>
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

          <p className="eyebrow mb-3">Preview</p>
          <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: effectiveColors.bgNav || 'var(--bg-nav)', borderBottom: `1px solid ${effectiveColors.border || 'var(--border)'}` }}>
              <span style={{ color: effectiveColors.accent, fontWeight: 900, fontSize: 13 }}>Your Own World</span>
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
  { id: 'familytree',   label: 'Relationships', icon: 'familytree' },
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

const SETTINGS_GROUPS = [
  { label: 'Planning',   sections: ['outline', 'ideas', 'schedule'] },
  { label: 'Characters', sections: ['characters', 'familytree', 'factions'] },
  { label: 'Atlas',      sections: ['locations', 'map'] },
  { label: 'Lore',       sections: ['lore', 'timeline', 'worldhistory'] },
]

// ─── Project Settings ─────────────────────────────────────────────────────────

function ProjectSettings({ store, onClose }) {
  const novel = store.activeNovel
  const initial = (novel?.enabledSections ?? ALL_SECTION_IDS).filter(id => ALL_SECTION_IDS.includes(id))
  const [enabled, setEnabled] = useState(() => new Set(initial))
  const [details, setDetails] = useState(() => ({
    title: novel?.title || '',
    description: novel?.description || '',
    type: novel?.type || 'novel',
    currentYear: store.currentYear ?? 0,
    seriesId: novel?.seriesId || '',
  }))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(new Set((novel?.enabledSections ?? ALL_SECTION_IDS).filter(id => ALL_SECTION_IDS.includes(id))))
    setDetails({
      title: novel?.title || '',
      description: novel?.description || '',
      type: novel?.type || 'novel',
      currentYear: store.currentYear ?? 0,
      seriesId: novel?.seriesId || '',
    })
  }, [novel?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const patchProject = (patch) => {
    if (!store.activeNovelId) return
    store.updateNovel(store.activeNovelId, patch)
  }

  const updateDetail = (field, value) => {
    setDetails(prev => ({ ...prev, [field]: value }))
    if (field === 'currentYear') {
      store.updateCurrentYear(value)
      return
    }
    patchProject({ [field]: field === 'seriesId' ? value || null : value })
  }

  const toggle = (id) => {
    setEnabled(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      store.updateNovel(store.activeNovelId, { enabledSections: [...next] })
      return next
    })
  }

  const resetToDefaults = () => {
    const defaults = new Set(getProjectType(novel?.type).defaultSections)
    setEnabled(defaults)
    store.updateNovel(store.activeNovelId, { enabledSections: [...defaults] })
  }

  const enableAll = () => {
    const all = new Set(ALL_SECTION_IDS)
    setEnabled(all)
    store.updateNovel(store.activeNovelId, { enabledSections: [...all] })
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div style={{
        background: 'var(--bg-nav)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        width: 'min(940px, 100%)', height: 'min(760px, calc(100vh - 48px))',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Project Settings</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{novel?.title || 'Untitled'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={onClose}
              style={{
                height: 28, padding: '0 12px', border: '1px solid var(--border)', borderRadius: 4,
                background: 'var(--accent)', color: 'var(--bg-main)',
                fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >Done</button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: '0 4px' }}
            >✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            <section style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-main)', padding: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>Project Details</p>

              <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Title</span>
                <input
                  value={details.title}
                  onChange={e => updateDetail('title', e.target.value)}
                  className="field"
                  style={{ padding: '8px 10px', fontSize: 13 }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Description</span>
                <textarea
                  value={details.description}
                  onChange={e => updateDetail('description', e.target.value)}
                  rows={5}
                  className="field"
                  style={{ padding: '8px 10px', fontSize: 13, resize: 'vertical', minHeight: 96 }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Project type</span>
                <select
                  value={details.type}
                  onChange={e => updateDetail('type', e.target.value)}
                  className="field"
                  style={{ padding: '8px 10px', fontSize: 13 }}
                >
                  {Object.entries(PROJECT_TYPES).map(([id, type]) => (
                    <option key={id} value={id}>{type.label}</option>
                  ))}
                </select>
              </label>

              {store.series.length > 0 && (
                <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Series</span>
                  <select
                    value={details.seriesId}
                    onChange={e => updateDetail('seriesId', e.target.value)}
                    className="field"
                    style={{ padding: '8px 10px', fontSize: 13 }}
                  >
                    <option value="">No series</option>
                    {store.series.map(series => (
                      <option key={series.id} value={series.id}>{series.name}</option>
                    ))}
                  </select>
                </label>
              )}

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Current year</span>
                <input
                  type="number"
                  value={details.currentYear}
                  onChange={e => updateDetail('currentYear', e.target.value)}
                  className="field"
                  style={{ padding: '8px 10px', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}
                />
              </label>
            </section>

            <section style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-main)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Sections</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 430 }}>
                    Choose which rooms and tools appear in this project. Hidden sections can be re-enabled any time.
                  </p>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: 2 }}>
                  {enabled.size} / {ALL_SECTION_IDS.length} active
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
                {SETTINGS_GROUPS.map(group => (
                  <div key={group.label}>
                    <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>{group.label}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {group.sections.map(id => {
                        const section = ALL_SECTIONS.find(s => s.id === id)
                        if (!section) return null
                        const on = enabled.has(id)
                        return (
                          <button
                            key={id}
                            onClick={() => toggle(id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              minHeight: 40, padding: '8px 10px', borderRadius: 6,
                              border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                              background: on ? 'var(--accent-fade)' : 'transparent',
                              cursor: 'pointer', textAlign: 'left',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                              <span style={{ color: on ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>
                                <Icon name={section.icon} size={14} />
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: on ? 'var(--text-main)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {section.label}
                              </span>
                            </div>
                            <div style={{
                              width: 32, height: 18, borderRadius: 9, flexShrink: 0,
                              background: on ? 'var(--accent)' : 'var(--border)',
                              position: 'relative', marginLeft: 10,
                            }}>
                              <div style={{
                                position: 'absolute', top: 3, left: on ? 17 : 3,
                                width: 12, height: 12, borderRadius: '50%',
                                background: on ? 'var(--bg-main)' : 'var(--bg-nav)',
                                transition: 'left .12s ease',
                              }} />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={resetToDefaults}
              style={{
                height: 28, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 4,
                background: 'transparent', color: 'var(--text-muted)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >Type defaults</button>
            <button
              onClick={enableAll}
              style={{
                height: 28, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 4,
                background: 'transparent', color: 'var(--text-muted)',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}
            >Enable all</button>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {enabled.size} / {ALL_SECTION_IDS.length} active
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function Layout({ store, section, setSection, onOpenAccount }) {
  const projectTypeCfg = getProjectType(store.activeNovel?.type)
  const enabledSectionIds = new Set(getEnabledSections(store.activeNovel))
  const planningSections = ALL_SECTIONS.filter(s => s.id === 'dashboard' || enabledSectionIds.has(s.id))

  const [viewMode, setViewMode] = useState('planning')
  const [aiOpen, setAiOpen] = useState(false)
  const [theme, setTheme] = useState(loadThemeChoice)
  const [showThemeEditor, setShowThemeEditor] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [fontChoice, setFontChoice] = useState(() => localStorage.getItem('nf-font') || 'system')
  const [radiusChoice, setRadiusChoice] = useState(() => localStorage.getItem('nf-radius') || 'default')
  const [customColors, setCustomColors] = useState(loadCustomColors)
  const [savedPresets, setSavedPresets] = useState(loadSavedPresets)

  useEffect(() => {
    localStorage.setItem('nf-saved-presets', JSON.stringify(savedPresets))
  }, [savedPresets])

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
      root.style.setProperty('--logo-filter', logoFilterForBackground(colors.bgNav))
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

  // Apply corner radius
  useEffect(() => {
    localStorage.setItem('nf-radius', radiusChoice)
    const root = document.documentElement
    if (radiusChoice === 'sharp') root.setAttribute('data-radius', 'sharp')
    else if (radiusChoice === 'rounded') root.setAttribute('data-radius', 'rounded')
    else root.removeAttribute('data-radius')
  }, [radiusChoice])

  // Redirect away from a section that just got disabled
  useEffect(() => {
    if (viewMode === 'planning' && section !== 'dashboard' && !enabledSectionIds.has(section)) {
      const first = planningSections.find(s => s.id !== 'dashboard')
      if (first) setSection(first.id)
    }
  }, [store.activeNovel?.enabledSections])  // eslint-disable-line react-hooks/exhaustive-deps

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
        account={<UserMenu onOpenAccount={onOpenAccount} />}
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
              className={`studio-utility-btn${showSettings ? ' is-active' : ''}`}
              onClick={() => setShowSettings(v => !v)}
              title="Project settings"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Settings
            </button>
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
          meta={viewMode === 'writing' ? projectTypeCfg.writingTab : (activeSection?.label !== activeRoom?.label ? activeSection?.label : undefined)}
          roomId={section === 'map' ? 'atlas-map' : activeRoom?.id}
          actions={null}
          tabs={viewMode === 'planning' && activeRoomSections.length > 1 ? (
            <>
              {activeRoomSections.map(s => (
                <StudioTab key={s.id} onClick={() => setSection(s.id)} active={section === s.id}>
                  <span><Icon name={s.icon} size={14} /></span>
                  <span>{s.label}</span>
                </StudioTab>
              ))}
            </>
          ) : null}
          footer={
            viewMode === 'planning'
              ? <AIAssistant store={store} section={section} onOpenChat={() => setAiOpen(v => !v)} aiOpen={aiOpen} />
              : <AIAssistant store={store} section="manuscript" onOpenChat={() => setAiOpen(v => !v)} aiOpen={aiOpen} />
          }
        >
          <div className="h-full">
            {viewMode === 'planning' ? (
              <SectionErrorBoundary key={section}>
                {databaseContent[section] || databaseContent['characters']}
              </SectionErrorBoundary>
            ) : (
              <SectionErrorBoundary key="manuscript">
                <Manuscript store={store} />
              </SectionErrorBoundary>
            )}
          </div>
        </StudioWorkspace>
      </StudioFrame>

      {showSettings && (
        <ProjectSettings
          store={store}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showThemeEditor && (
        <ThemeEditor
          theme={theme}
          setTheme={setTheme}
          fontChoice={fontChoice}
          setFontChoice={setFontChoice}
          radiusChoice={radiusChoice}
          setRadiusChoice={setRadiusChoice}
          customColors={customColors}
          setCustomColors={setCustomColors}
          savedPresets={savedPresets}
          setSavedPresets={setSavedPresets}
          onClose={() => setShowThemeEditor(false)}
        />
      )}

      <AIPanel store={store} open={aiOpen} onClose={() => setAiOpen(false)} initialContext={initialContext} />
    </>
  )
}
