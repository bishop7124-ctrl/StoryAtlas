import { useMemo, useState } from 'react'
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

const resizeCoverPhoto = (file) => new Promise((resolve, reject) => {
  const image = new Image()
  const objectUrl = URL.createObjectURL(file)

  image.onload = () => {
    URL.revokeObjectURL(objectUrl)
    const maxWidth = 900
    const maxHeight = 1200
    const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height)
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = width
    canvas.height = height
    ctx.fillStyle = '#111814'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)

    let quality = 0.82
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrl.length > 900000 && quality > 0.48) {
      quality -= 0.08
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }
    resolve(dataUrl)
  }

  image.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    reject(new Error('Could not read that image.'))
  }

  image.src = objectUrl
})

function ProjectTypeImage({ type, label, size = 34 }) {
  const id = type || DEFAULT_TYPE
  const common = {
    className: `project-type-image project-type-image-${id}`,
    width: size,
    height: size,
    viewBox: '0 0 40 40',
    role: 'img',
    'aria-label': label,
  }

  const paths = {
    novel: (
      <>
        <path className="project-type-fill" d="M10 8h12a8 8 0 0 1 8 8v17H17a7 7 0 0 0-7-7V8Z" />
        <path className="project-type-accent" d="M17 8v25a7 7 0 0 0-7-7V8h7Z" />
        <path className="project-type-line" d="M15 14h10M15 19h11M15 24h8" />
      </>
    ),
    novella: (
      <>
        <path className="project-type-fill" d="M9 11h12a7 7 0 0 1 7 7v12H16a7 7 0 0 0-7-7V11Z" />
        <path className="project-type-accent" d="M16 11v19a7 7 0 0 0-7-7V11h7Z" />
        <path className="project-type-line" d="M15 16h10M15 21h8" />
      </>
    ),
    short_story: (
      <>
        <path className="project-type-fill" d="M12 7h13l5 5v21H12V7Z" />
        <path className="project-type-accent" d="M25 7v6h5L25 7Z" />
        <path className="project-type-line" d="M17 17h8M17 22h8M17 27h6" />
      </>
    ),
    play: (
      <>
        <path className="project-type-fill" d="M9 11c5-3 10-3 15 0v9c0 6-3 10-7.5 12C12 30 9 26 9 20v-9Z" />
        <path className="project-type-accent" d="M17 11c5-3 10-3 15 0v9c0 6-3 10-7.5 12-2.1-1-3.9-2.6-5.2-4.8 2-1.8 3.2-4.3 3.2-7.2v-8.3A18.2 18.2 0 0 0 17 11Z" />
        <path className="project-type-line" d="M14 18h.1M20 18h.1M13 24c2 2 5 2 7 0" />
      </>
    ),
    screenplay: (
      <>
        <path className="project-type-fill" d="M8 15h24v16H8V15Z" />
        <path className="project-type-accent" d="M10 8h6l3 7h-7l-2-7ZM20 8h6l3 7h-7l-2-7Z" />
        <path className="project-type-line" d="M13 21h14M13 26h9" />
      </>
    ),
    tv_show: (
      <>
        <path className="project-type-fill" d="M9 12h22v16H9V12Z" />
        <path className="project-type-accent" d="M14 28h12v4H14v-4Z" />
        <path className="project-type-line" d="M15 17h10M15 22h7M16 8l4 4 4-4" />
      </>
    ),
    dnd_campaign: (
      <>
        <path className="project-type-fill" d="M20 7l12 7v12l-12 7-12-7V14l12-7Z" />
        <path className="project-type-accent" d="M20 7v26l12-7V14L20 7Z" />
        <path className="project-type-line" d="M15 17l5-3 5 3M15 23l5 3 5-3" />
      </>
    ),
    tabletop_rpg: (
      <>
        <path className="project-type-fill" d="M20 7l12 7v12l-12 7-12-7V14l12-7Z" />
        <path className="project-type-accent" d="M20 7v26l-12-7V14l12-7Z" />
        <path className="project-type-line" d="M20 16v.1M16 21v.1M24 21v.1M20 26v.1" />
      </>
    ),
    comic: (
      <>
        <path className="project-type-fill" d="M9 10h22v15H19l-7 6 2-6H9V10Z" />
        <path className="project-type-accent" d="M13 14h14v4H13v-4Z" />
        <path className="project-type-line" d="M13 22h9" />
      </>
    ),
    video_game: (
      <>
        <path className="project-type-fill" d="M12 16h16l4 9a5 5 0 0 1-8 5l-2-3h-4l-2 3a5 5 0 0 1-8-5l4-9Z" />
        <path className="project-type-accent" d="M23 16h5l4 9a5 5 0 0 1-8 5l-2-3h-2l3-11Z" />
        <path className="project-type-line" d="M14 22h6M17 19v6M25 22h.1M28 25h.1" />
      </>
    ),
  }

  return (
    <svg {...common}>
      {paths[id] || paths.novel}
    </svg>
  )
}

