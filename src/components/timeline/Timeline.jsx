import { useMemo, useState } from 'react'
import Modal from '../shared/Modal'

// The Fix: uses theme variables so all 4 themes apply correctly
const INPUT = 'w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]'
const LABEL = 'block text-xs text-[var(--text-muted)] mb-1.5'

function parseTimelineYear(value) {
  if (!value) return null
  const date = value.toString().replace(/[−–—]/g, '-')
  const yearMatch = date.match(/\byears?\s*(-?\d+)/i)
  const firstNumber = yearMatch || date.match(/-?\d+/)
  if (!firstNumber) return null

  let year = parseInt(firstNumber[1] ?? firstNumber[0], 10)
  if (!Number.isFinite(year)) return null
  if (/\b(?:bc|bce)\b/i.test(date) && year > 0) year = -year
  return year
}

function EventForm({ initial, characters = [], locations = [], onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    date: initial?.date ?? '',
    description: initial?.description ?? '',
    tags: initial?.tags ?? [],
    linkedCharacters: initial?.linkedCharacters ?? [],
    linkedLocations: initial?.linkedLocations ?? [],
  })
  const [tagInput, setTagInput] = useState('')
  const field = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))
  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().replace(/,$/, '')
      if (tag && !form.tags.includes(tag)) setForm(p => ({ ...p, tags: [...p.tags, tag] }))
      setTagInput('')
    }
  }
  const toggleChar = (id) => setForm(p => ({
    ...p,
    linkedCharacters: p.linkedCharacters.includes(id)
      ? p.linkedCharacters.filter(x => x !== id)
      : [...p.linkedCharacters, id],
  }))
  const toggleLocation = (id) => setForm(p => ({
    ...p,
    linkedLocations: p.linkedLocations.includes(id)
      ? p.linkedLocations.filter(x => x !== id)
      : [...p.linkedLocations, id],
  }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (form.title.trim()) onSave(form) }} className="space-y-4">
      <div>
        <label className={LABEL}>Event title *</label>
        <input value={form.title} onChange={field('title')} className={INPUT} required />
      </div>
      <div>
        <label className={LABEL}>Date / Time</label>
        <input value={form.date} onChange={field('date')} placeholder="e.g. Year 312, 3rd Month, -50 BC" className={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Description</label>
        <textarea value={form.description} onChange={field('description')} rows={6}
          className={INPUT + ' resize-none'} placeholder="What happened?" />
      </div>
      <div>
        <label className={LABEL}>Tags</label>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {form.tags.map(t => (
              <span key={t} className="inline-flex items-center gap-1 bg-[var(--bg-nav)] border border-[var(--border)] rounded px-2 py-0.5 text-xs text-[var(--text-main)]">
                {t}
                <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)]">×</button>
              </span>
            ))}
          </div>
        )}
        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
          placeholder="Type a tag and press Enter" className={INPUT} />
      </div>
      {characters.length > 0 && (
        <div>
          <label className={LABEL}>Linked characters</label>
          <div className="max-h-32 overflow-y-auto bg-[var(--bg-main)] border border-[var(--border)] rounded p-2 space-y-1.5">
            {characters.map(c => (
              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-main)] hover:text-[var(--text-main)]">
                <input type="checkbox" checked={form.linkedCharacters.includes(c.id)} onChange={() => toggleChar(c.id)}
                  className="accent-[var(--accent)]" />
                {c.name}
              </label>
            ))}
          </div>
        </div>
      )}
      {locations.length > 0 && (
        <div>
          <label className={LABEL}>Linked locations</label>
          <div className="max-h-32 overflow-y-auto bg-[var(--bg-main)] border border-[var(--border)] rounded p-2 space-y-1.5">
            {locations.map(l => (
              <label key={l.id} className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-main)] hover:text-[var(--text-main)]">
                <input type="checkbox" checked={form.linkedLocations.includes(l.id)} onChange={() => toggleLocation(l.id)}
                  className="accent-[var(--accent)]" />
                {l.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
        <button type="submit" className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--bg-main)] font-semibold rounded text-sm transition-colors">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm transition-colors">Cancel</button>
      </div>
    </form>
  )
}

function compareEventsByYear(a, b) {
  const aYear = parseTimelineYear(a.date)
  const bYear = parseTimelineYear(b.date)
  const safeA = Number.isFinite(aYear) ? aYear : Infinity
  const safeB = Number.isFinite(bYear) ? bYear : Infinity
  return safeA - safeB || (a.title || '').localeCompare(b.title || '')
}

