import { useMemo, useState } from 'react'

const INPUT = 'field w-full px-3 py-2 text-sm placeholder:text-[var(--text-muted)]'
const LABEL = 'block form-label mb-1.5'

const unique = values => Array.from(new Set((values || []).filter(Boolean)))

export default function ChronicleEntryForm({
  kind = 'timeline',
  initial,
  timeline = [],
  worldHistory = [],
  characters = [],
  locations = [],
  onSave,
  onCancel,
  allowKindChoice = false,
}) {
  const initialKind = initial?.entryKind || kind
  const [entryKind, setEntryKind] = useState(initialKind)
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    date: initial?.date ?? initial?.dateRange ?? '',
    era: initial?.era ?? '',
    description: initial?.description ?? initial?.content ?? '',
    type: initial?.type ?? initial?.category ?? '',
    tags: initial?.tags ?? [],
    linkedTimelineEventId: initial?.linkedTimelineEventId ?? initial?.timelineEventId ?? '',
    linkedHistoryEntryId: initial?.linkedHistoryEntryId ?? initial?.worldHistoryEntryId ?? '',
    linkedCharacters: initial?.linkedCharacters ?? [],
    linkedLocations: initial?.linkedLocations ?? [],
  })
  const [tagInput, setTagInput] = useState('')

  const availableTimeline = useMemo(() => timeline.filter(item => item.id !== initial?.id), [timeline, initial?.id])
  const availableHistory = useMemo(() => worldHistory.filter(item => item.id !== initial?.id), [worldHistory, initial?.id])
  const field = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().replace(/,$/, '')
      if (tag) setForm(prev => ({ ...prev, tags: unique([...prev.tags, tag]) }))
      setTagInput('')
    }
  }
  const toggle = (key, id) => setForm(prev => ({
    ...prev,
    [key]: prev[key].includes(id) ? prev[key].filter(x => x !== id) : [...prev[key], id],
  }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave({
      entryKind,
      title: form.title.trim(),
      date: form.date,
      era: form.era,
      dateRange: form.date,
      description: form.description,
      content: form.description,
      type: form.type,
      category: form.type,
      tags: form.tags,
      linkedTimelineEventId: form.linkedTimelineEventId || null,
      linkedHistoryEntryId: form.linkedHistoryEntryId || null,
      linkedCharacters: form.linkedCharacters,
      linkedLocations: form.linkedLocations,
    })
  }

  const isTimeline = entryKind === 'timeline'
  const isHistory = entryKind === 'history'

  return (
    <form onSubmit={submit} className="space-y-4">
      {allowKindChoice && (
        <div>
          <label className={LABEL}>Create as</label>
          <div className="inline-flex rounded border border-[var(--border)] overflow-hidden">
            {[
              ['timeline', 'Timeline'],
              ['history', 'History'],
              ['linked', 'Linked pair'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setEntryKind(value)}
                className={`px-3 py-1.5 text-xs font-semibold ${entryKind === value ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className={LABEL}>Title *</label>
        <input value={form.title} onChange={field('title')} className={INPUT} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>{isHistory ? 'Date range' : 'Date / Time'}</label>
          <input value={form.date} onChange={field('date')} placeholder="e.g. Year 312, First Month, Ancient Era" className={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Category / Type</label>
          <input value={form.type} onChange={field('type')} placeholder="War, founding, journey…" className={INPUT} />
        </div>
      </div>
      {isHistory || entryKind === 'linked' ? (
        <div>
          <label className={LABEL}>Era / Age</label>
          <input value={form.era} onChange={field('era')} placeholder="e.g. The Second Age" className={INPUT} />
        </div>
      ) : null}
      <div>
        <label className={LABEL}>{isTimeline ? 'Description' : 'Content'}</label>
        <textarea value={form.description} onChange={field('description')} rows={isHistory ? 8 : 5} className={INPUT + ' resize-none'} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isTimeline || entryKind === 'linked' ? (
          <div>
            <label className={LABEL}>Linked history entry</label>
            <select value={form.linkedHistoryEntryId} onChange={field('linkedHistoryEntryId')} className={INPUT}>
              <option value="">None / create new</option>
              {availableHistory.map(item => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>
        ) : null}
        {isHistory || entryKind === 'linked' ? (
          <div>
            <label className={LABEL}>Linked timeline entry</label>
            <select value={form.linkedTimelineEventId} onChange={field('linkedTimelineEventId')} className={INPUT}>
              <option value="">None</option>
              {availableTimeline.map(item => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <div>
        <label className={LABEL}>Tags</label>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {form.tags.map(tag => (
              <span key={tag} className="chip">
                {tag}
                <button type="button" onClick={() => setForm(prev => ({ ...prev, tags: prev.tags.filter(x => x !== tag) }))} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">×</button>
              </span>
            ))}
          </div>
        )}
        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type a tag and press Enter" className={INPUT} />
      </div>
      {characters.length > 0 && isTimeline && (
        <div>
          <label className={LABEL}>Linked characters</label>
          <div className="max-h-28 overflow-y-auto bg-[var(--bg-main)] border border-[var(--border)] rounded p-2 space-y-1.5">
            {characters.map(char => (
              <label key={char.id} className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-main)]">
                <input type="checkbox" checked={form.linkedCharacters.includes(char.id)} onChange={() => toggle('linkedCharacters', char.id)} className="accent-[var(--accent)]" />
                {char.name}
              </label>
            ))}
          </div>
        </div>
      )}
      {locations.length > 0 && isTimeline && (
        <div>
          <label className={LABEL}>Linked locations</label>
          <div className="max-h-28 overflow-y-auto bg-[var(--bg-main)] border border-[var(--border)] rounded p-2 space-y-1.5">
            {locations.map(location => (
              <label key={location.id} className="flex items-center gap-2 text-sm cursor-pointer text-[var(--text-main)]">
                <input type="checkbox" checked={form.linkedLocations.includes(location.id)} onChange={() => toggle('linkedLocations', location.id)} className="accent-[var(--accent)]" />
                {location.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
        <button type="submit" className="btn btn-primary">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm transition-colors">Cancel</button>
      </div>
    </form>
  )
}
