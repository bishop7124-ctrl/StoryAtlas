import { useEffect, useState } from 'react'
import Modal from '../shared/Modal'
import { StudioSplit, StudioIndex, StudioRecord, StudioDetail, StudioButton, StudioEmpty, StudioPageHeader, StudioNote } from '../presentation/Studio'
import ChronicleEntryForm from '../shared/ChronicleEntryForm'

export default function WorldHistory({ store }) {
  const { worldHistory, timeline, addHistoryEntry, updateHistoryEntry, deleteHistoryEntry, updateEvent } = store
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('title-asc')
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [linkedTimelineEdit, setLinkedTimelineEdit] = useState(null)

  useEffect(() => {
    const openNewHistoryForm = () => {
      setEditTarget(null)
      setShowForm(true)
    }
    window.addEventListener('open-history-form', openNewHistoryForm)
    return () => window.removeEventListener('open-history-form', openNewHistoryForm)
  }, [])

  const filtered = (worldHistory || []).filter(h =>
    h.title.toLowerCase().includes(search.toLowerCase()) ||
    (h.era || '').toLowerCase().includes(search.toLowerCase()) ||
    (h.content || '').toLowerCase().includes(search.toLowerCase())
  )

  const entrySorter = (a, b) => {
    if (sortBy === 'title-asc' || sortBy === 'era-asc' || sortBy === 'era-desc') return a.title.localeCompare(b.title)
    if (sortBy === 'title-desc') return b.title.localeCompare(a.title)
    return 0
  }
  const groups = filtered.reduce((acc, h) => {
    const era = h.era || 'Unknown Era'
    if (!acc[era]) acc[era] = []
    acc[era].push(h)
    return acc
  }, {})
  Object.keys(groups).forEach(era => groups[era].sort(entrySorter))
  const grouped = (sortBy === 'era-asc')
    ? Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)))
    : (sortBy === 'era-desc')
      ? Object.fromEntries(Object.entries(groups).sort(([a], [b]) => b.localeCompare(a)))
      : groups

  const closeForm = () => { setShowForm(false); setEditTarget(null) }

  const handleSave = (data) => {
    if (editTarget) {
      updateHistoryEntry(editTarget.id, data)
      setSelected(prev => prev?.id === editTarget.id ? { ...prev, ...data } : prev)
    } else {
      const entry = addHistoryEntry(data, { createTimeline: data.entryKind === 'linked' })
      setSelected(entry)
    }
    closeForm()
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this history entry?')) return
    deleteHistoryEntry(id)
    if (selected?.id === id) setSelected(null)
  }

  const liveSelected = selected ? (worldHistory || []).find(h => h.id === selected.id) : null
  const linkedTimeline = liveSelected?.timelineEventId
    ? (timeline || []).find(event => event.id === liveSelected.timelineEventId)
    : null

  return (
    <StudioSplit>
      <StudioIndex
        eyebrow="Chronicle wall"
        title="History"
        tools={<StudioButton tone="primary" size="sm" onClick={() => { setEditTarget(null); setShowForm(true) }}>New</StudioButton>}
      >
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="field w-full px-2.5 py-1.5 text-xs placeholder:text-[var(--text-muted)]" />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="field w-full px-2 py-1.5 text-xs">
            <option value="title-asc">Title A→Z</option>
            <option value="title-desc">Title Z→A</option>
            <option value="era-asc">Era A→Z</option>
            <option value="era-desc">Era Z→A</option>
          </select>
          {filtered.length === 0 && (worldHistory || []).length === 0 && (
            <div className="p-4 text-center space-y-2">
              <p className="text-[var(--text-muted)] text-xs">No history entries yet.</p>
              <p className="text-[var(--text-muted)] text-[10px] leading-relaxed">Add world-building events — ages, eras, wars, founding myths — using the New button above. Timeline events also appear here automatically.</p>
            </div>
          )}
          {filtered.length === 0 && (worldHistory || []).length > 0 && (
            <p className="text-[var(--text-muted)] text-xs p-4 text-center">No matches.</p>
          )}
          {Object.entries(grouped).map(([era, entries]) => (
            <div key={era}>
              <div className="px-3 py-1.5 text-xs font-medium text-[var(--accent)]/60 uppercase tracking-wider border-b border-[var(--border)] bg-[var(--bg-nav)]/50 sticky top-0">
                {era}
              </div>
              {entries.map(h => (
                <StudioRecord
                  key={h.id}
                  onClick={() => setSelected((worldHistory || []).find(x => x.id === h.id))}
                  active={liveSelected?.id === h.id}
                >
                  <div className="text-sm font-medium text-[var(--text-main)] truncate">{h.title}</div>
                  {h.dateRange && <div className="text-xs text-[var(--text-muted)] mt-0.5">{h.dateRange}</div>}
                </StudioRecord>
              ))}
            </div>
          ))}
      </StudioIndex>

      <StudioDetail>
        {!liveSelected ? (
          <StudioEmpty title="Select a chronicle entry" body="Choose a period from the timeline wall or create a new one." />
        ) : (
          <div className="max-w-4xl">
            <StudioPageHeader
              eyebrow="Historical record"
              title={liveSelected.title}
              actions={(
                <>
                  <StudioButton tone="secondary" size="sm" onClick={() => { setEditTarget(liveSelected); setShowForm(true) }}>Edit</StudioButton>
                  {linkedTimeline && <StudioButton tone="secondary" size="sm" onClick={() => setLinkedTimelineEdit(linkedTimeline)}>Edit linked</StudioButton>}
                  <StudioButton tone="secondary" size="sm" onClick={() => handleDelete(liveSelected.id)}>Delete</StudioButton>
                </>
              )}
            >
                <div className="flex items-center gap-3 mt-1.5">
                  {liveSelected.era && <span className="text-xs text-[var(--accent)]">{liveSelected.era}</span>}
                  {liveSelected.dateRange && <span className="text-xs text-[var(--text-muted)]">{liveSelected.dateRange}</span>}
                </div>
            </StudioPageHeader>
            {liveSelected.content && (
              <StudioNote className="text-sm text-[var(--text-main)] leading-relaxed whitespace-pre-wrap mb-4">{liveSelected.content}</StudioNote>
            )}
            {linkedTimeline && (
              <div className="linked-entry-panel mb-4">
                <div>
                  <span>Linked timeline</span>
                  <strong>{linkedTimeline.title}</strong>
                  <small>{linkedTimeline.date || 'Undated'}</small>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLinkedTimelineEdit(linkedTimeline)}>Edit linked</button>
              </div>
            )}
            {liveSelected.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-3 border-t border-[var(--border)]">
                {liveSelected.tags.map(t => (
                  <span key={t} className="bg-[var(--bg-nav)] border border-[var(--border)] text-[var(--text-muted)] text-xs px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </StudioDetail>

      {showForm && (
        <Modal title={editTarget ? `Edit — ${editTarget.title}` : 'New History Entry'} onClose={closeForm} wide>
          <ChronicleEntryForm
            kind="history"
            initial={editTarget}
            timeline={timeline}
            worldHistory={worldHistory}
            allowKindChoice={!editTarget}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </Modal>
      )}
      {linkedTimelineEdit && (
        <Modal title={`Edit linked — ${linkedTimelineEdit.title}`} onClose={() => setLinkedTimelineEdit(null)} wide>
          <ChronicleEntryForm
            kind="timeline"
            initial={linkedTimelineEdit}
            timeline={timeline}
            worldHistory={worldHistory}
            onSave={(data) => {
              updateEvent(linkedTimelineEdit.id, data)
              setLinkedTimelineEdit(null)
            }}
            onCancel={() => setLinkedTimelineEdit(null)}
          />
        </Modal>
      )}
    </StudioSplit>
  )
}
