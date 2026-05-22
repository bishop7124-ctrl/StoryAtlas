import { Component, useEffect, useRef, useState, useMemo } from 'react'
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

// ─── Cover photo resize (mirrors NovelManager.jsx) ───────────────────────────

const resizeCoverPhoto = (file) => new Promise((resolve, reject) => {
  const image = new Image()
  const objectUrl = URL.createObjectURL(file)
  image.onload = () => {
    URL.revokeObjectURL(objectUrl)
    const maxWidth = 900, maxHeight = 1200
    const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height)
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width; canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#111814'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)
    let quality = 0.82
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrl.length > 900000 && quality > 0.48) { quality -= 0.08; dataUrl = canvas.toDataURL('image/jpeg', quality) }
    resolve(dataUrl)
  }
  image.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not read that image.')) }
  image.src = objectUrl
})

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
  const dialogRef = useRef(null)
  useEffect(() => { dialogRef.current?.focus() }, [])
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  const [details, setDetails] = useState(() => ({
    title: novel?.title || '',
    description: novel?.description || '',
    type: novel?.type || 'novel',
    currentYear: store.currentYear ?? 0,
    seriesId: novel?.seriesId || '',
    progress: novel?.progress ?? '',
  }))
  const [coverError, setCoverError] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(new Set((novel?.enabledSections ?? ALL_SECTION_IDS).filter(id => ALL_SECTION_IDS.includes(id))))
    setDetails({
      title: novel?.title || '',
      description: novel?.description || '',
      type: novel?.type || 'novel',
      currentYear: store.currentYear ?? 0,
      seriesId: novel?.seriesId || '',
      progress: novel?.progress ?? '',
    })
  }, [novel?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const patchProject = (patch) => {
    if (!store.activeNovelId) return
    store.updateNovel(store.activeNovelId, patch)
  }

  const updateDetail = (field, value) => {
    setDetails(prev => ({ ...prev, [field]: value }))
    if (field === 'currentYear') { store.updateCurrentYear(value); return }
    if (field === 'progress') {
      const num = value === '' ? null : Math.max(0, Math.min(100, Number(value)))
      patchProject({ progress: num })
      return
    }
    patchProject({ [field]: field === 'seriesId' ? value || null : value })
  }

  const handleCoverSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    try {
      setCoverError('')
      const photo = await resizeCoverPhoto(file)
      store.updateNovel(store.activeNovelId, { coverPhoto: photo })
    } catch {
      setCoverError('Could not use that image.')
    }
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
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-settings-title"
        tabIndex={-1}
        style={{
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
            <p id="project-settings-title" style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>Project Settings</p>
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
              aria-label="Close"
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

              <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Current year</span>
                <input
                  type="number"
                  value={details.currentYear}
                  onChange={e => updateDetail('currentYear', e.target.value)}
                  className="field"
                  style={{ padding: '8px 10px', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Progress (0–100%)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={details.progress}
                  onChange={e => updateDetail('progress', e.target.value)}
                  placeholder="—"
                  className="field"
                  style={{ padding: '8px 10px', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}
                />
              </label>

              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Cover Photo</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {novel?.coverPhoto && (
                    <img src={novel.coverPhoto} alt="" style={{ width: 44, height: 58, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)', flexShrink: 0 }} />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', lineHeight: 1 }}>
                      <input type="file" accept="image/*" onChange={handleCoverSelect} style={{ display: 'none' }} />
                      {novel?.coverPhoto ? 'Change cover' : 'Add cover photo'}
                    </label>
                    {novel?.coverPhoto && (
                      <button
                        type="button"
                        onClick={() => store.updateNovel(store.activeNovelId, { coverPhoto: null })}
                        style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}
                      >
                        Remove
                      </button>
                    )}
                    {coverError && <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>{coverError}</p>}
                  </div>
                </div>
              </div>
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
                            role="switch"
                            aria-checked={on}
                            aria-label={section.label}
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

export default function Layout({ store, section, setSection, onOpenAccount, onOpenHelp, onOpenLegal, onOpenAbout, membership, viewMode, setViewMode }) {
  const projectTypeCfg = getProjectType(store.activeNovel?.type)
  const enabledSectionIds = new Set(getEnabledSections(store.activeNovel))
  const planningSections = ALL_SECTIONS.filter(s => s.id === 'dashboard' || enabledSectionIds.has(s.id))

  const [aiOpen, setAiOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

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

  // iOS Safari requires a passive touchstart listener on scroll containers
  // to properly recognise them as touch-scroll targets.
  useEffect(() => {
    const noop = () => {}
    const els = document.querySelectorAll(
      '.studio-surface, .studio-split, .studio-split-dossier, .studio-split-notebook, .overflow-auto, .overflow-y-auto, .overflow-y-scroll'
    )
    els.forEach(el => el.addEventListener('touchstart', noop, { passive: true }))
    return () => els.forEach(el => el.removeEventListener('touchstart', noop))
  }, [section, viewMode])

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
        account={<UserMenu onOpenAccount={onOpenAccount} onOpenHelp={onOpenHelp} onOpenLegal={onOpenLegal} onOpenAbout={onOpenAbout} />}
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
              aria-label="Project settings"
              aria-pressed={showSettings}
            >
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span aria-hidden="true">Settings</span>
            </button>
            <button
              className="studio-utility-btn"
              onClick={() => store.setActiveNovelId(null)}
              aria-label="Back to projects"
            >
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span aria-hidden="true">Exit</span>
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
          <div className="h-full overflow-hidden">
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

      <AIPanel store={store} open={aiOpen} onClose={() => setAiOpen(false)} initialContext={initialContext} membership={membership} />
    </>
  )
}
