import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { submitFeedback } from '../../utils/feedback'
import { supabase } from '../../supabase'

// ─── Roadmap data ──────────────────────────────────────────────────────────────

const ROADMAP = [
  {
    phase: 'Now — Live',
    status: 'live',
    items: [
      'Manuscript editor with chapters, scenes, and acts',
      'Character profiles, relationship maps, family trees, and factions',
      'World-building: locations, maps, lore, timeline, world history',
      'Story outline and beat planning',
      'Ideas board and writing schedule',
      'Project dashboard with word counts and progress stats',
      'AI assistant with context-aware creative suggestions',
      'Themes, fonts, and full appearance customisation',
      'Cookie consent, privacy controls, and account preferences',
    ],
  },
  {
    phase: 'Up Next — Q3 2026',
    status: 'next',
    items: [
      'Export to PDF, ePub, and Final Draft formats',
      'Image upload for character portraits and location art',
      'Improved mobile layout and touch experience',
      'Revision history and version snapshots for manuscripts',
    ],
  },
  {
    phase: 'Later — Q4 2026',
    status: 'planned',
    items: [
      'Collaboration mode — invite co-authors to a project',
      'Series management and cross-project character/location references',
      'Writing sprints and community goals',
      'Template library for common story structures',
    ],
  },
  {
    phase: 'Exploring',
    status: 'exploring',
    items: [
      'Voice dictation for manuscript drafting',
      'Integration with publishing platforms',
      'AI-assisted developmental editing feedback',
      'Native desktop app (Mac / Windows)',
    ],
  },
]

const STATUS_COLORS = {
  live:      { dot: '#5dc878', label: 'Live', bg: 'rgba(93,200,120,0.1)',  border: 'rgba(93,200,120,0.25)' },
  next:      { dot: '#5bb7d9', label: 'Up next', bg: 'rgba(91,183,217,0.1)', border: 'rgba(91,183,217,0.25)' },
  planned:   { dot: '#a78bfa', label: 'Planned', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
  exploring: { dot: '#e3a84f', label: 'Exploring', bg: 'rgba(227,168,79,0.1)', border: 'rgba(227,168,79,0.25)' },
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────

function AboutTab() {
  return (
    <div style={{ maxWidth: 560 }}>
      <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>Your Own World</p>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)', marginBottom: 16, lineHeight: 1.3, fontFamily: 'var(--font-serif, Georgia, serif)' }}>
        A focused workspace for story worlds.
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 20 }}>
        Your Own World is a creative platform built for writers who need more than a blank document. It keeps your manuscript, characters, maps, lore, timelines, and story structure in one interconnected workspace, so you can stay inside the world you're building rather than juggling separate tools.
      </p>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.75, marginBottom: 28 }}>
        The AI assistant is built directly into each section of the studio — not a chatbot bolted on the side, but a context-aware collaborator that knows which character you're working on, which chapter you're in, and what your world's lore says. It's there when you need it and out of the way when you don't.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Draft', desc: 'Full manuscript editor with scenes, chapters, and acts.' },
          { label: 'Plan', desc: 'Outlines, beat boards, idea capture, and writing schedules.' },
          { label: 'Cast', desc: 'Character dossiers, relationships, factions, and family trees.' },
          { label: 'World', desc: 'Locations, lore, maps, timelines, and world history.' },
          { label: 'Track', desc: 'Word counts, pacing, goals, and project momentum.' },
          { label: 'Assist', desc: 'AI that knows your project and helps at every step.' },
        ].map(({ label, desc }) => (
          <div key={label} style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-main)' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-main)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)', marginBottom: 3 }}>Made by writers, for writers</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Your Own World is built by a small team that writes. We use YOW ourselves. Use the <strong style={{ color: 'var(--text-main)' }}>Feature Request</strong> tab above to send us ideas, or the <strong style={{ color: 'var(--text-main)' }}>Help &amp; Support</strong> option in your account menu for direct assistance.
          </p>
        </div>
      </div>
    </div>
  )
}

function shapeRows(rows) {
  const map = new Map()
  for (const row of rows) {
    if (!map.has(row.phase_key)) {
      map.set(row.phase_key, { phase: row.phase_label, status: row.phase_key, phaseOrder: row.phase_order, items: [] })
    }
    map.get(row.phase_key).items.push(row.text)
  }
  return Array.from(map.values()).sort((a, b) => a.phaseOrder - b.phaseOrder)
}

