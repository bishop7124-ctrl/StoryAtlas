import { useState } from 'react'
import Modal from '../shared/Modal'
import { FACTION_ICONS } from '../../constants/factionIcons'
import { REL_TYPES } from '../../constants/Constants'

// The Fix: uses theme variables so all 4 themes apply correctly
const INPUT = 'w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:border-[var(--accent)] outline-none transition-colors placeholder:text-[var(--text-muted)]'
const LABEL = 'block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1.5'

function CharacterForm({ initial, onSave, onCancel, factions, characters }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    familyGroup: initial?.familyGroup || '',
    factionId: initial?.factionId || '',
    role: initial?.role || '',
    bio: initial?.bio || '',
    birthDate: initial?.birthDate || '',
    deathDate: initial?.deathDate || '',
    parentIds: initial?.parentIds || [],
    spouseIds: initial?.spouseIds || [],
    relationships: initial?.relationships || [],
    keywords: initial?.keywords || [],
  })
  const [keywordInput, setKeywordInput] = useState('')

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))
  const toggleArrayValue = (field, value) => {
    setForm(prev => {
      const values = prev[field] || []
      return {
        ...prev,
        [field]: values.includes(value)
          ? values.filter(v => v !== value)
          : [...values, value],
      }
    })
  }
  const upsertRelationship = (index, patch) => {
    setForm(prev => {
      const next = [...prev.relationships]
      next[index] = { ...next[index], ...patch }
      return { ...prev, relationships: next }
    })
  }
  const removeRelationship = (index) => {
    setForm(prev => ({
      ...prev,
      relationships: prev.relationships.filter((_, i) => i !== index),
    }))
  }
  const addRelationship = () => {
    setForm(prev => ({
      ...prev,
      relationships: [...prev.relationships, { targetId: '', type: 'ally' }],
    }))
  }

  const addKeyword = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && keywordInput.trim()) {
      e.preventDefault()
      const kw = keywordInput.trim().replace(/,$/, '')
      if (kw && !form.keywords.includes(kw)) setForm(prev => ({ ...prev, keywords: [...prev.keywords, kw] }))
      setKeywordInput('')
    }
  }
  const removeKeyword = (kw) => setForm(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }))
  const relationshipTargets = characters.filter(c => c.id !== initial?.id)
  const validRelationships = form.relationships.filter(r => r.targetId && r.type)

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, relationships: validRelationships }); }} className="space-y-4 text-left">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={LABEL}>Full Name</label>
          <input className={INPUT} value={form.name} onChange={handleChange('name')} required />
        </div>

        <div className="col-span-1">
          <label className={LABEL}>Family Group</label>
          <input className={INPUT} value={form.familyGroup} onChange={handleChange('familyGroup')} placeholder="e.g. Stark, Lannister" />
        </div>

        <div className="col-span-1">
          <label className={LABEL}>Faction / Allegiance</label>
          <select className={INPUT} value={form.factionId} onChange={handleChange('factionId')}>
            <option value="">No Faction</option>
            {factions.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className={LABEL}>Role / Title</label>
          <input className={INPUT} value={form.role} onChange={handleChange('role')} placeholder="e.g. Protagonist, Knight, Merchant" />
        </div>

        <div>
          <label className={LABEL}>Birth Date</label>
          <input className={INPUT} value={form.birthDate} onChange={handleChange('birthDate')} placeholder="Year 42" />
        </div>
        <div>
          <label className={LABEL}>Death Date (Optional)</label>
          <input className={INPUT} value={form.deathDate} onChange={handleChange('deathDate')} placeholder="Year 98" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 border border-[var(--border)] rounded p-3">
        <div>
          <label className={LABEL}>Parents</label>
          <div className="max-h-28 overflow-y-auto space-y-1 text-sm bg-[var(--bg-main)] border border-[var(--border)] rounded p-2">
            {relationshipTargets.length === 0 && <p className="text-[var(--text-muted)] text-xs">No other characters yet.</p>}
            {relationshipTargets.map(c => (
              <label key={`parent-${c.id}`} className="flex items-center gap-2 text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={form.parentIds.includes(c.id)}
                  onChange={() => toggleArrayValue('parentIds', c.id)}
                  className="accent-[var(--accent)]"
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL}>Spouses / Partners</label>
          <div className="max-h-28 overflow-y-auto space-y-1 text-sm bg-[var(--bg-main)] border border-[var(--border)] rounded p-2">
            {relationshipTargets.length === 0 && <p className="text-[var(--text-muted)] text-xs">No other characters yet.</p>}
            {relationshipTargets.map(c => (
              <label key={`spouse-${c.id}`} className="flex items-center gap-2 text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={form.spouseIds.includes(c.id)}
                  onChange={() => toggleArrayValue('spouseIds', c.id)}
                  className="accent-[var(--accent)]"
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={LABEL}>Biography</label>
        <textarea className={INPUT + ' h-48 resize-none'} value={form.bio} onChange={handleChange('bio')} placeholder="Describe their history..." />
      </div>

      <div>
        <label className={LABEL}>Manuscript Keywords</label>
        <p className="text-xs text-[var(--text-muted)] mb-2">Nicknames or aliases that link to this character in the manuscript. Press Enter or comma to add.</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {form.keywords.map(kw => (
            <span key={kw} className="bg-[var(--accent-fade)] border border-[var(--accent)]/30 text-[var(--accent)] px-2 py-0.5 rounded text-xs flex items-center gap-1">
              {kw}
              <button type="button" onClick={() => removeKeyword(kw)} className="opacity-60 hover:opacity-100 leading-none">×</button>
            </span>
          ))}
        </div>
        <input
          className={INPUT}
          value={keywordInput}
          onChange={e => setKeywordInput(e.target.value)}
          onKeyDown={addKeyword}
          placeholder="e.g. The Raven, Lord Blackwood…"
        />
      </div>

      <div className="border border-[var(--border)] rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className={LABEL + ' mb-0'}>Relationship Links</label>
          <button type="button" onClick={addRelationship} className="text-xs text-[var(--accent)] font-bold">+ Add Link</button>
        </div>
        {form.relationships.length === 0 && (
          <p className="text-xs text-[var(--text-muted)]">Add links like allies, enemies, lovers, etc.</p>
        )}
        {form.relationships.map((rel, index) => (
          <div key={`rel-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <select
              className={INPUT}
              value={rel.targetId}
              onChange={(e) => upsertRelationship(index, { targetId: e.target.value })}
            >
              <option value="">Select character</option>
              {relationshipTargets.map(c => (
                <option key={`target-${c.id}`} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className={INPUT}
              value={rel.type}
              onChange={(e) => upsertRelationship(index, { type: e.target.value })}
            >
              {REL_TYPES.filter(t => !t.structural).map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <button type="button" onClick={() => removeRelationship(index)} className="px-3 text-red-400 hover:text-red-300">✕</button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
        <button type="submit" className="flex-1 bg-[var(--accent)] text-[var(--bg-main)] font-bold py-2 rounded hover:opacity-90">
          Save Character
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-[var(--text-muted)]">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function Characters({ store }) {
  const { characters, saveCharacter, deleteCharacter, selectedCharacterId, setSelectedCharacterId, factions } = store
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  const filtered = characters.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const selected = characters.find(c => c.id === selectedCharacterId)

  const handleSave = (formData) => {
    saveCharacter(formData, editTarget?.id || null)
    setShowForm(false)
    setEditTarget(null)
  }

  const getFactionIconUrl = (char) => {
    if (!char || !char.factionId) return null;
    const faction = factions.find(f => f.id === char.factionId);
    if (!faction) return null;
    return FACTION_ICONS.find(i => i.id === faction.iconId)?.url || null;
  }

  return (
    <div className="flex h-full bg-[var(--bg-main)] text-left">
      <div className="w-64 bg-[var(--bg-nav)]/40 border-r border-[var(--border)] flex flex-col">
        <div className="p-3 border-b border-[var(--border)] space-y-2">
          <div className="flex justify-between items-center text-[var(--text-main)]">
            <h2 className="text-sm font-bold uppercase tracking-widest">Characters</h2>
            <button onClick={() => { setEditTarget(null); setShowForm(true); }} className="text-xs text-[var(--accent)] font-bold">+ NEW</button>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..." className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-main)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCharacterId(c.id)}
              className={`w-full text-left px-4 py-3 border-b border-[var(--border)] transition-all ${selectedCharacterId === c.id ? 'bg-[var(--accent-fade)] border-l-2 border-[var(--accent)]' : 'hover:bg-[var(--bg-hover)]'}`}
            >
              <div className="text-sm font-medium text-[var(--text-main)]">{c.name}</div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{c.role || 'Supporting'}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-10 overflow-y-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center text-[var(--text-muted)] italic">Select a character</div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex justify-between items-start mb-6 text-left">
              <div className="flex gap-4">
                {getFactionIconUrl(selected) && (
                  <img src={getFactionIconUrl(selected)} alt="Faction Icon" className="w-14 h-14 opacity-60 mt-1 flex-shrink-0" />
                )}
                <div>
                  <h1 className="text-4xl font-bold text-[var(--text-main)]">{selected.name}</h1>
                  <p className="text-[var(--accent)] font-medium mt-1">{selected.role || 'Character'}</p>

                  <div className="flex gap-3 mt-3">
                    {selected.familyGroup && (
                      <span className="text-[var(--text-muted)] text-xs uppercase bg-[var(--bg-nav)] px-2 py-1 rounded">House {selected.familyGroup}</span>
                    )}
                    {selected.factionId && factions.find(f => f.id === selected.factionId) && (
                      <span className="text-[var(--accent)] text-xs uppercase bg-[var(--accent-fade)] border border-[var(--accent)]/20 px-2 py-1 rounded">
                        {factions.find(f => f.id === selected.factionId).name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => { setEditTarget(selected); setShowForm(true); }} className="text-xs text-[var(--text-muted)] border border-[var(--border)] px-3 py-1 rounded hover:text-[var(--text-main)] transition-colors">Edit</button>
                <button onClick={() => { if(confirm("Delete?")) { deleteCharacter(selected.id); setSelectedCharacterId(null); } }} className="text-xs text-red-500/60 border border-[var(--border)] px-3 py-1 rounded hover:text-red-500 transition-colors">Delete</button>
              </div>
            </div>
            <div className="border-t border-[var(--border)] pt-8 text-left space-y-8">
              {selected.keywords?.length > 0 && (
                <div>
                  <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">Manuscript Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.keywords.map(kw => (
                      <span key={kw} className="bg-[var(--accent-fade)] border border-[var(--accent)]/30 text-[var(--accent)] px-2 py-0.5 rounded text-xs">{kw}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4">Biography</h3>
                <p className="text-[var(--text-main)] whitespace-pre-wrap leading-relaxed text-lg">{selected.bio || "No biography provided."}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <Modal title={editTarget ? `Edit ${editTarget.name}` : "Create Character"} onClose={() => setShowForm(false)} wide>
          <CharacterForm
            initial={editTarget}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
            factions={factions}
            characters={characters}
          />
        </Modal>
      )}
    </div>
  )
}
