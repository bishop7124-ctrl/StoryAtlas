import { useEffect, useState } from 'react'
import Modal from '../shared/Modal'
import { StudioSplit, StudioIndex, StudioRecord, StudioDetail, StudioButton, StudioEmpty, StudioPageHeader, StudioNote } from '../presentation/Studio'

// The Fix: uses theme variables so all 4 themes apply correctly
const INPUT = 'field w-full px-3 py-2 text-sm placeholder:text-[var(--text-muted)]'
const LABEL = 'block form-label mb-1.5'

function HistoryForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    era: initial?.era ?? '',
    dateRange: initial?.dateRange ?? '',
    content: initial?.content ?? '',
    tags: initial?.tags ?? [],
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

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (form.title.trim()) onSave(form) }} className="space-y-4">
      <div>
        <label className={LABEL}>Title *</label>
        <input value={form.title} onChange={field('title')} className={INPUT} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Era / Age</label>
          <input value={form.era} onChange={field('era')} placeholder="e.g. The Second Age" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Date range</label>
          <input value={form.dateRange} onChange={field('dateRange')} placeholder="e.g. Years 100–500" className={INPUT} />
        </div>
      </div>
      <div>
        <label className={LABEL}>Content</label>
        <textarea value={form.content} onChange={field('content')} rows={10} className={INPUT + ' resize-none'} placeholder="Describe what happened during this period…" />
      </div>
      <div>
        <label className={LABEL}>Tags</label>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {form.tags.map(t => (
              <span key={t} className="chip">
                {t}
                <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">×</button>
              </span>
            ))}
          </div>
        )}
        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type a tag and press Enter" className={INPUT} />
      </div>
      <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
        <button type="submit" className="btn btn-primary">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm transition-colors">Cancel</button>
      </div>
    </form>
  )
}

export default function WorldHistory({ store }) {
  const { worldHistory, addHistoryEntry, updateHistoryEntry, deleteHistoryEntry } = store
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

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

  const grouped = filtered.reduce((acc, h) => {
    const era = h.era || 'Unknown Era'
    if (!acc[era]) acc[era] = []
    acc[era].push(h)
    return acc
  }, {})

  const closeForm = () => { setShowForm(false); setEditTarget(null) }

  const handleSave = (data) => {
    if (editTarget) {
      updateHistoryEntry(editTarget.id, data)
      setSelected(prev => prev?.id === editTarget.id ? { ...prev, ...data } : prev)
    } else {
      const entry = addHistoryEntry(data)
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

  return (
    <StudioSplit>
      <StudioIndex
        eyebrow="Chronicle wall"
        title="History"
        tools={<StudioButton tone="primary" size="sm" onClick={() => { setEditTarget(null); setShowForm(true) }}>New</StudioButton>}
      >
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="field w-full px-2.5 py-1.5 text-xs placeholder:text-[var(--text-muted)]" />
          {filtered.length === 0 && (
            <p className="text-[var(--text-muted)] text-xs p-4 text-center">{(worldHistory || []).length === 0 ? 'No entries yet.' : 'No matches.'}</p>
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
          <HistoryForm initial={editTarget} onSave={handleSave} onCancel={closeForm} />
        </Modal>
      )}
    </StudioSplit>
  )
}