function RoadmapTab() {
  const { isAdmin } = useAuth()
  const [data, setData]         = useState(ROADMAP)
  const [dbLoaded, setDbLoaded] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState('')

  // Load from Supabase; fall back to hardcoded ROADMAP if table is empty / not yet created
  useEffect(() => {
    supabase
      .from('roadmap_items')
      .select('*')
      .order('phase_order', { ascending: true })
      .order('item_order',  { ascending: true })
      .then(({ data: rows, error }) => {
        if (!error && rows && rows.length > 0) setData(shapeRows(rows))
        setDbLoaded(true)
      })
  }, [])

  const enterEdit = useCallback(() => {
    setDraft(data.map(p => ({ ...p, items: [...p.items] })))
    setSaveError('')
    setEditMode(true)
  }, [data])

  const cancelEdit = () => { setEditMode(false); setDraft(null); setSaveError('') }

  const updatePhaseLabel = (pi, val) =>
    setDraft(d => d.map((p, i) => i === pi ? { ...p, phase: val } : p))

  const updateItem = (pi, ii, val) =>
    setDraft(d => d.map((p, i) => i !== pi ? p : { ...p, items: p.items.map((it, j) => j === ii ? val : it) }))

  const deleteItem = (pi, ii) =>
    setDraft(d => d.map((p, i) => i !== pi ? p : { ...p, items: p.items.filter((_, j) => j !== ii) }))

  const addItem = (pi) =>
    setDraft(d => d.map((p, i) => i !== pi ? p : { ...p, items: [...p.items, ''] }))

  const save = async () => {
    setSaving(true)
    setSaveError('')
    try {
      // Replace all rows: delete everything, then re-insert current draft
      const { error: delErr } = await supabase
        .from('roadmap_items')
        .delete()
        .gte('phase_order', 0)
      if (delErr) throw delErr

      const rows = []
      draft.forEach((phase, pi) => {
        phase.items.forEach((text, ii) => {
          if (text.trim()) rows.push({
            phase_key:   phase.status,
            phase_label: phase.phase,
            phase_order: pi,
            text:        text.trim(),
            item_order:  ii,
          })
        })
      })

      if (rows.length > 0) {
        const { error: insErr } = await supabase.from('roadmap_items').insert(rows)
        if (insErr) throw insErr
      }

      setData(draft.map(p => ({ ...p, items: p.items.filter(t => t.trim()) })))
      setEditMode(false)
      setDraft(null)
    } catch (err) {
      setSaveError(err.message || 'Save failed — please try again.')
    } finally {
      setSaving(false)
    }
  }

  const displayData = editMode ? draft : data

  // ── Input style shared across edit fields ──
  const inputStyle = {
    background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 5, padding: '5px 9px', fontSize: 13, color: 'var(--text-main)',
    fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: 620 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          This is our honest, public roadmap. It's a commitment to transparency, not a marketing calendar — dates may shift and priorities change based on what we learn from writers using the product.
        </p>
        {isAdmin && !editMode && (
          <button
            type="button"
            onClick={enterEdit}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: 11,
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            ✎ Edit
          </button>
        )}
      </div>

      {/* Edit mode toolbar */}
      {editMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          padding: '10px 14px', borderRadius: 8, background: 'rgba(91,183,217,0.08)',
          border: '1px solid rgba(91,183,217,0.25)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
            Editing roadmap — changes save to the database and are immediately public.
          </span>
          <button
            type="button"
            onClick={cancelEdit}
            disabled={saving}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'var(--bg-main)', fontSize: 12, fontWeight: 800, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      )}

      {saveError && (
        <p style={{ fontSize: 12, color: 'var(--danger, #ef4444)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 16 }}>
          {saveError}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {displayData.map(({ phase, status, items }, pi) => {
          const sc = STATUS_COLORS[status]
          return (
            <div key={status} style={{ border: `1px solid ${sc.border}`, borderRadius: 10, background: sc.bg, overflow: 'hidden' }}>

              {/* Phase header */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${sc.border}` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: sc.dot, flexShrink: 0 }}>{sc.label}</p>
                {editMode ? (
                  <input
                    value={phase}
                    onChange={e => updatePhaseLabel(pi, e.target.value)}
                    placeholder="Phase label…"
                    style={{ ...inputStyle, fontSize: 12, fontWeight: 700, marginLeft: 4 }}
                  />
                ) : (
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginLeft: 4 }}>{phase}</p>
                )}
              </div>

              {/* Items */}
              <ul style={{ padding: '12px 16px 14px 16px', margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {items.map((item, ii) => (
                  <li key={ii} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!editMode && <span style={{ color: sc.dot, flexShrink: 0, fontSize: 10 }}>◆</span>}
                    {editMode ? (
                      <>
                        <input
                          value={item}
                          onChange={e => updateItem(pi, ii, e.target.value)}
                          placeholder="Item text…"
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={() => deleteItem(pi, ii)}
                          title="Remove item"
                          style={{ flexShrink: 0, background: 'none', border: 'none', color: 'rgba(239,68,68,0.7)', fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item}</span>
                    )}
                  </li>
                ))}

                {/* Add item button — edit mode only */}
                {editMode && (
                  <li>
                    <button
                      type="button"
                      onClick={() => addItem(pi)}
                      style={{
                        marginTop: 4, background: 'none', border: `1px dashed ${sc.border}`,
                        borderRadius: 5, color: sc.dot, fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'inherit', padding: '5px 12px', width: '100%',
                      }}
                    >
                      + Add item
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )
        })}
      </div>

      {!dbLoaded && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 16, opacity: 0.5 }}>Loading…</p>
      )}
    </div>
  )
}

function FeatureRequestTab() {
  const { user } = useAuth()
  const [form, setForm] = useState({ title: '', description: '', category: 'feature', email: '' })
  const [status, setStatus] = useState('idle') // 'idle' | 'sending' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  const update = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')
    try {
      await submitFeedback({
        type:     'feature_request',
        title:    form.title,
        message:  form.description,
        category: form.category,
        email:    user?.email || form.email || null,
        userId:   user?.id || null,
      })
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  const fieldStyle = {
    width: '100%', background: 'var(--bg-main)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '9px 12px', fontSize: 13,
    color: 'var(--text-main)', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
    textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6,
  }

  if (status === 'done') {
    return (
      <div style={{ maxWidth: 480, textAlign: 'center', padding: '40px 0' }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>Request received — thank you!</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 20 }}>
          We read every request. Popular ideas get moved to the roadmap.
        </p>
        <button
          type="button"
          onClick={() => { setStatus('idle'); setForm({ title: '', description: '', category: 'feature', email: '' }) }}
          style={{ padding: '9px 20px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'var(--bg-main)', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
        Have an idea for a feature, or something that should work differently? We read every request and use them to shape the roadmap.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label>
          <span style={labelStyle}>Feature title</span>
          <input
            type="text"
            required
            placeholder="Short name for your idea"
            value={form.title}
            onChange={update('title')}
            style={fieldStyle}
          />
        </label>

        <label>
          <span style={labelStyle}>Category</span>
          <select value={form.category} onChange={update('category')} style={fieldStyle}>
            <option value="feature">New feature</option>
            <option value="improvement">Improvement to existing feature</option>
            <option value="ai">AI assistant</option>
            <option value="accessibility">Accessibility</option>
            <option value="export">Export / import</option>
            <option value="mobile">Mobile experience</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label>
          <span style={labelStyle}>Description</span>
          <textarea
            required
            placeholder="Describe the feature and why it would help your writing process…"
            value={form.description}
            onChange={update('description')}
            rows={5}
            style={{ ...fieldStyle, resize: 'vertical', minHeight: 96 }}
          />
        </label>

        {/* Email field only for logged-out users */}
        {!user && (
          <label>
            <span style={labelStyle}>Your email (optional)</span>
            <input
              type="email"
              placeholder="so we can follow up if needed"
              value={form.email}
              onChange={update('email')}
              style={fieldStyle}
            />
          </label>
        )}

        {status === 'error' && (
          <p style={{ fontSize: 12, color: 'var(--danger, #ef4444)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 12px' }}>
            {errorMsg}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              padding: '9px 20px', borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: 'var(--bg-main)',
              fontSize: 12, fontWeight: 800, cursor: status === 'sending' ? 'default' : 'pointer',
              opacity: status === 'sending' ? 0.7 : 1, fontFamily: 'inherit',
            }}
          >
            {status === 'sending' ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'about', label: 'About' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'request', label: 'Feature Request' },
]

export default function AboutPage({ open, onClose }) {
  const [tab, setTab] = useState('about')

  if (!open) return null

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{
        background: 'var(--bg-nav)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        width: 'min(760px, 100%)',
        maxHeight: 'min(820px, calc(100vh - 48px))',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 50px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 2 }}>Your Own World</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>About Your Own World</p>
            </div>
            <div style={{ display: 'flex', gap: 2, marginLeft: 8 }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 6,
                    border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: tab === t.id ? 'var(--accent-fade)' : 'transparent',
                    color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '2px 4px' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
          {tab === 'about'   && <AboutTab />}
          {tab === 'roadmap' && <RoadmapTab />}
          {tab === 'request' && <FeatureRequestTab />}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>© 2026 YourOwnWorld. All rights reserved.</p>
          <a href="mailto:support@yourownworld.co.uk" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>support@yourownworld.co.uk</a>
        </div>
      </div>
    </div>
  )
}
