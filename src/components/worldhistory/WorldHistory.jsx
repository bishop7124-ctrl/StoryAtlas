import { useState } from 'react'
import Modal from '../shared/Modal'

// The Fix: uses theme variables so all 4 themes apply correctly
const INPUT = 'w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]'
const LABEL = 'block text-xs text-[var(--text-muted)] mb-1.5'

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
              <span key={t} className="inline-flex items-center gap-1 bg-[var(--bg-nav)] border border-[var(--border)] rounded px-2 py-0.5 text-xs text-[var(--text-main)]">
                {t}
                <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">×</button>
              </span>
            ))}
          </div>
        )}
        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type a tag and press Enter" className={INPUT} />
      </div>
      <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
        <button type="submit" className="px-5 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--bg-main)] font-semibold rounded text-sm transition-colors">Save</button>
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
    <div className="flex h-full bg-[var(--bg-main)]">
      <div className="w-60 bg-[var(--bg-nav)]/40 border-r border-[var(--border)] flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">World History</h2>
            <button onClick={() => { setEditTarget(null); setShowForm(true) }} className="text-xs text-[var(--accent)] border border-[var(--accent)]/30 hover:border-[var(--accent)] px-2 py-1 rounded transition-colors">
              + New
            </button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-2.5 py-1.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-[var(--text-muted)] text-xs p-4 text-center">{(worldHistory || []).length === 0 ? 'No entries yet.' : 'No matches.'}</p>
          )}
          {Object.entries(grouped).map(([era, entries]) => (
            <div key={era}>
              <div className="px-3 py-1.5 text-xs font-medium text-[var(--accent)]/60 uppercase tracking-wider border-b border-[var(--border)] bg-[var(--bg-nav)]/50 sticky top-0">
                {era}
              </div>
              {entries.map(h => (
                <button
                  key={h.id}
                  onClick={() => setSelected((worldHistory || []).find(x => x.id === h.id))}
                  className={`w-full text-left px-3 py-2.5 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors ${liveSelected?.id === h.id ? 'bg-[var(--bg-hover)] border-l-2 border-[var(--accent)] pl-2.5' : ''}`}
                >
                  <div className="text-sm font-medium text-[var(--text-main)] truncate">{h.title}</div>
                  {h.dateRange && <div className="text-xs text-[var(--text-muted)] mt-0.5">{h.dateRange}</div>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!liveSelected ? (
          <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-60">📜</div>
              <p className="text-sm">Select an entry or create one</p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">{liveSelected.title}</h2>
                <div className="flex items-center gap-3 mt-1.5">
                  {liveSelected.era && <span className="text-xs text-[var(--accent)]">{liveSelected.era}</span>}
                  {liveSelected.dateRange && <span className="text-xs text-[var(--text-muted)]">{liveSelected.dateRange}</span>}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => { setEditTarget(liveSelected); setShowForm(true) }} className="text-sm px-3 py-1.5 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] rounded transition-colors">Edit</button>
                <button onClick={() => handleDelete(liveSelected.id)} className="text-sm px-3 py-1.5 border border-[var(--border)] hover:border-red-500 text-[var(--text-muted)] hover:text-red-400 rounded transition-colors">Delete</button>
              </div>
            </div>
            {liveSelected.content && (
              <p className="text-sm text-[var(--text-main)] leading-relaxed whitespace-pre-wrap mb-4">{liveSelected.content}</p>
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
      </div>

      {showForm && (
        <Modal title={editTarget ? `Edit — ${editTarget.title}` : 'New History Entry'} onClose={closeForm} wide>
          <HistoryForm initial={editTarget} onSave={handleSave} onCancel={closeForm} />
        </Modal>
      )}
    </div>
  )
}
