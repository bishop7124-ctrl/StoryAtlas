import { useState, useMemo, useEffect } from 'react'

const INPUT = 'w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none transition-colors placeholder:text-[var(--text-muted)]'
const LABEL = 'block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1.5'

const SUGGESTED_CATEGORIES = ['Magic System', 'Religion', 'History', 'Politics', 'Geography', 'Culture', 'Technology', 'Prophecy', 'Mythology', 'Other']

function EntryForm({ entry, onSave, onCancel, characters, existingCategories }) {
  const [form, setForm] = useState({
    title: entry?.title || '',
    category: entry?.category || '',
    content: entry?.content || '',
    characterIds: entry?.characterIds || [],
  })
  const [catInput, setCatInput] = useState(entry?.category || '')

  const allCategories = useMemo(() => {
    const merged = [...new Set([...SUGGESTED_CATEGORIES, ...existingCategories])]
    return merged
  }, [existingCategories])

  const toggleCharacter = (id) => {
    setForm(prev => ({
      ...prev,
      characterIds: prev.characterIds.includes(id)
        ? prev.characterIds.filter(c => c !== id)
        : [...prev.characterIds, id],
    }))
  }

  return (
    <form
      onSubmit={e => { e.preventDefault(); onSave({ ...form, category: catInput.trim() }) }}
      className="space-y-4 text-left"
    >
      <div>
        <label className={LABEL}>Title</label>
        <input
          className={INPUT}
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. The Binding Laws"
          required
        />
      </div>

      <div>
        <label className={LABEL}>Category</label>
        <input
          className={INPUT}
          list="lore-categories"
          value={catInput}
          onChange={e => setCatInput(e.target.value)}
          placeholder="e.g. Magic System"
        />
        <datalist id="lore-categories">
          {allCategories.map(c => <option key={c} value={c} />)}
        </datalist>
      </div>

      <div>
        <label className={LABEL}>Content</label>
        <textarea
          className={INPUT + ' resize-none h-48'}
          value={form.content}
          onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
          placeholder="Describe this aspect of your world..."
        />
      </div>

      <div>
        <label className={LABEL}>Linked Characters</label>
        {characters.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No characters yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {characters.map(c => {
              const active = form.characterIds.includes(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCharacter(c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? 'bg-[var(--accent-fade)] border-[var(--accent)]/40 text-[var(--accent)]'
                      : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--accent)]/30'
                  }`}
                >
                  {active && <span className="mr-1 opacity-70">✓</span>}
                  {c.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
        <button type="submit" className="flex-1 bg-[var(--accent)] text-[var(--bg-main)] font-bold py-2 rounded hover:opacity-90">
          Save Entry
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-main)]">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function Lore({ store }) {
  const { currentYear, updateCurrentYear, loreEntries, addLoreEntry, updateLoreEntry, deleteLoreEntry, characters } = store
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const selected = loreEntries.find(e => e.id === selectedId) ?? null

  // Clear selection if deleted
  useEffect(() => {
    if (selectedId && !loreEntries.find(e => e.id === selectedId)) {
      setSelectedId(null)
      setEditing(false)
    }
  }, [loreEntries, selectedId])

  const existingCategories = useMemo(
    () => [...new Set(loreEntries.map(e => e.category).filter(Boolean))],
    [loreEntries]
  )

  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = loreEntries.filter(e =>
      !q || e.title.toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q) || (e.content || '').toLowerCase().includes(q)
    )
    const groups = {}
    filtered.forEach(e => {
      const cat = e.category || 'Uncategorized'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(e)
    })
    return groups
  }, [loreEntries, search])

  const handleNew = () => {
    setEditTarget(null)
    setEditing(true)
    setSelectedId(null)
  }

  const handleEdit = () => {
    setEditTarget(selected)
    setEditing(true)
  }

  const handleSave = (data) => {
    if (editTarget) {
      updateLoreEntry(editTarget.id, data)
      setSelectedId(editTarget.id)
    } else {
      const entry = addLoreEntry(data)
      setSelectedId(entry.id)
    }
    setEditing(false)
    setEditTarget(null)
  }

  const handleDelete = () => {
    if (!selected) return
    if (!confirm(`Delete "${selected.title}"?`)) return
    deleteLoreEntry(selected.id)
    setSelectedId(null)
  }

  const handleCharacterNav = (charId) => {
    store.setSelectedCharacterId(charId)
    window.dispatchEvent(new CustomEvent('switch-section', { detail: { section: 'characters' } }))
  }

  return (
    <div className="flex h-full bg-[var(--bg-main)] text-left overflow-hidden">

      {/* Left sidebar */}
      <div className="w-64 bg-[var(--bg-nav)]/40 border-r border-[var(--border)] flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-[var(--border)] space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-main)]">Lore</h2>
            <button
              onClick={handleNew}
              className="text-xs text-[var(--accent)] font-bold hover:opacity-80"
            >
              + NEW
            </button>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Chronology widget */}
        <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">Story Year</span>
          <input
            type="number"
            value={currentYear}
            onChange={e => updateCurrentYear(e.target.value)}
            className="bg-[var(--bg-main)] border border-[var(--border)] text-[var(--accent)] font-mono px-2 py-0.5 rounded w-20 text-xs outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {Object.keys(grouped).length === 0 && (
            <p className="text-xs text-[var(--text-muted)] italic px-4 py-3">
              {search ? 'No results.' : 'No lore entries yet.'}
            </p>
          )}
          {Object.entries(grouped).map(([cat, entries]) => (
            <div key={cat} className="mb-3">
              <div className="px-3 py-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] opacity-70">{cat}</span>
              </div>
              {entries.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => { setSelectedId(entry.id); setEditing(false) }}
                  className={`w-full text-left px-4 py-2.5 border-b border-[var(--border)] transition-all ${
                    selectedId === entry.id
                      ? 'bg-[var(--accent-fade)] border-l-2 border-l-[var(--accent)]'
                      : 'hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <div className="text-sm font-medium text-[var(--text-main)] truncate">{entry.title}</div>
                  {entry.characterIds?.length > 0 && (
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {entry.characterIds.length} character{entry.characterIds.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-y-auto p-10">
        {editing ? (
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-[var(--text-main)] mb-6">
              {editTarget ? `Edit: ${editTarget.title}` : 'New Lore Entry'}
            </h2>
            <EntryForm
              entry={editTarget}
              onSave={handleSave}
              onCancel={() => { setEditing(false); setEditTarget(null) }}
              characters={characters}
              existingCategories={existingCategories}
            />
          </div>
        ) : selected ? (
          <div className="max-w-2xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-bold text-[var(--text-main)]">{selected.title}</h1>
                {selected.category && (
                  <span className="inline-block mt-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-fade)] border border-[var(--accent)]/20 px-2.5 py-1 rounded-full">
                    {selected.category}
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-4">
                <button
                  onClick={handleEdit}
                  className="text-xs text-[var(--text-muted)] border border-[var(--border)] px-3 py-1 rounded hover:text-[var(--text-main)] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-500/60 border border-[var(--border)] px-3 py-1 rounded hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="border-t border-[var(--border)] pt-8 space-y-8">
              <div>
                <p className="text-[var(--text-main)] whitespace-pre-wrap leading-relaxed text-lg">
                  {selected.content || <span className="italic text-[var(--text-muted)]">No content yet.</span>}
                </p>
              </div>

              {/* Linked Characters */}
              {selected.characterIds?.length > 0 && (
                <div>
                  <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">Linked Characters</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.characterIds.map(cid => {
                      const char = characters.find(c => c.id === cid)
                      if (!char) return null
                      return (
                        <button
                          key={cid}
                          onClick={() => handleCharacterNav(cid)}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--accent-fade)] border border-[var(--accent)]/30 text-[var(--accent)] hover:opacity-80 transition-opacity"
                        >
                          {char.name}
                          {char.role && <span className="ml-1 opacity-60">· {char.role}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-[var(--text-muted)] italic">Select an entry or create a new one</p>
            <button
              onClick={handleNew}
              className="text-xs font-bold text-[var(--accent)] border border-[var(--accent)]/30 px-4 py-2 rounded hover:bg-[var(--accent-fade)] transition-colors"
            >
              + New Lore Entry
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