function isWorldHistoryEvent(event) {
  return event.sourceType === 'history' || event.isWorldHistory
}

export default function Timeline({ store }) {
  const { timeline, worldHistory, characters = [], locations = [], addEvent, updateEvent, deleteEvent, currentYear } = store
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const allEvents = useMemo(() => {
    const timelineIds = new Set((timeline || []).map(e => e.id))
    const historyIds = new Set((worldHistory || []).map(h => h.id))
    const linkedHistoryByEvent = new Map(
      (worldHistory || [])
        .filter(h => h.timelineEventId)
        .map(h => [h.timelineEventId, h])
    )
    const manual = (timeline || []).map(e => ({
      ...e,
      sourceType: 'timeline',
      isWorldHistory: Boolean((e.worldHistoryEntryId && historyIds.has(e.worldHistoryEntryId)) || linkedHistoryByEvent.has(e.id)),
      readOnly: false,
    }))
    const history = (worldHistory || [])
      .filter(h => !h.timelineEventId || !timelineIds.has(h.timelineEventId))
      .map(h => ({
        id: `history-${h.id}`,
        title: h.title,
        date: h.dateRange || h.era || '',
        description: h.content || '',
        tags: h.tags || [],
        linkedCharacters: [],
        linkedLocations: [],
        sourceType: 'history',
        readOnly: true,
      }))
    const birthdays = (characters || [])
      .filter(c => c.birthDate && c.birthDate.toString().trim())
      .map(c => ({
        id: `birth-${c.id}`,
        title: `${c.name} is born`,
        date: c.birthDate,
        description: c.role ? `${c.role}` : 'Character birth',
        tags: ['birthday'],
        linkedCharacters: [c.id],
        linkedLocations: [],
        sourceType: 'birthday',
        readOnly: true,
      }))

    return [...manual, ...history, ...birthdays].sort(compareEventsByYear)
  }, [timeline, worldHistory, characters])

  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return allEvents.filter(e =>
      (e.title || '').toLowerCase().includes(query) ||
      (e.description || '').toLowerCase().includes(query) ||
      (e.date || '').toLowerCase().includes(query)
    )
  }, [allEvents, search])

  const closeForm = () => { setShowForm(false); setEditTarget(null) }
  const handleSave = (data) => {
    if (editTarget) updateEvent(editTarget.id, data)
    else addEvent(data)
    closeForm()
  }
  const handleDelete = (id) => {
    if (!confirm('Delete this event?')) return
    deleteEvent(id)
    if (expandedId === id) {
      setExpandedId(null)
    }
  }
  const handleTileClick = (event) => {
    if (expandedId === event.id) {
      setExpandedId(null)
    } else {
      setExpandedId(event.id)
    }
  }

  const jumpTo = (target, clickEvent) => {
    clickEvent?.stopPropagation()
    if (target.section === 'characters') store.setSelectedCharacterId(target.id)
    if (target.section === 'locations') store.setSelectedLocationId(target.id)
    if (target.section === 'lore') store.setSelectedLoreEntryId(target.id)
    if (target.section === 'ideas') store.setSelectedIdeaEntryId(target.id)
    window.dispatchEvent(new CustomEvent('switch-section', { detail: { section: target.section } }))
  }

  const expandedEvent = expandedId ? filtered.find(e => e.id === expandedId) : null

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)]">
      <div className="studio-topbar px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="eyebrow">Chronicle</p>
          <h2 className="font-serif text-xl font-bold text-[var(--text-main)]">Timeline</h2>
        </div>
        <div className="flex items-center gap-3">
          {currentYear ? (
            <span className="timeline-current-year">Current year: {currentYear}</span>
          ) : null}
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events…"
            className="field px-3 py-1.5 text-xs w-44 placeholder:text-[var(--text-muted)]"
          />
          <button
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            className="btn btn-primary btn-sm"
          >
            New Event
          </button>
        </div>
      </div>

      <div className="timeline-scroll flex-1 overflow-y-auto" onScroll={() => {}}>
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <div className="empty-state">
              <p className="text-sm">{allEvents.length === 0 ? 'No events yet.' : 'No matches.'}</p>
            </div>
          </div>
        ) : (
          <div className="timeline-list">
            {filtered.map(ev => {
              const isBirthday = ev.sourceType === 'birthday'
              const isHistory = isWorldHistoryEvent(ev)
              const isExpanded = expandedId === ev.id
              return (
                <article
                  key={ev.id}
                  className={`timeline-item ${isExpanded ? 'is-expanded' : ''} ${isHistory ? 'is-history' : ''} ${isBirthday ? 'is-birthday' : ''}`}
                >
                  {isBirthday ? (
                    <div className="timeline-birthday-row">
                      <span className="timeline-dot" />
                      <div className="timeline-birthday-tooltip">
                        {ev.date && <div className="timeline-birthday-tooltip-date">{ev.date}</div>}
                        <div className="timeline-birthday-tooltip-name">{ev.title}</div>
                        {ev.description && ev.description !== 'Character birth' && (
                          <div className="timeline-birthday-tooltip-role">{ev.description}</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                  <span className="timeline-dot" />
                  <button
                    type="button"
                    className="timeline-item-main"
                    onClick={() => handleTileClick(ev)}
                  >
                    <span className="timeline-item-copy">
                      <span className="timeline-date">{ev.date || 'Undated'}</span>
                      <strong>{ev.title}</strong>
                      {ev.description && <small>{ev.description}</small>}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="timeline-detail">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-[var(--text-main)] leading-snug">{expandedEvent.title}</span>
                    <button onClick={() => { setExpandedId(null) }} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm flex-shrink-0 leading-none mt-0.5">✕</button>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    {expandedEvent.sourceType === 'timeline' && !isWorldHistoryEvent(expandedEvent) && 'Timeline event'}
                    {isWorldHistoryEvent(expandedEvent) && 'World history'}
                    {expandedEvent.sourceType === 'birthday' && 'Character birthday'}
                  </div>
                  {expandedEvent.date && (
                    <div className="text-xs text-[var(--accent)] mb-2">{expandedEvent.date}</div>
                  )}
                  {expandedEvent.description && (
                    <p className="text-xs text-[var(--text-main)] leading-relaxed whitespace-pre-wrap mb-2 max-h-32 overflow-y-auto">
                      {expandedEvent.description}
                    </p>
                  )}
                  {expandedEvent.linkedCharacters?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Characters</div>
                      <div className="flex flex-wrap gap-1.5">
                        {expandedEvent.linkedCharacters.map(id => {
                          const char = characters.find(c => c.id === id)
                          if (!char) return null
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={(e) => jumpTo({ section: 'characters', id }, e)}
                              className="timeline-reference"
                            >
                              {char.image ? (
                                <img src={char.image} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-[var(--accent-fade)] flex items-center justify-center flex-shrink-0">
                                  <span className="text-[7px] font-bold text-[var(--accent)]">{char.name.charAt(0)}</span>
                                </div>
                              )}
                              <span className="text-xs text-[var(--text-main)]">{char.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {expandedEvent.linkedLocations?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Locations</div>
                      <div className="flex flex-wrap gap-1.5">
                        {expandedEvent.linkedLocations.map(id => {
                          const location = locations.find(l => l.id === id)
                          if (!location) return null
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={(e) => jumpTo({ section: 'locations', id }, e)}
                              className="timeline-reference"
                            >
                              <span className="timeline-reference-icon">L</span>
                              <span className="text-xs text-[var(--text-main)]">{location.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  {expandedEvent.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {expandedEvent.tags.map(t => (
                        <span key={t} className="bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-muted)] text-xs px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                  {!expandedEvent.readOnly && (
                    <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                      <button
                        onClick={() => { setEditTarget(expandedEvent); setShowForm(true); setExpandedId(null) }}
                        className="text-xs px-2.5 py-1 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] rounded transition-colors"
                      >Edit</button>
                      <button
                        onClick={() => handleDelete(expandedEvent.id)}
                        className="text-xs px-2.5 py-1 border border-[var(--border)] hover:border-red-500 text-[var(--text-muted)] hover:text-red-400 rounded transition-colors"
                      >Delete</button>
                    </div>
                  )}
                    </div>
                  )}
                    </>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <Modal title={editTarget ? `Edit — ${editTarget.title}` : 'New Timeline Event'} onClose={closeForm} wide>
          <EventForm initial={editTarget} characters={characters} locations={locations} onSave={handleSave} onCancel={closeForm} />
        </Modal>
      )}
    </div>
  )
}
