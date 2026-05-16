import { useState } from 'react'
import UserMenu from './auth/UserMenu'
import { PROJECT_TYPES, DEFAULT_TYPE, getProjectType } from '../constants/projectTypes'

const TYPE_OPTIONS = Object.entries(PROJECT_TYPES).map(([id, cfg]) => ({ id, ...cfg }))

const COVER_GRADIENTS = [
  'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(160deg, #1c0c2a 0%, #2d1b4e 60%, #1a0d33 100%)',
  'linear-gradient(160deg, #0d1f2d 0%, #1a3a4a 55%, #0a2030 100%)',
  'linear-gradient(160deg, #1a0c0c 0%, #2d1212 50%, #3a1a1a 100%)',
  'linear-gradient(160deg, #0d2013 0%, #1a3a20 50%, #0a1a0d 100%)',
  'linear-gradient(160deg, #0c1a24 0%, #1a2e3a 50%, #0a1520 100%)',
  'linear-gradient(160deg, #1a1208 0%, #2e2010 50%, #3a2a18 100%)',
  'linear-gradient(160deg, #0c0c1a 0%, #1a1a30 50%, #0a0a18 100%)',
]

const getCoverGradient = (title) => {
  const n = (title || '?').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return COVER_GRADIENTS[n % COVER_GRADIENTS.length]
}

function NovelCard({ stats, onOpen, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const novel = stats.project
  const cfg = getProjectType(novel.type)

  return (
    <div
      className="novel-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover */}
      <div
        className="novel-card-cover"
        onClick={() => onOpen(novel.id)}
        style={{ background: novel.coverPhoto ? undefined : getCoverGradient(novel.title) }}
      >
        {novel.coverPhoto ? (
          <img src={novel.coverPhoto} alt="" />
        ) : (
          <>
            <span
              style={{
                position: 'absolute', bottom: 10, right: 12,
                fontSize: 72, fontWeight: 900, lineHeight: 1,
                color: 'rgba(255,255,255,0.07)', userSelect: 'none', pointerEvents: 'none',
              }}
            >
              {novel.title[0]?.toUpperCase()}
            </span>
            <span
              style={{
                position: 'absolute', top: 10, left: 10,
                fontSize: 18, lineHeight: 1,
              }}
              title={cfg.label}
            >
              {cfg.icon}
            </span>
          </>
        )}
      </div>

      {/* Title */}
      <div className="novel-card-foot" onClick={() => onOpen(novel.id)}>
        <p>{novel.title}</p>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>
          {cfg.label} · {stats.updatedLabel}
        </p>
      </div>

      {/* Hover popup */}
      {hovered && (
        <div className="novel-card-popup">
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8, minHeight: 32 }}>
            {novel.description || 'No description yet.'}
          </p>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            <span>{stats.characters.length} chars</span>
            <span>{stats.scenes.length} scenes</span>
            <span>{stats.manuscriptWords.toLocaleString()} words</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => onOpen(novel.id)}
              style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Open →
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(novel.id) }}
              style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function NewCard({ onClick }) {
  return (
    <button className="novel-card novel-card-new" onClick={onClick}>
      <span style={{ fontSize: 28, lineHeight: 1 }}>+</span>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>New Project</span>
    </button>
  )
}

export default function NovelManager({ store }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: DEFAULT_TYPE })
  const [seriesFilter, setSeriesFilter] = useState(null)

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    store.addNovel({ ...form, seriesId: seriesFilter || null })
    setForm({ title: '', description: '', type: DEFAULT_TYPE })
    setShowForm(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this project and all its content? This cannot be undone.')) {
      store.deleteNovel(id)
    }
  }

  const visibleStats = seriesFilter
    ? store.allProjectStats.filter(s => s.project.seriesId === seriesFilter)
    : store.allProjectStats

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>

      {/* Top bar */}
      <div className="library-top-bar">
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 18, color: 'var(--accent)' }}>StoryAtlas</span>
        <UserMenu />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '36px 28px' }}>

        {/* Series filter strip */}
        {store.series.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 4 }}>Series</span>
            <button
              onClick={() => setSeriesFilter(null)}
              style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${seriesFilter === null ? 'var(--accent)' : 'var(--border)'}`,
                background: seriesFilter === null ? 'var(--accent-fade)' : 'transparent',
                color: seriesFilter === null ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              All
            </button>
            {store.series.map(s => (
              <button key={s.id}
                onClick={() => setSeriesFilter(seriesFilter === s.id ? null : s.id)}
                style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${seriesFilter === s.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: seriesFilter === s.id ? 'var(--accent-fade)' : 'transparent',
                  color: seriesFilter === s.id ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* Card grid */}
        <div className="novel-grid">
          {visibleStats.map(stats => (
            <NovelCard
              key={stats.project.id}
              stats={stats}
              onOpen={store.setActiveNovelId}
              onDelete={handleDelete}
            />
          ))}
          <NewCard onClick={() => setShowForm(true)} />
        </div>

        {/* Empty state */}
        {store.novels.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 48 }}>
            Create your first project to get started.
          </p>
        )}
      </div>

      {/* New project modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}
        >
          <form
            onSubmit={handleCreate}
            style={{
              width: '100%', maxWidth: 420, padding: 24,
              background: 'var(--bg-nav)', border: '1px solid var(--border)',
              borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,.4)',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-main)' }}>New Project</p>

            <input
              autoFocus
              placeholder="Title *"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              required
              style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 14, color: 'var(--text-main)', outline: 'none' }}
            />

            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--text-main)', resize: 'none', outline: 'none' }}
            />

            {/* Project type */}
            <div>
              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Type</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {TYPE_OPTIONS.map(t => (
                  <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, type: t.id }))}
                    style={{
                      textAlign: 'left', padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${form.type === t.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.type === t.id ? 'var(--accent-fade)' : 'var(--bg-main)',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 14 }}>{t.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>{t.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="submit"
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 7, border: 'none',
                  background: 'var(--accent)', color: 'var(--bg-main)',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer',
                }}>
                Create
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ padding: '10px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
