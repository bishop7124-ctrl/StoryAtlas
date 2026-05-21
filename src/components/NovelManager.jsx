import { useMemo, useRef, useState } from 'react'
import UserMenu from './auth/UserMenu'
import YOWLogo from './brand/YOWLogo'
import { PROJECT_TYPES, DEFAULT_TYPE, getProjectType } from '../constants/projectTypes'
import { createProjectZipBlob, getProjectExportFilename } from '../utils/projectExport'

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

const STATUS_DATA = {
  not_started: { label: 'Not started', color: '#89919a' },
  draft:       { label: 'Draft',        color: '#a78bfa' },
  in_progress: { label: 'In progress',  color: '#5bb7d9' },
  editing:     { label: 'Editing',      color: '#e3a84f' },
  complete:    { label: 'Complete',     color: '#5dc878' },
  paused:      { label: 'Paused',       color: '#d86b70' },
  writing:     { label: 'In progress',  color: '#5bb7d9', aliasFor: 'in_progress' },
  revision:    { label: 'Editing',      color: '#e3a84f', aliasFor: 'editing' },
}
const STATUS_PICKER = ['not_started', 'draft', 'in_progress', 'editing', 'complete', 'paused']
const STATUS_CYCLE = [null, ...STATUS_PICKER]

function StatusBadge({ status, onClick, small }) {
  const data = status ? STATUS_DATA[status] : null
  const style = { '--status-color': data?.color ?? 'var(--text-muted)' }
  return (
    <span
      className={`status-badge${small ? ' status-badge--small' : ''}${onClick ? ' status-badge--click' : ''}`}
      style={style}
      onClick={onClick}
      title={onClick ? 'Click to change status' : undefined}
    >
      <span className="status-dot" />
      {data ? data.label : 'No status'}
    </span>
  )
}

function ActiveProjectHero({ stats, allStats, series, onOpen, onSetStatus, onToggleFocus }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const novel = stats.project
  const totalWords = allStats.reduce((sum, item) => sum + item.manuscriptWords, 0)
  const totalScenes = allStats.reduce((sum, item) => sum + item.scenes.length, 0)
  const totalCharacters = allStats.reduce((sum, item) => sum + item.characters.length, 0)
  const currentStatus = STATUS_DATA[novel.status]?.aliasFor ?? novel.status
  const progress = Number.isFinite(Number(novel.progress)) ? Math.max(0, Math.min(100, Number(novel.progress))) : null

  return (
    <div
      className="active-project-command"
      onMouseLeave={() => setSettingsOpen(false)}
      onClick={() => { if (!settingsOpen) onOpen(novel.id) }}
    >
      <section className="active-project-command-main">
        <div className="active-project-command-copy">
          <div className="active-project-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Active Project
          </div>
          <h2 className="active-project-command-title">{novel.title}</h2>
          {novel.description && <p className="active-project-command-desc">{novel.description}</p>}
          <div className="active-project-command-stats">
            {progress !== null && (
              <div className="active-project-command-stat">
                <strong>{progress}%</strong>
                <span>Progress</span>
              </div>
            )}
            <div className="active-project-command-stat">
              <strong>{stats.manuscriptWords.toLocaleString()}</strong>
              <span>Words</span>
            </div>
            <div className="active-project-command-stat">
              <strong>{stats.scenes.length}</strong>
              <span>Scenes</span>
            </div>
            <StatusBadge status={novel.status} />
          </div>
        </div>
      </section>

      <aside className="active-project-command-cover">
        <div className="active-project-cover-card" style={{ background: novel.coverPhoto ? undefined : getCoverGradient(novel.title) }}>
          <div className="active-project-cover-inner">
            <div className="active-project-hero-bg" style={{ background: getCoverGradient(novel.title) }} />
          {novel.coverPhoto
            ? <img src={novel.coverPhoto} alt="" />
            : <span className="active-project-cover-letter">{novel.title[0]?.toUpperCase()}</span>
          }
          </div>
          <button
            className="active-project-settings-btn"
            onClick={e => { e.stopPropagation(); setSettingsOpen(o => !o) }}
            title="Project settings"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
            </svg>
          </button>

          {/* Settings panel */}
          {settingsOpen && (
            <div className="active-project-settings-panel" onClick={e => e.stopPropagation()}>
              <p className="active-project-settings-label">Status</p>
              <div className="active-project-status-row">
                {STATUS_PICKER.map((key) => {
                  const data = STATUS_DATA[key]
                  return (
                  <button
                    key={key}
                    className={`active-project-status-pill${currentStatus === key ? ' active-project-status-pill--on' : ''}`}
                    style={{ '--sp-color': data.color }}
                    onClick={() => onSetStatus(currentStatus === key ? null : key)}
                  >
                    {data.label}
                  </button>
                  )
                })}
              </div>
              <button className="active-project-settings-action" onClick={onToggleFocus}>
                Remove active project
              </button>
            </div>
          )}
        </div>
      </aside>

      <section className="active-project-command-snapshot" onClick={e => e.stopPropagation()}>
        <p className="active-project-settings-label">Library Snapshot</p>
        <div className="active-project-command-stats active-project-command-stats--compact">
          <div className="active-project-command-stat">
            <strong>{allStats.length}</strong>
            <span>Projects</span>
          </div>
          <div className="active-project-command-stat">
            <strong>{series.length}</strong>
            <span>Series</span>
          </div>
          <div className="active-project-command-stat">
            <strong>{totalWords.toLocaleString()}</strong>
            <span>Total words</span>
          </div>
        </div>
        <div className="active-project-command-mini">
          <span>{totalScenes.toLocaleString()} scenes</span>
          <span>{totalCharacters.toLocaleString()} character records</span>
        </div>
      </section>
    </div>
  )
}