function NovelCard({ stats, onOpen, onDelete, onUpdateCover }) {
  const [hovered, setHovered] = useState(false)
  const [coverError, setCoverError] = useState('')
  const novel = stats.project
  const cfg = getProjectType(novel.type)

  const handleCoverSelect = async (e) => {
    e.stopPropagation()
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return

    try {
      setCoverError('')
      const coverPhoto = await resizeCoverPhoto(file)
      onUpdateCover(novel.id, coverPhoto)
    } catch (error) {
      setCoverError(error.message || 'Could not use that cover image.')
    }
  }

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
            <span className="project-type-badge" title={cfg.label}>
              <ProjectTypeImage type={novel.type} label={cfg.label} />
            </span>
          </>
        )}
        <div className="novel-card-cover-actions" onClick={e => e.stopPropagation()}>
          <label className="novel-cover-button" title="Change cover photo">
            <input type="file" accept="image/*" onChange={handleCoverSelect} />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </label>
          {novel.coverPhoto && (
            <button className="novel-cover-button" type="button" onClick={() => onUpdateCover(novel.id, null)} title="Remove cover photo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
              </svg>
            </button>
          )}
        </div>
        {coverError && <p className="novel-cover-error">{coverError}</p>}
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

export default function NovelManager({ store, user, onOpenChat }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: DEFAULT_TYPE })
  const [seriesFilter, setSeriesFilter] = useState(null)
  const userName = user?.displayName || user?.email?.split('@')[0] || 'User'

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

  const handleUpdateCover = (id, coverPhoto) => {
    store.updateNovel(id, { coverPhoto })
  }

  const visibleStats = seriesFilter
    ? store.allProjectStats.filter(s => s.project.seriesId === seriesFilter)
    : store.allProjectStats

  const projectGroups = useMemo(() => {
    const seriesById = new Map((store.series || []).map(s => [s.id, s]))
    const groups = (store.series || []).map(s => ({
      id: s.id,
      title: s.name,
      stats: visibleStats.filter(item => item.project.seriesId === s.id),
    }))
    const standalone = visibleStats.filter(item => !item.project.seriesId || !seriesById.has(item.project.seriesId))
    return [
      ...groups.filter(group => group.stats.length > 0),
      ...(standalone.length ? [{ id: 'standalone', title: store.series.length ? 'Standalone Projects' : 'Projects', stats: standalone }] : []),
    ]
  }, [store.series, visibleStats])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>

      {/* Top bar */}
      <div className="library-top-bar">
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 18, color: 'var(--accent)' }}>StoryAtlas</span>
        <UserMenu />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 28px 56px' }}>
        <p className="library-welcome">Welcome, {userName}!</p>
        <div className="library-hero">
          <div>
            <h1>What are we writing today?</h1>
          </div>
          <button className="library-chat-button" type="button" onClick={onOpenChat} title="Open AI chat" aria-label="Open AI chat">
            ✦
          </button>
        </div>

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

        {/* Card groups */}
        {projectGroups.map(group => (
          <section className="library-series-section" key={group.id}>
            <div className="library-series-heading">
              <h2>{group.title}</h2>
              <span>{group.stats.length} project{group.stats.length === 1 ? '' : 's'}</span>
            </div>
            <div className="novel-grid">
              {group.stats.map(stats => (
                <NovelCard
                  key={stats.project.id}
                  stats={stats}
                  onOpen={store.setActiveNovelId}
                  onDelete={handleDelete}
                  onUpdateCover={handleUpdateCover}
                />
              ))}
            </div>
          </section>
        ))}

        <section className="library-series-section">
          <div className="novel-grid novel-grid-actions">
            <NewCard onClick={() => setShowForm(true)} />
          </div>
        </section>

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
                      <ProjectTypeImage type={t.id} label={t.label} size={24} />
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
