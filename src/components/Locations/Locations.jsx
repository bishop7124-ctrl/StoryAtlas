import { useState } from 'react'
import Modal from '../shared/Modal'

// The Fix: uses theme variables so all 4 themes apply correctly
const CATS = ['Kingdom/Region', 'City', 'Town', 'Village', 'Landmark', 'Ruins', 'Feature', 'Other']
const IN = 'w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none placeholder:text-[var(--text-muted)]'

function LocationForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    category: initial?.category ?? '',
    description: initial?.description ?? '',
    tags: initial?.tags ?? [],
  })
  const [tagInput, setTagInput] = useState('')

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().replace(/,$/, '')
      if (t && !form.tags.includes(t)) setForm(p => ({ ...p, tags: [...p.tags, t] }))
      setTagInput('')
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="space-y-4 text-left">
      <div>
        <label className="text-xs text-[var(--text-muted)]">Name</label>
        <input value={form.name} onChange={e=>setForm(p=>({...p, name:e.target.value}))} className={IN} required />
      </div>
      <div>
        <label className="text-xs text-[var(--text-muted)]">Category</label>
        <select value={form.category} onChange={e=>setForm(p=>({...p, category:e.target.value}))} className={IN}>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-[var(--text-muted)]">Description</label>
        <textarea value={form.description} onChange={e=>setForm(p=>({...p, description:e.target.value}))} rows={6} className={IN + ' resize-none'} />
      </div>
      <div>
        <label className="text-xs text-[var(--text-muted)]">Tags</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {form.tags.map(t => (
            <span key={t} className="bg-[var(--bg-nav)] border border-[var(--border)] px-2 py-0.5 rounded text-xs text-[var(--text-main)] flex items-center gap-1">
              {t}
              <button type="button" onClick={()=>setForm(p=>({...p, tags:p.tags.filter(x=>x!==t)}))}>×</button>
            </span>
          ))}
        </div>
        <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={addTag} className={IN} placeholder="Enter tags..." />
      </div>
      <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
        <button type="submit" className="flex-1 py-2 bg-[var(--accent)] text-[var(--bg-main)] font-bold rounded">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-[var(--text-muted)]">Cancel</button>
      </div>
    </form>
  )
}

export default function Locations({ store }) {
  const { locations, saveLocation, deleteLocation, selectedLocationId, setSelectedLocationId } = store
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const filtered = (locations || []).filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
  const selected = (locations || []).find(l => l.id === selectedLocationId)

  return (
    <div className="flex h-full bg-[var(--bg-main)]">
      <div className="w-64 border-r border-[var(--border)] flex flex-col bg-[var(--bg-nav)]/20 text-left">
        <div className="p-3 border-b border-[var(--border)] space-y-2">
          <div className="flex justify-between items-center text-[var(--text-main)]">
            <h2 className="text-sm font-bold">Atlas</h2>
            <button onClick={()=>{setEditTarget(null);setShowForm(true)}} className="text-xs text-[var(--accent)] hover:opacity-80">+ New</button>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)]" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(l => (
            <button
              key={l.id}
              onClick={()=>setSelectedLocationId(l.id)}
              className={`w-full text-left px-4 py-3 border-b border-[var(--border)] transition-all ${selectedLocationId===l.id ? 'bg-[var(--bg-hover)] border-l-2 border-[var(--accent)]' : 'hover:bg-[var(--bg-hover)]'}`}
            >
              <div className="text-sm font-medium text-[var(--text-main)]">{l.name}</div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{l.category}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto text-left">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-[var(--text-muted)] italic">Select a location from the map or list</div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex justify-between items-start mb-6 text-left">
              <div>
                <h1 className="text-3xl font-bold text-[var(--text-main)]">{selected.name}</h1>
                <span className="inline-block mt-2 px-2 py-0.5 bg-[var(--accent-fade)] text-[var(--accent)] text-xs font-bold rounded border border-[var(--accent)]/20">{selected.category}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{setEditTarget(selected);setShowForm(true)}} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors px-2 py-1 border border-[var(--border)] rounded">Edit</button>
                <button onClick={()=>{if(confirm("Delete?")) { deleteLocation(selected.id); setSelectedLocationId(null) }}} className="text-xs text-red-500/60 hover:text-red-500 transition-colors px-2 py-1 border border-[var(--border)] rounded">Delete</button>
              </div>
            </div>
            <p className="text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">{selected.description || 'No description provided yet.'}</p>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title={editTarget ? "Edit Location" : "New Location"} onClose={() => setShowForm(false)} wide>
          <LocationForm initial={editTarget} onSave={(d) => { saveLocation(d, editTarget?.id); setShowForm(false) }} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}