function StatusQueue({ stats, onOpenProject }) {
  return (
    <section>
      <div className="dash-section-title">
        <h2>Status Queue</h2>
        <span>Pipeline</span>
      </div>
      <div className="project-status-queue">
        {stats.map(item => {
          const data = STATUS_DATA[item.project.status] ?? STATUS_DATA.not_started
          const cfg = getProjectType(item.project.type)
          return (
            <button
              key={item.project.id}
              type="button"
              className="project-status-row"
              onClick={() => onOpenProject(item.project.id)}
            >
              <span className="project-status-dot" style={{ '--status-row-color': data.color }} />
              <span className="project-status-copy">
                <strong>{item.project.title}</strong>
                <small>{cfg.label}</small>
              </span>
              <StatusBadge status={item.project.status} />
            </button>
          )
        })}
      </div>
    </section>
  )
}

function NovelCard({ stats, onOpen, onDelete, onUpdateCover, onExport, organizing, isDragging, isDropTarget, dropBefore, onDragStart, onDragOver, onDrop, onDragEnd, isFirst, isLast, onMoveUp, onMoveDown, isFocus, onSetFocus, compact, onCycleStatus }) {
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

  if (compact) {
    return (
      <div className="novel-card novel-card--compact" onClick={() => onOpen?.(novel.id)}>
        <div className="novel-card-cover" style={{ background: novel.coverPhoto ? undefined : getCoverGradient(novel.title) }}>
          {novel.coverPhoto ? <img src={novel.coverPhoto} alt="" /> : (
            <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,0.1)', userSelect: 'none' }}>{novel.title[0]?.toUpperCase()}</span>
          )}
          {isFocus && <span className="novel-focus-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></span>}
        </div>
        <div className="novel-card-foot">
          <p style={{ fontSize: 10, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{novel.title}</p>
          <StatusBadge status={novel.status} small onClick={e => { e.stopPropagation(); onCycleStatus?.() }} />
        </div>
      </div>
    )
  }

  return (
    <div
      className="novel-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      draggable={organizing}
      onDragStart={organizing ? onDragStart : undefined}
      onDragOver={organizing ? onDragOver : undefined}
      onDrop={organizing ? onDrop : undefined}
      onDragEnd={organizing ? onDragEnd : undefined}
      style={{
        opacity: isDragging ? 0.35 : 1,
        cursor: organizing ? 'grab' : undefined,
        outline: isDropTarget ? `2px solid var(--accent)` : undefined,
        outlineOffset: isDropTarget ? (dropBefore ? '-2px' : '-2px') : undefined,
        boxShadow: isDropTarget ? `${dropBefore ? '-4px' : '4px'} 0 0 0 var(--accent)` : undefined,
      }}
    >
      {/* Cover */}
      <div
        className="novel-card-cover"
        onClick={() => !organizing && onOpen?.(novel.id)}
        style={{ background: novel.coverPhoto ? undefined : getCoverGradient(novel.title), cursor: organizing ? 'default' : undefined }}
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
        {isFocus && (
          <span className="novel-focus-badge" title="Active project">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </span>
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
        {organizing && (
          <div className="novel-card-organize-controls" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 3 }}>
              <button className="card-order-btn" onClick={onMoveUp} disabled={isFirst} title="Move left">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button className="card-order-btn" onClick={onMoveDown} disabled={isLast} title="Move right">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
            <button
              className={`card-focus-btn${isFocus ? ' card-focus-btn--active' : ''}`}
              onClick={onSetFocus}
              title={isFocus ? 'Remove active project' : 'Set as active project'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={isFocus ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {isFocus ? 'Active' : 'Set active'}
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="novel-card-foot" onClick={() => !organizing && onOpen?.(novel.id)}>
        <p>{novel.title}</p>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>
          {cfg.label} · {stats.updatedLabel}
        </p>
        <StatusBadge status={novel.status} small onClick={e => { e.stopPropagation(); onCycleStatus?.() }} />
      </div>

      {/* Hover popup */}
      {hovered && !organizing && (
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
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={(e) => { e.stopPropagation(); onExport(novel.id) }}
                style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                Export project
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
        </div>
      )}
    </div>
  )
}

const STATUS_OPTIONS = [
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'hiatus', label: 'Hiatus' },
  { id: 'planned', label: 'Planned' },
]

function EditSeriesModal({ series, allStats, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({
    name: series.name || '',
    summary: series.summary || '',
    status: series.status || 'ongoing',
    tags: series.tags || [],
    coverPhoto: series.coverPhoto || null,
  })
  const [tagInput, setTagInput] = useState('')
  const [coverError, setCoverError] = useState('')
  const [assignedIds, setAssignedIds] = useState(
    () => new Set(allStats.filter(s => s.project.seriesId === series.id).map(s => s.project.id))
  )

  const handleCoverSelect = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !file.type.startsWith('image/')) return
    try {
      setCoverError('')
      const photo = await resizeCoverPhoto(file)
      setForm(p => ({ ...p, coverPhoto: photo }))
    } catch {
      setCoverError('Could not use that image.')
    }
  }

  const commitTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) setForm(p => ({ ...p, tags: [...p.tags, t] }))
    setTagInput('')
  }

  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag() }
    if (e.key === 'Backspace' && !tagInput && form.tags.length) {
      setForm(p => ({ ...p, tags: p.tags.slice(0, -1) }))
    }
  }

  const toggleProject = (id) => {
    setAssignedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave(series.id, { ...form, name: form.name.trim() }, assignedIds)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSave}
        style={{ width: '100%', maxWidth: 520, background: 'var(--bg-nav)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cover banner */}
        <div style={{ position: 'relative', height: 140, flexShrink: 0, background: form.coverPhoto ? undefined : 'linear-gradient(135deg, var(--bg-main) 0%, color-mix(in srgb, var(--accent) 18%, var(--bg-main)) 100%)', overflow: 'hidden' }}>
          {form.coverPhoto && <img src={form.coverPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <label style={{ cursor: 'pointer', background: 'rgba(0,0,0,.52)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 7, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <input type="file" accept="image/*" onChange={handleCoverSelect} style={{ display: 'none' }} />
              {form.coverPhoto ? 'Change Cover' : 'Add Cover'}
            </label>
            {form.coverPhoto && (
              <button type="button" onClick={() => setForm(p => ({ ...p, coverPhoto: null }))}
                style={{ cursor: 'pointer', background: 'rgba(0,0,0,.52)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 7, padding: '6px 14px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                Remove
              </button>
            )}
          </div>
          {coverError && <p style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: '#f87171', margin: 0 }}>{coverError}</p>}
        </div>

        {/* Scrollable body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-main)' }}>Edit Series</p>

          <input
            autoFocus
            placeholder="Series name *"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            required
            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 14, fontWeight: 600, color: 'var(--text-main)', outline: 'none' }}
          />

          <textarea
            placeholder="Series summary (optional)"
            value={form.summary}
            onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}
            rows={4}
            style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: 'var(--text-main)', resize: 'vertical', outline: 'none', lineHeight: 1.55, minHeight: 88, flexShrink: 0 }}
          />

          <div>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.id} type="button" onClick={() => setForm(p => ({ ...p, status: opt.id }))}
                  style={{
                    padding: '5px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${form.status === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.status === opt.id ? 'var(--accent-fade)' : 'transparent',
                    color: form.status === opt.id ? 'var(--accent)' : 'var(--text-muted)',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Tags</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '7px 10px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, minHeight: 40, alignItems: 'center' }}>
              {form.tags.map(tag => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 999, background: 'var(--accent-fade)', border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                  {tag}
                  <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={commitTag}
                placeholder={form.tags.length ? '' : 'fantasy, sci-fi… (Enter or comma to add)'}
                style={{ flex: 1, minWidth: 140, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: 'var(--text-main)', padding: '1px 0' }}
              />
            </div>
          </div>

          <div>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Projects</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {allStats.map(s => (
                <label key={s.project.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: assignedIds.has(s.project.id) ? 'var(--accent-fade)' : 'var(--bg-main)', border: `1px solid ${assignedIds.has(s.project.id) ? 'color-mix(in srgb, var(--accent) 38%, transparent)' : 'var(--border)'}`, transition: 'background .15s, border-color .15s' }}>
                  <input type="checkbox" checked={assignedIds.has(s.project.id)} onChange={() => toggleProject(s.project.id)} style={{ accentColor: 'var(--accent)', width: 14, height: 14, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{s.project.title}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>{getProjectType(s.project.type).label}</span>
                </label>
              ))}
              {allStats.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No projects yet.</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <button type="button" onClick={() => onDelete(series.id)}
            style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 'auto' }}
            onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            Delete series
          </button>
          <button type="button" onClick={onClose}
            style={{ padding: '9px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit"
            style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: 'var(--accent)', color: 'var(--bg-main)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            Save
          </button>
        </div>
      </form>
    </div>
  )
}

function SeriesCard({ series, seriesStats, onClick }) {
  const totalWords = seriesStats.reduce((sum, s) => sum + s.manuscriptWords, 0)
  return (
    <div className="series-dash-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div
        className="series-dash-card-cover"
        style={{ background: series.coverPhoto ? undefined : getCoverGradient(series.name) }}
      >
        {series.coverPhoto
          ? <img src={series.coverPhoto} alt="" />
          : <span className="series-dash-card-letter">{series.name[0]?.toUpperCase()}</span>
        }
        <span className="series-dash-card-count">
          {seriesStats.length} {seriesStats.length === 1 ? 'book' : 'books'}
        </span>
      </div>
      <div className="series-dash-card-foot">
        <p className="series-dash-card-name">{series.name}</p>
        {totalWords > 0 && <p className="series-dash-card-words">{totalWords.toLocaleString()} words</p>}
      </div>
      <div className="series-dash-card-hover">
        <p>Projects</p>
        <ul>
          {seriesStats.map(stats => (
            <li key={stats.project.id}>
              <span>{stats.project.title}</span>
              <StatusBadge status={stats.project.status} small />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SeriesDashboard({ series, seriesStats, onOpenProject, onEdit, onClose, onCycleStatus }) {
  const totalWords = seriesStats.reduce((sum, s) => sum + s.manuscriptWords, 0)
  const statusLabel = STATUS_OPTIONS.find(o => o.id === series.status)?.label

  return (
    <div className="series-dashboard">
      <div
        className="series-dashboard-banner"
        style={{ background: series.coverPhoto ? undefined : getCoverGradient(series.name) }}
      >
        {series.coverPhoto && <img className="series-dashboard-banner-img" src={series.coverPhoto} alt="" />}
        <div className="series-dashboard-banner-overlay">
          <button className="series-dashboard-back-btn" onClick={onClose}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            All projects
          </button>
          <div className="series-dashboard-banner-body">
            <p className="series-dashboard-eyebrow">Series</p>
            <h2 className="series-dashboard-name">{series.name}</h2>
            {series.summary && <p className="series-dashboard-summary">{series.summary}</p>}
            <div className="series-dashboard-stats-row">
              <span>{seriesStats.length} {seriesStats.length === 1 ? 'book' : 'books'}</span>
              {totalWords > 0 && <><span className="series-dashboard-dot">·</span><span>{totalWords.toLocaleString()} words</span></>}
              {statusLabel && <><span className="series-dashboard-dot">·</span><span>{statusLabel}</span></>}
            </div>
            {series.tags?.length > 0 && (
              <div className="series-dashboard-tags">
                {series.tags.map(tag => <span key={tag} className="series-dashboard-tag">{tag}</span>)}
              </div>
            )}
          </div>
          <button className="series-dashboard-edit-btn" onClick={onEdit}>Edit</button>
        </div>
      </div>

      <div className="series-dashboard-books">
        <p className="series-dashboard-books-label">
          {seriesStats.length === 0 ? 'No projects yet' : `${seriesStats.length} ${seriesStats.length === 1 ? 'Project' : 'Projects'}`}
        </p>
        {seriesStats.length > 0 ? (
          <div className="novel-grid novel-grid--compact">
            {seriesStats.map(stats => (
              <NovelCard
                key={stats.project.id}
                compact
                stats={stats}
                onOpen={onOpenProject}
                isFocus={!!stats.project.focus}
                onCycleStatus={() => onCycleStatus(stats.project.id, stats.project.status)}
              />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>No projects in this series yet.</p>
        )}
      </div>
    </div>
  )
}

export default function NovelManager({ store, user, onOpenProject, onOpenChat, onOpenAccount, onOpenHelp }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', type: DEFAULT_TYPE })
  const [showSeriesForm, setShowSeriesForm] = useState(false)
  const [seriesName, setSeriesName] = useState('')
  const [editingSeries, setEditingSeries] = useState(null)
  const [organizing, setOrganizing] = useState(false)
  const [dragging, setDragging] = useState(null) // visual feedback only
  const [dropTarget, setDropTarget] = useState(null) // { type, id, before }
  const dragRef = useRef(null) // { type: 'series'|'novel', id, seriesId? } — sync, used in handlers
  const [seriesFilter, setSeriesFilter] = useState(null)
  const [openSeriesId, setOpenSeriesId] = useState(null)
  const userProfile = user?.user_metadata || {}
  const userName = userProfile.full_name || userProfile.name || userProfile.alias || userProfile.writer_alias || user?.displayName || user?.email?.split('@')[0] || 'User'

  const handleSaveSeries = (id, data, assignedProjectIds) => {
    store.updateSeries(id, data)
    store.allProjectStats.forEach(s => {
      const inSeries = s.project.seriesId === id
      const shouldBe = assignedProjectIds.has(s.project.id)
      if (shouldBe && !inSeries) store.updateNovel(s.project.id, { seriesId: id })
      else if (!shouldBe && inSeries) store.updateNovel(s.project.id, { seriesId: null })
    })
    setEditingSeries(null)
  }

  const handleDeleteSeries = (id) => {
    if (confirm('Delete this series? Projects will not be deleted.')) {
      store.deleteSeries(id)
      setEditingSeries(null)
    }
  }

  const clearDrag = () => { dragRef.current = null; setDragging(null); setDropTarget(null) }

  const moveProjectUp = (id, groupStats) => {
    const groupIds = groupStats.map(s => s.project.id)
    const idx = groupIds.indexOf(id)
    if (idx <= 0) return
    const allIds = store.allProjectStats.map(s => s.project.id)
    const posA = allIds.indexOf(groupIds[idx - 1])
    const posB = allIds.indexOf(id)
    ;[allIds[posA], allIds[posB]] = [allIds[posB], allIds[posA]]
    store.reorderNovels(allIds)
  }
  const moveProjectDown = (id, groupStats) => {
    const groupIds = groupStats.map(s => s.project.id)
    const idx = groupIds.indexOf(id)
    if (idx >= groupIds.length - 1) return
    const allIds = store.allProjectStats.map(s => s.project.id)
    const posA = allIds.indexOf(id)
    const posB = allIds.indexOf(groupIds[idx + 1])
    ;[allIds[posA], allIds[posB]] = [allIds[posB], allIds[posA]]
    store.reorderNovels(allIds)
  }
  const handleSetFocus = (id) => {
    const isAlready = store.allProjectStats.find(s => s.project.id === id)?.project.focus
    store.allProjectStats.forEach(s => { if (s.project.focus) store.updateNovel(s.project.id, { focus: false }) })
    if (!isAlready) store.updateNovel(id, { focus: true })
  }
  const handleSetActiveSeries = (id) => {
    const isAlready = store.series.find(s => s.id === id)?.focus
    store.series.forEach(s => { if (s.focus) store.updateSeries(s.id, { focus: false }) })
    if (!isAlready) store.updateSeries(id, { focus: true })
  }
  const handleCycleStatus = (id, currentStatus) => {
    const normalizedStatus = STATUS_DATA[currentStatus]?.aliasFor ?? currentStatus ?? null
    const idx = STATUS_CYCLE.indexOf(normalizedStatus)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    store.updateNovel(id, { status: next })
  }
  const handleSetStatus = (id, status) => {
    store.updateNovel(id, { status })
  }

  const moveSeriesUp = (id) => {
    const ids = store.series.map(s => s.id)
    const idx = ids.indexOf(id)
    if (idx <= 0) return
    ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
    store.reorderSeries(ids)
  }
  const moveSeriesDown = (id) => {
    const ids = store.series.map(s => s.id)
    const idx = ids.indexOf(id)
    if (idx >= ids.length - 1) return
    ;[ids[idx + 1], ids[idx]] = [ids[idx], ids[idx + 1]]
    store.reorderSeries(ids)
  }

  const handleNovelDragStart = (e, id, seriesId) => {
    dragRef.current = { type: 'novel', id, seriesId }
    setDragging({ type: 'novel', id, seriesId })
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleNovelDragOver = (e, id) => {
    const drag = dragRef.current
    if (drag?.type !== 'novel' || drag.id === id) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    setDropTarget({ type: 'novel', id, before: e.clientX < rect.left + rect.width / 2 })
  }
  const handleNovelDrop = (e, targetId, targetSeriesId) => {
    e.preventDefault()
    const drag = dragRef.current
    if (!drag || drag.type !== 'novel' || drag.id === targetId) return clearDrag()
    const allIds = store.allProjectStats.map(s => s.project.id)
    const from = allIds.indexOf(drag.id)
    allIds.splice(from, 1)
    const toIdx = allIds.indexOf(targetId) + (dropTarget?.before ? 0 : 1)
    allIds.splice(Math.max(0, toIdx), 0, drag.id)
    if (drag.seriesId !== targetSeriesId) store.updateNovel(drag.id, { seriesId: targetSeriesId || null })
    store.reorderNovels(allIds)
    clearDrag()
  }

  const handleCreateSeries = (e) => {
    e.preventDefault()
    if (!seriesName.trim()) return
    store.addSeries(seriesName.trim())
    setSeriesName('')
    setShowSeriesForm(false)
  }

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

  const handleExportProject = (id) => {
    const projectData = store.getProjectExportData(id)
    if (!projectData) return

    const blob = createProjectZipBlob(projectData)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = getProjectExportFilename(projectData.project)
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const focusStats = store.allProjectStats.find(s => s.project.focus) ?? null
  const focusSeries = store.series.find(s => s.focus) ?? null

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
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-main)', color: 'var(--text-main)', WebkitOverflowScrolling: 'touch' }}>

      {/* Top bar */}
      <div className="library-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="library-brand-logo"><YOWLogo /></span>
          {!store.readOnly && (
            <>
              <button className="library-new-project-button" type="button" onClick={() => setShowForm(true)}>
                New Project
              </button>
              <button className="library-new-series-button" type="button" onClick={() => setShowSeriesForm(true)}>
                New Series
              </button>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {store.novels.length > 1 && (
            <button
              className={`library-organize-button${organizing ? ' library-organize-button--active' : ''}`}
              type="button"
              onClick={() => { setOrganizing(o => !o); clearDrag() }}
              title={organizing ? 'Done organizing' : 'Organize library'}
            >
              {organizing ? 'Done' : 'Organize'}
            </button>
          )}
          <button className="library-chat-button" type="button" onClick={onOpenChat} title="Open AI chat" aria-label="Open AI chat">
            ✦
          </button>
          <UserMenu onOpenAccount={onOpenAccount} onOpenHelp={onOpenHelp} />
        </div>
      </div>

      {/* ── Full-height active project hero ── */}
      {focusStats && !organizing && (
        <ActiveProjectHero
          stats={focusStats}
          allStats={store.allProjectStats}
          series={store.series}
          onOpen={onOpenProject}
          onSetStatus={(status) => handleSetStatus(focusStats.project.id, status)}
          onToggleFocus={() => handleSetFocus(focusStats.project.id)}
        />
      )}

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '36px 28px 56px' }}>
        {/* Welcome + heading only when no active project or in organize mode */}
        {(!focusStats || organizing) && (
          <>
            <p className="library-welcome">Welcome, {userName}!</p>
            <div className="library-hero" style={{ justifyContent: 'center' }}>
              <h1>What are we writing today?</h1>
            </div>
          </>
        )}


        {/* ── Series filter strip (full-view only) ── */}
        {(!focusStats || organizing) && store.series.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginRight: 4 }}>Series</span>
            <button
              onClick={() => setSeriesFilter(null)}
              style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${seriesFilter === null ? 'var(--accent)' : 'var(--border)'}`, background: seriesFilter === null ? 'var(--accent-fade)' : 'transparent', color: seriesFilter === null ? 'var(--accent)' : 'var(--text-muted)' }}
            >All</button>
            {store.series.map(s => (
              <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
                <button
                  onClick={() => setSeriesFilter(seriesFilter === s.id ? null : s.id)}
                  style={{ padding: '4px 10px 4px 12px', borderRadius: '999px 0 0 999px', fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1px solid ${seriesFilter === s.id ? 'var(--accent)' : 'var(--border)'}`, borderRight: 'none', background: seriesFilter === s.id ? 'var(--accent-fade)' : 'transparent', color: seriesFilter === s.id ? 'var(--accent)' : 'var(--text-muted)' }}
                >{s.name}</button>
                <button
                  onClick={() => setEditingSeries(s)}
                  title="Edit series"
                  style={{ padding: '4px 8px', borderRadius: '0 999px 999px 0', fontSize: 11, cursor: 'pointer', border: `1px solid ${seriesFilter === s.id ? 'var(--accent)' : 'var(--border)'}`, background: seriesFilter === s.id ? 'var(--accent-fade)' : 'transparent', color: seriesFilter === s.id ? 'var(--accent)' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* ── Full grouped grid (organize mode or no active project) ── */}
        {(organizing || !focusStats) && projectGroups.map(group => {
          const seriesIdx = store.series.findIndex(s => s.id === group.id)
          const thisSeries = store.series.find(s => s.id === group.id)
          return (
            <section className="library-series-section" key={group.id}>
              <div className="library-series-heading">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {organizing && group.id !== 'standalone' && (
                    <span style={{ display: 'inline-flex', gap: 2 }}>
                      <button type="button" className="series-order-button" onClick={() => moveSeriesUp(group.id)} disabled={seriesIdx <= 0} title="Move up">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                      </button>
                      <button type="button" className="series-order-button" onClick={() => moveSeriesDown(group.id)} disabled={seriesIdx >= store.series.length - 1} title="Move down">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                      </button>
                    </span>
                  )}
                  <h2>{group.title}</h2>
                  {organizing && group.id !== 'standalone' && (
                    <button
                      type="button"
                      className={`series-order-button${thisSeries?.focus ? ' series-order-button--active' : ''}`}
                      onClick={() => handleSetActiveSeries(group.id)}
                      title={thisSeries?.focus ? 'Remove active series' : 'Set as active series'}
                      style={{ width: 'auto', padding: '0 8px', gap: 5, display: 'inline-flex', alignItems: 'center' }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill={thisSeries?.focus ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {thisSeries?.focus ? 'Active' : 'Set active'}
                    </button>
                  )}
                  {!organizing && group.id !== 'standalone' && (
                    <button type="button" onClick={() => setEditingSeries(thisSeries)} title="Edit series" className="series-edit-icon-button">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>
                    </button>
                  )}
                </div>
                <span>{group.stats.length} project{group.stats.length === 1 ? '' : 's'}</span>
              </div>
              <div className="novel-grid" onDragOver={organizing ? e => e.preventDefault() : undefined} onDrop={organizing && group.stats.length === 0 ? e => handleNovelDrop(e, null, group.id === 'standalone' ? null : group.id) : undefined}>
                {group.stats.map((stats, i) => {
                  const isNovelDropTarget = dropTarget?.type === 'novel' && dropTarget.id === stats.project.id
                  return (
                    <NovelCard
                      key={stats.project.id}
                      stats={stats}
                      onOpen={organizing ? undefined : onOpenProject}
                      onDelete={handleDelete}
                      onUpdateCover={handleUpdateCover}
                      onExport={handleExportProject}
                      organizing={organizing}
                      isDragging={dragging?.type === 'novel' && dragging.id === stats.project.id}
                      isDropTarget={isNovelDropTarget}
                      dropBefore={isNovelDropTarget && dropTarget.before}
                      onDragStart={e => handleNovelDragStart(e, stats.project.id, stats.project.seriesId)}
                      onDragOver={e => handleNovelDragOver(e, stats.project.id)}
                      onDrop={e => handleNovelDrop(e, stats.project.id, stats.project.seriesId)}
                      onDragEnd={clearDrag}
                      isFirst={i === 0}
                      isLast={i === group.stats.length - 1}
                      onMoveUp={() => moveProjectUp(stats.project.id, group.stats)}
                      onMoveDown={() => moveProjectDown(stats.project.id, group.stats)}
                      isFocus={!!stats.project.focus}
                      onSetFocus={() => handleSetFocus(stats.project.id)}
                      onCycleStatus={() => handleCycleStatus(stats.project.id, stats.project.status)}
                    />
                  )
                })}
              </div>
            </section>
          )
        })}

        {/* ── Series + Standalone (active project set, normal mode) ── */}
        {focusStats && !organizing && (() => {
          const seriesById = new Map((store.series || []).map(s => [s.id, s]))
          const nonFocusStats = store.allProjectStats.filter(s => !s.project.focus)
          const seriesWithProjects = (store.series || []).filter(s =>
            store.allProjectStats.some(st => st.project.seriesId === s.id)
          )
          const standaloneStats = nonFocusStats.filter(s =>
            !s.project.seriesId || !seriesById.has(s.project.seriesId)
          )

          if (openSeriesId) {
            const series = store.series.find(s => s.id === openSeriesId)
            if (series) {
              const sStats = store.allProjectStats.filter(s => s.project.seriesId === openSeriesId)
              return (
                <SeriesDashboard
                  series={series}
                  seriesStats={sStats}
                  onOpenProject={onOpenProject}
                  onEdit={() => setEditingSeries(series)}
                  onClose={() => setOpenSeriesId(null)}
                  onCycleStatus={handleCycleStatus}
                />
              )
            }
          }

          if (seriesWithProjects.length === 0 && standaloneStats.length === 0) return null

          return (
            <section className="command-library-grid">
              <div>
                <div className="dash-section-title">
                  <h2>Series</h2>
                  <span>Open dashboards</span>
                </div>
                {seriesWithProjects.length > 0 ? (
                  <div className="dash-series-grid">
                    {seriesWithProjects.map(s => {
                      const sStats = store.allProjectStats.filter(st => st.project.seriesId === s.id)
                      return (
                        <SeriesCard
                          key={s.id}
                          series={s}
                          seriesStats={sStats}
                          onClick={() => setOpenSeriesId(s.id)}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="dash-series-grid">
                    {standaloneStats.map(stats => (
                      <NovelCard
                        key={stats.project.id}
                        compact
                        stats={stats}
                        onOpen={onOpenProject}
                        onDelete={handleDelete}
                        onUpdateCover={handleUpdateCover}
                        onExport={handleExportProject}
                        isFocus={false}
                        onCycleStatus={() => handleCycleStatus(stats.project.id, stats.project.status)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <StatusQueue stats={store.allProjectStats} onOpenProject={onOpenProject} />
            </section>
          )
        })()}

        {/* Empty state */}
        {store.novels.length === 0 && !store.readOnly && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 48 }}>
            Create your first project to get started.
          </p>
        )}
        {store.readOnly && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 48 }}>
            Your trial has ended. Projects are available in read-only mode until membership is active.
          </p>
        )}
      </div>

      {/* Edit series modal */}
      {editingSeries && (
        <EditSeriesModal
          series={editingSeries}
          allStats={store.allProjectStats}
          onSave={handleSaveSeries}
          onDelete={handleDeleteSeries}
          onClose={() => setEditingSeries(null)}
        />
      )}

      {/* New series modal */}
      {showSeriesForm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setShowSeriesForm(false)}
        >
          <form
            onSubmit={handleCreateSeries}
            style={{
              width: '100%', maxWidth: 360, padding: 24,
              background: 'var(--bg-nav)', border: '1px solid var(--border)',
              borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,.4)',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-main)' }}>New Series</p>
            <input
              autoFocus
              placeholder="Series name *"
              value={seriesName}
              onChange={e => setSeriesName(e.target.value)}
              required
              style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 14, color: 'var(--text-main)', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button type="submit"
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 7, border: 'none',
                  background: 'var(--accent)', color: 'var(--bg-main)',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer',
                }}>
                Create
              </button>
              <button type="button" onClick={() => setShowSeriesForm(false)}
                style={{ padding: '10px 16px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
