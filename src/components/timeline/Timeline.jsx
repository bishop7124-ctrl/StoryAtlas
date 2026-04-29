import { useMemo, useState } from 'react'
import Modal from '../shared/Modal'

// The Fix: uses theme variables so all 4 themes apply correctly
const INPUT = 'w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]'
const LABEL = 'block text-xs text-[var(--text-muted)] mb-1.5'

function parseDate(str) {
  if (!str) return Infinity
  const m = str.match(/-?\d+/)
  return m ? parseInt(m[0], 10) : Infinity
}

function EventForm({ initial, characters, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    date: initial?.date ?? '',
    description: initial?.description ?? '',
    tags: initial?.tags ?? [],
    linkedCharacters: initial?.linkedCharacters ?? [],
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
      <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
        <button type="submit" className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--bg-main)] font-semibold rounded text-sm transition-colors">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm transition-colors">Cancel</button>
      </div>
    </form>
  )
}

const SPINE_Y    = 160
const EV_SPACING = 200
const LEFT_PAD   = 80
const SVG_HEIGHT = 320
const DOT_R      = 7

export default function Timeline({ store }) {
  const { timeline, worldHistory, characters, addEvent, updateEvent, deleteEvent } = store
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const allEvents = useMemo(() => {
    const manual = (timeline || []).map(e => ({
      ...e,
      sourceType: 'timeline',
      readOnly: false,
    }))
    const history = (worldHistory || []).map(h => ({
      id: `history-${h.id}`,
      title: h.title,
      date: h.dateRange || h.era || '',
      description: h.content || '',
      tags: h.tags || [],
      linkedCharacters: [],
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
        sourceType: 'birthday',
        readOnly: true,
      }))

    return [...manual, ...history, ...birthdays].sort((a, b) => parseDate(a.date) - parseDate(b.date))
  }, [timeline, worldHistory, characters])

  const filtered = allEvents
    .filter(e =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (e.date || '').toLowerCase().includes(search.toLowerCase())
    )

  const closeForm = () => { setShowForm(false); setEditTarget(null) }
  const handleSave = (data) => {
    if (editTarget) updateEvent(editTarget.id, data)
    else addEvent(data)
    closeForm()
  }
  const handleDelete = (id) => {
    if (!confirm('Delete this event?')) return
    deleteEvent(id)
    if (expandedId === id) setExpandedId(null)
  }
  const getCharName = (id) => characters.find(c => c.id === id)?.name

  const totalWidth = LEFT_PAD + filtered.length * EV_SPACING + 80

  const handleDotClick = (evId) => {
    if (expandedId === evId) {
      setExpandedId(null)
    } else {
      setExpandedId(evId)
    }
  }

  const expandedEvent = expandedId ? filtered.find(e => e.id === expandedId) : null
  const expandedIdx   = expandedId ? filtered.findIndex(e => e.id === expandedId) : -1

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)]">
      <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0 bg-[var(--bg-main)]">
        <h2 className="text-sm font-semibold text-[var(--text-main)]">Timeline</h2>
        <div className="flex items-center gap-3">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events…"
            className="bg-[var(--bg-nav)] border border-[var(--border)] rounded px-3 py-1.5 text-xs text-[var(--text-main)] w-44 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
          />
          <button
            onClick={() => { setEditTarget(null); setShowForm(true) }}
            className="text-xs text-[var(--accent)] border border-[var(--accent)]/30 hover:border-[var(--accent)] px-3 py-1.5 rounded transition-colors"
          >
            + New Event
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-60">⏳</div>
              <p className="text-sm">{allEvents.length === 0 ? 'No events yet.' : 'No matches.'}</p>
            </div>
          </div>
        ) : (
          <div className="relative" style={{ minHeight: SVG_HEIGHT + 'px' }}>
            <svg
              width={totalWidth}
              height={SVG_HEIGHT}
              style={{ display: 'block', minWidth: '100%' }}
            >
              <line x1={LEFT_PAD - 20} y1={SPINE_Y} x2={totalWidth - 60} y2={SPINE_Y}
                stroke="var(--border)" strokeWidth="2" />

              <polygon
                points={`${totalWidth - 54},${SPINE_Y - 7} ${totalWidth - 36},${SPINE_Y} ${totalWidth - 54},${SPINE_Y + 7}`}
                fill="var(--text-muted)"
              />
              <text x={totalWidth - 30} y={SPINE_Y + 4} fill="var(--text-muted)" fontSize="10" fontWeight="600">latest</text>

              {filtered.map((ev, idx) => {
                const x     = LEFT_PAD + idx * EV_SPACING
                const above = idx % 2 === 0
                const labelY = above ? SPINE_Y - 28 : SPINE_Y + 38
                const tickY1 = above ? SPINE_Y - DOT_R - 2 : SPINE_Y + DOT_R + 2
                const tickY2 = above ? SPINE_Y - 20 : SPINE_Y + 20
                const isExpanded = expandedId === ev.id
                const sourceColor =
                  ev.sourceType === 'history'
                    ? 'var(--text-main)'
                    : ev.sourceType === 'birthday'
                      ? '#f472b6'
                      : 'var(--accent)'

                return (
                  <g key={ev.id} onClick={() => handleDotClick(ev.id)} style={{ cursor: 'pointer' }}>
                    <line x1={x} y1={tickY1} x2={x} y2={tickY2} stroke="var(--text-muted)" strokeWidth="1.5" />

                    <circle cx={x} cy={SPINE_Y} r={DOT_R + 4} fill={isExpanded ? 'var(--accent-fade)' : 'transparent'} />
                    <circle cx={x} cy={SPINE_Y} r={DOT_R}
                      fill={isExpanded ? sourceColor : 'var(--bg-nav)'}
                      stroke={isExpanded ? sourceColor : 'var(--text-muted)'}
                      strokeWidth="2"
                    />
                    {isExpanded && <circle cx={x} cy={SPINE_Y} r={DOT_R - 2} fill={sourceColor} opacity="0.6" />}

                    <text
                      x={x} y={labelY}
                      textAnchor="middle"
                      fill={isExpanded ? sourceColor : 'var(--text-muted)'}
                      fontSize="11"
                      fontWeight={isExpanded ? '600' : '400'}
                    >
                      {ev.title.length > 18 ? ev.title.slice(0, 17) + '…' : ev.title}
                    </text>

                    {ev.date && (
                      <text
                        x={x} y={above ? labelY - 14 : labelY + 14}
                        textAnchor="middle"
                        fill={sourceColor}
                        fontSize="10"
                      >
                        {ev.date}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>

            {expandedEvent && expandedIdx >= 0 && (() => {
              const x = LEFT_PAD + expandedIdx * EV_SPACING
              const above = expandedIdx % 2 === 0
              const cardW = 260
              const cardLeft = Math.max(8, x - cardW / 2)

              return (
                <div
                  className="absolute z-20 bg-[var(--bg-nav)] border border-[var(--border)] rounded-xl shadow-2xl p-4"
                  style={{
                    width: cardW,
                    left: cardLeft,
                    ...(above
                      ? { bottom: SVG_HEIGHT - SPINE_Y + DOT_R + 14 }
                      : { top: SPINE_Y + DOT_R + 14 }),
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-[var(--text-main)] leading-snug">{expandedEvent.title}</span>
                    <button onClick={() => setExpandedId(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm flex-shrink-0 leading-none mt-0.5">✕</button>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    {expandedEvent.sourceType === 'timeline' && 'Timeline event'}
                    {expandedEvent.sourceType === 'history' && 'World history'}
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
                    <div className="text-xs text-[var(--text-muted)] mb-2">
                      <span className="uppercase tracking-wider">Characters: </span>
                      <span className="text-[var(--text-main)]">
                        {expandedEvent.linkedCharacters.map(id => getCharName(id)).filter(Boolean).join(', ')}
                      </span>
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
              )
            })()}
          </div>
        )}
      </div>

      {showForm && (
        <Modal title={editTarget ? `Edit — ${editTarget.title}` : 'New Timeline Event'} onClose={closeForm} wide>
          <EventForm initial={editTarget} characters={characters} onSave={handleSave} onCancel={closeForm} />
        </Modal>
      )}
    </div>
  )
}
