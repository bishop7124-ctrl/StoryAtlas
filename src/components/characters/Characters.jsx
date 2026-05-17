import { useState, useRef } from 'react'
import Modal from '../shared/Modal'
import { FACTION_ICONS } from '../../constants/factionIcons'
import { REL_TYPES } from '../../constants/Constants'
import { StudioSplit, StudioIndex, StudioRecord, StudioDetail, StudioButton, StudioEmpty, StudioPageHeader, StudioNote } from '../presentation/Studio'

// The Fix: uses theme variables so all 4 themes apply correctly
const INPUT = 'field w-full px-3 py-2 text-sm placeholder:text-[var(--text-muted)]'
const LABEL = 'block form-label mb-1.5'

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
    image: initial?.image || '',
    imagePosition: initial?.imagePosition || '50% 50%',
  })
  const [keywordInput, setKeywordInput] = useState('')
  const pickerRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm(prev => ({ ...prev, image: ev.target.result, imagePosition: '50% 50%' }))
    reader.readAsDataURL(file)
  }

  const handlePickerClick = (e) => {
    const rect = pickerRef.current.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    setForm(prev => ({ ...prev, imagePosition: `${x}% ${y}%` }))
  }

  const [isDragging, setIsDragging] = useState(false)

  const handlePickerDrag = (e) => {
    if (!isDragging) return
    const rect = pickerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)))
    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)))
    setForm(prev => ({ ...prev, imagePosition: `${x}% ${y}%` }))
  }

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
        <label className={LABEL}>Character Portrait</label>
        <div className="flex items-center gap-3 mb-3">
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="char-image-upload" />
          <label htmlFor="char-image-upload" className="cursor-pointer text-xs text-[var(--accent)] border border-[var(--accent)]/30 hover:border-[var(--accent)] px-3 py-1.5 rounded transition-colors">
            {form.image ? 'Change Image' : 'Upload Image'}
          </label>
          {form.image && (
            <button type="button" onClick={() => setForm(prev => ({ ...prev, image: '', imagePosition: '50% 50%' }))} className="text-xs text-[var(--text-muted)] hover:text-red-400 transition-colors">Remove</button>
          )}
        </div>
        {form.image && (
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2">Drag or click to set the focal point — this controls what's visible in thumbnails throughout the app.</p>
            <div className="flex gap-4 items-start">
              <div
                ref={pickerRef}
                className="relative flex-1 h-44 rounded-lg overflow-hidden border border-[var(--border)] cursor-crosshair select-none"
                onClick={handlePickerClick}
                onMouseDown={() => setIsDragging(true)}
                onMouseMove={handlePickerDrag}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                <img src={form.image} alt="Portrait" className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: form.imagePosition }} />
                {/* focal point crosshair */}
                <div
                  className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: form.imagePosition.split(' ')[0], top: form.imagePosition.split(' ')[1] }}
                >
                  <div className="absolute inset-0 rounded-full border-2 border-white shadow-lg" />
                  <div className="absolute top-1/2 left-0 w-full h-px bg-white/80 -translate-y-1/2" />
                  <div className="absolute left-1/2 top-0 h-full w-px bg-white/80 -translate-x-1/2" />
                </div>
              </div>
              {/* live previews */}
              <div className="flex flex-col gap-3 items-center flex-shrink-0">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] text-center mb-1">Thumbnail</p>
                  <img src={form.image} alt="" className="w-10 h-10 rounded-full object-cover border border-[var(--border)]" style={{ objectPosition: form.imagePosition }} />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] text-center mb-1">Card</p>
                  <img src={form.image} alt="" className="w-16 h-20 rounded-lg object-cover border border-[var(--border)]" style={{ objectPosition: form.imagePosition }} />
                </div>
              </div>
            </div>
          </div>
        )}
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
    <StudioSplit variant="dossier">
      <StudioIndex
        title="Characters"
        tools={<StudioButton tone="primary" size="sm" onClick={() => { setEditTarget(null); setShowForm(true); }}>New</StudioButton>}
      >
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..." className="field w-full px-2 py-1.5 text-xs placeholder:text-[var(--text-muted)]"
          />
          {filtered.map(c => (
            <StudioRecord
              key={c.id}
              onClick={() => setSelectedCharacterId(c.id)}
              active={selectedCharacterId === c.id}
            >
              <div className="flex items-center gap-2.5">
                {c.image ? (
                  <img src={c.image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[var(--border)]" style={{ objectPosition: c.imagePosition || '50% 50%' }} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-fade)] border border-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-[var(--accent)]">{c.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-[var(--text-main)]">{c.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{c.role || 'Supporting'}</div>
                </div>
              </div>
            </StudioRecord>
          ))}
      </StudioIndex>

      <StudioDetail>
        {!selected ? (
          <StudioEmpty title="Select a dossier" body="Choose a character from the characters list." />
        ) : (
          <div className="max-w-5xl">
            <StudioPageHeader
              eyebrow="Character dossier"
              title={selected.name}
              meta={selected.role || 'Character'}
              actions={(
                <>
                  <StudioButton tone="secondary" size="sm" onClick={() => { setEditTarget(selected); setShowForm(true); }}>Edit</StudioButton>
                  <StudioButton tone="secondary" size="sm" onClick={() => { if(confirm("Delete?")) { deleteCharacter(selected.id); setSelectedCharacterId(null); } }}>Delete</StudioButton>
                </>
              )}
            >
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {selected.image && (
                  <img src={selected.image} alt={selected.name} className="w-24 h-24 rounded-xl object-cover border border-[var(--border)] flex-shrink-0" style={{ objectPosition: selected.imagePosition || '50% 50%' }} />
                )}
                {getFactionIconUrl(selected) && (
                  <img src={getFactionIconUrl(selected)} alt="Faction Icon" className="w-10 h-10 opacity-60 flex-shrink-0" />
                )}
                {selected.familyGroup && (
                  <span className="chip">House {selected.familyGroup}</span>
                )}
                {selected.factionId && factions.find(f => f.id === selected.factionId) && (
                  <span className="chip chip-accent">
                    {factions.find(f => f.id === selected.factionId).name}
                  </span>
                )}
              </div>
            </StudioPageHeader>
            <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
              {selected.keywords?.length > 0 && (
                <StudioNote>
                  <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">Manuscript Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.keywords.map(kw => (
                      <span key={kw} className="bg-[var(--accent-fade)] border border-[var(--accent)]/30 text-[var(--accent)] px-2 py-0.5 rounded text-xs">{kw}</span>
                    ))}
                  </div>
                </StudioNote>
              )}
              <StudioNote className={selected.keywords?.length > 0 ? '' : 'lg:col-span-2'}>
                <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4">Biography</h3>
                <p className="text-[var(--text-main)] whitespace-pre-wrap leading-relaxed text-lg">{selected.bio || "No biography provided."}</p>
              </StudioNote>
            </div>
          </div>
        )}
      </StudioDetail>

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
    </StudioSplit>
  )
}
