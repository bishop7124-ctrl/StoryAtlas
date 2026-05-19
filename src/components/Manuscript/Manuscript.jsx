import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { getProjectType } from '../../constants/projectTypes'
import StoryOutline from '../outline/StoryOutline'

function useDebounce(callback, delay) {
  const timeoutRef = useRef(null)
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

// ─── Format settings ──────────────────────────────────────────────────────────

const FONTS = [
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Palatino', value: '"Palatino Linotype", Palatino, serif' },
  { label: 'Times', value: '"Times New Roman", Times, serif' },
  { label: 'Garamond', value: 'Garamond, "EB Garamond", serif' },
  { label: 'Courier', value: '"Courier New", Courier, monospace' },
  { label: 'Sans', value: 'system-ui, -apple-system, sans-serif' },
]

const LINE_SPACINGS = [
  { label: '1.5', value: 1.5 },
  { label: '1.75', value: 1.75 },
  { label: '2.0', value: 2 },
  { label: '2.5', value: 2.5 },
]

const INDENT_SIZES = [2, 4, 6, 8]

const DEFAULT_FORMAT = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: 19,
  lineHeight: 2,
  textAlign: 'left',
  autoIndent: false,
  indentSize: 4,
}

function loadFormat() {
  try {
    const s = localStorage.getItem('nf-format-settings')
    return s ? { ...DEFAULT_FORMAT, ...JSON.parse(s) } : DEFAULT_FORMAT
  } catch { return DEFAULT_FORMAT }
}

// ─── Export ──────────────────────────────────────────────────────────────────

async function exportToDocx(novel, acts, chapters, scenes, chapterGlobalNumbers) {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType, PageBreak } = await import('docx')

  const children = []

  children.push(
    new Paragraph({
      children: [new TextRun({ text: novel?.title || 'Untitled', bold: true, size: 56, font: 'Times New Roman' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  )

  const sortedActs = [...acts].sort((a, b) => a.order - b.order)
  let firstAct = true

  sortedActs.forEach(act => {
    const actChapters = chapters.filter(c => c.actId === act.id).sort((a, b) => a.order - b.order)
    if (!actChapters.length) return

    if (!firstAct) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }
    firstAct = false

    children.push(
      new Paragraph({
        text: act.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 240 },
      })
    )

    actChapters.forEach((chap, chapIndex) => {
      const num = chapterGlobalNumbers[chap.id]
      const l2 = 'chapter'
      const isDefault = !chap.title || chap.title.toLowerCase().startsWith(l2)
      const chapTitle = isDefault ? `Chapter ${num}` : `Chapter ${num}: ${chap.title}`

      if (chapIndex > 0) {
        children.push(new Paragraph({ children: [new PageBreak()] }))
      }

      children.push(
        new Paragraph({
          text: chapTitle,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 0, after: 360 },
        })
      )

      const chapScenes = scenes.filter(s => s.chapterId === chap.id).sort((a, b) => a.order - b.order)

      chapScenes.forEach((scene, sceneIndex) => {
        if (sceneIndex > 0) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: '* * *' })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 240, after: 240 },
            })
          )
        }

        const content = scene.content?.trim()
        if (!content) return

        const blocks = content.split(/\n{2,}/)
        blocks.forEach(block => {
          const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
          if (!lines.length) return
          children.push(
            new Paragraph({
              children: [new TextRun({ text: lines.join(' '), font: 'Times New Roman', size: 24 })],
              indent: { firstLine: 720 },
              spacing: { after: 0, line: 360 },
            })
          )
        })
      })
    })
  })

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(novel?.title || 'manuscript').replace(/[^a-z0-9 ]/gi, '_')}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Inline title input ───────────────────────────────────────────────────────

const InlineInput = ({ value, onSave, className, placeholder }) => {
  const [temp, setTemp] = useState(value)
  const saved = useRef(false)
  const commit = () => {
    if (saved.current) return
    saved.current = true
    onSave(temp.trim() || value)
  }
  return (
    <input
      autoFocus
      className={`bg-transparent outline-none border-b border-[var(--accent)] ${className}`}
      value={temp}
      placeholder={placeholder}
      onChange={e => setTemp(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit() } if (e.key === 'Escape') { saved.current = true; onSave(value) } }}
      onBlur={commit}
    />
  )
}

// ─── Inline markdown renderer ─────────────────────────────────────────────────

function renderInlineMarkdown(text, keyPrefix = '') {
  if (!text) return []
  const parts = []
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_)/g
  let last = 0
  let m
  let idx = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[0].startsWith('**')) {
      parts.push(<strong key={`${keyPrefix}-b${idx}`}>{m[2]}</strong>)
    } else if (m[0].startsWith('*')) {
      parts.push(<em key={`${keyPrefix}-i${idx}`}>{m[3]}</em>)
    } else {
      parts.push(<u key={`${keyPrefix}-u${idx}`}>{m[4]}</u>)
    }
    last = m.index + m[0].length
    idx++
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

// ─── Entity / note parsing ────────────────────────────────────────────────────

function parseSegments(content, entityNames, entityMap) {
  if (!content) return []
  const tokens = []

  if (entityNames.length > 0) {
    const escaped = entityNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const ep = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi')
    let m
    while ((m = ep.exec(content)) !== null) {
      const key = Object.keys(entityMap).find(k => k.toLowerCase() === m[1].toLowerCase())
      if (key) tokens.push({ type: 'entity', start: m.index, end: m.index + m[1].length, value: m[1], entity: entityMap[key] })
    }
  }

  const np = /\[\[(\d+)\]\]/g
  let m
  while ((m = np.exec(content)) !== null) {
    tokens.push({ type: 'note', start: m.index, end: m.index + m[0].length, seq: parseInt(m[1]) })
  }

  tokens.sort((a, b) => a.start - b.start)
  const filtered = []
  let lastEnd = 0
  for (const t of tokens) {
    if (t.start >= lastEnd) { filtered.push(t); lastEnd = t.end }
  }

  const segs = []
  let pos = 0
  for (const t of filtered) {
    if (t.start > pos) segs.push({ type: 'text', value: content.slice(pos, t.start) })
    segs.push(t)
    pos = t.end
  }
  if (pos < content.length) segs.push({ type: 'text', value: content.slice(pos) })
  return segs
}

const ContentPreview = ({ content, entityMap, onEntityClick, onNoteClick, isBullets }) => {
  const entityNames = useMemo(
    () => Object.keys(entityMap).sort((a, b) => b.length - a.length),
    [entityMap]
  )

  if (!content) return <span className="ms-placeholder">Begin writing here…</span>

  if (isBullets) {
    const lines = content.split('\n').filter(l => l.trim())
    if (!lines.length) return <span className="ms-placeholder">One item per line…</span>
    return (
      <ul className="ms-bullets">
        {lines.map((line, i) => <li key={i}>{renderInlineMarkdown(line, `bl${i}`)}</li>)}
      </ul>
    )
  }

  const segs = parseSegments(content, entityNames, entityMap)
  return (
    <>
      {segs.map((seg, i) => {
        if (seg.type === 'entity') return (
          <span key={i} className="ms-entity" onClick={e => { e.stopPropagation(); onEntityClick(seg.entity) }} title={`${seg.entity.section}: ${seg.value}`}>{seg.value}</span>
        )
        if (seg.type === 'note') return (
          <sup key={i} className="ms-note-marker" onClick={e => { e.stopPropagation(); onNoteClick(seg.seq) }} title={`Note ${seg.seq}`}>{seg.seq}</sup>
        )
        return <span key={i}>{renderInlineMarkdown(seg.value, `s${i}`)}</span>
      })}
    </>
  )
}

// ─── Scene editor ─────────────────────────────────────────────────────────────

const SceneEditor = ({
  scene, sceneIndex,
  onUpdate, onUpdateScene, onSplit,
  innerRef, onFocus: onFocusExternal,
  entityMap, onEntityClick,
  onOpenNotes, onNoteClick,
  formatSettings,
}) => {
  const [localContent, setLocalContent] = useState(scene.content || '')
  const [focused, setFocused] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const textareaRef = useRef(null)
  const wrapperRef = useRef(null)
  const isBullets = scene.textMode === 'bullets'

  useEffect(() => {
    if (!innerRef) return
    innerRef({
      focus: () => { setFocused(true); setTimeout(() => textareaRef.current?.focus(), 0) },
      scrollIntoView: opts => wrapperRef.current?.scrollIntoView(opts),
    })
  }, [innerRef])

  useEffect(() => {
    if (focused) return undefined
    const sync = window.requestAnimationFrame(() => setLocalContent(scene.content || ''))
    return () => window.cancelAnimationFrame(sync)
  }, [scene.content, focused])

  useEffect(() => {
    if (focused && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [localContent, focused])

  const debouncedUpdate = useDebounce(text => onUpdate(scene.id, text), 400)

  const handleChange = e => {
    setLocalContent(e.target.value)
    debouncedUpdate(e.target.value)
  }

  const wrapSelection = useCallback((syntax) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = localContent.slice(start, end)
    const wrapped = selected
      ? `${syntax}${selected}${syntax}`
      : `${syntax}${syntax}`
    const newContent = localContent.slice(0, start) + wrapped + localContent.slice(end)
    setLocalContent(newContent)
    debouncedUpdate(newContent)
    setTimeout(() => {
      if (!ta) return
      if (selected) {
        ta.selectionStart = start + syntax.length
        ta.selectionEnd = start + syntax.length + selected.length
      } else {
        ta.selectionStart = ta.selectionEnd = start + syntax.length
      }
      ta.focus()
    }, 0)
  }, [localContent, debouncedUpdate])

  const handleKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); wrapSelection('**'); return }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); wrapSelection('*'); return }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); wrapSelection('_'); return }

    if (e.key === 'Enter' && localContent.includes('/scene')) {
      e.preventDefault()
      const pos = e.target.selectionStart
      const before = localContent.slice(0, pos).replace('/scene', '').trim()
      const after = localContent.slice(pos).replace('/scene', '').trim()
      setLocalContent(before)
      onSplit(scene.id, scene.chapterId, before, after)
      return
    }

    if (e.key === 'Enter' && formatSettings.autoIndent && !isBullets && !e.shiftKey) {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const insertion = '\n' + ' '.repeat(formatSettings.indentSize)
      const nextContent = localContent.slice(0, start) + insertion + localContent.slice(end)
      setLocalContent(nextContent)
      debouncedUpdate(nextContent)
      window.setTimeout(() => {
        if (!textareaRef.current) return
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + insertion.length
      }, 0)
    }
  }

  const handleAddNote = useCallback(() => {
    const nextSeq = (scene.notes?.length || 0) + 1
    const marker = `[[${nextSeq}]]`
    const ta = textareaRef.current
    if (ta) {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const newContent = localContent.slice(0, start) + marker + localContent.slice(end)
      setLocalContent(newContent)
      debouncedUpdate(newContent)
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + marker.length; ta.focus() }, 0)
    }
    onUpdateScene(scene.id, { notes: [...(scene.notes || []), { id: uid(), seq: nextSeq, text: '' }] })
    onOpenNotes()
  }, [scene.notes, scene.id, localContent, debouncedUpdate, onUpdateScene, onOpenNotes])

  const activate = () => { setFocused(true); setTimeout(() => textareaRef.current?.focus(), 0) }

  const displayTitle = scene.title && scene.title !== 'Scene'
    ? scene.title
    : `Scene ${sceneIndex + 1}`

  const textStyle = {
    fontFamily: formatSettings.fontFamily,
    fontSize: formatSettings.fontSize,
    lineHeight: formatSettings.lineHeight,
    textAlign: formatSettings.textAlign,
  }

  return (
    <div ref={wrapperRef} className="relative group/scene">
      <div className="flex items-center gap-3 mb-2 opacity-0 group-hover/scene:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
        {editingTitle ? (
          <InlineInput
            value={scene.title && scene.title !== 'Scene' ? scene.title : ''}
            placeholder={`Scene ${sceneIndex + 1}`}
            onSave={t => { onUpdateScene(scene.id, { title: t || 'Scene' }); setEditingTitle(false) }}
            className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] w-40"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            title="Click to rename scene"
          >
            {displayTitle}
          </button>
        )}

        <div className="flex-1 h-px bg-[var(--border)]" />

        <div className="flex rounded overflow-hidden border border-[var(--border)] text-[9px] font-bold uppercase tracking-wider">
          <button
            onClick={() => onUpdateScene(scene.id, { textMode: 'prose' })}
            className={`px-2 py-0.5 transition-colors ${!isBullets ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >Prose</button>
          <button
            onClick={() => onUpdateScene(scene.id, { textMode: 'bullets' })}
            className={`px-2 py-0.5 transition-colors ${isBullets ? 'bg-[var(--accent)] text-[var(--bg-main)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
          >Bullets</button>
        </div>

        <div className="flex items-center gap-0.5 border border-[var(--border)] rounded overflow-hidden">
          <button
            onMouseDown={e => { e.preventDefault(); wrapSelection('**') }}
            className="px-2 py-0.5 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-fade)] transition-colors"
            title="Bold (Ctrl+B)"
          >B</button>
          <button
            onMouseDown={e => { e.preventDefault(); wrapSelection('*') }}
            className="px-2 py-0.5 text-[11px] italic text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-fade)] transition-colors"
            title="Italic (Ctrl+I)"
          >I</button>
          <button
            onMouseDown={e => { e.preventDefault(); wrapSelection('_') }}
            className="px-2 py-0.5 text-[11px] underline text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-fade)] transition-colors"
            title="Underline (Ctrl+U)"
          >U</button>
        </div>

        <button
          onClick={handleAddNote}
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 border border-[var(--border)] rounded text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
        >+ Note</button>
      </div>

      {focused ? (
        <textarea
          ref={textareaRef}
          value={localContent}
          onFocus={() => { setFocused(true); onFocusExternal() }}
          onBlur={() => setFocused(false)}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isBullets ? 'One item per line…' : 'Begin writing here…'}
          spellCheck
          rows={1}
          className="ms-textarea"
          style={textStyle}
          autoFocus
        />
      ) : (
        <div className="ms-preview" style={textStyle} onClick={activate}>
          <ContentPreview
            content={localContent}
            entityMap={entityMap}
            onEntityClick={onEntityClick}
            onNoteClick={seq => { onNoteClick(seq); onOpenNotes() }}
            isBullets={isBullets}
          />
        </div>
      )}

      {!focused && (
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={() => {}}
          onFocus={() => { setFocused(true); onFocusExternal() }}
          rows={1}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 1, width: 1, top: 0, left: 0 }}
          tabIndex={-1}
        />
      )}
    </div>
  )
}

// ─── Format settings panel ────────────────────────────────────────────────────

const FormatSettingsPanel = ({ settings, onChange, onClose }) => {
  const panelRef = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const set = (key, value) => onChange({ ...settings, [key]: value })

  return (
    <div
      ref={panelRef}
      className="ms-format-panel font-sans"
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="ms-format-panel-header">
        <span>Format</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] leading-none">✕</button>
      </div>

      {/* Font family */}
      <div className="ms-format-section">
        <div className="ms-format-label">Font</div>
        <div className="ms-format-row flex-wrap gap-1">
          {FONTS.map(f => (
            <button
              key={f.label}
              onClick={() => set('fontFamily', f.value)}
              className={`ms-format-chip ${settings.fontFamily === f.value ? 'active' : ''}`}
              style={{ fontFamily: f.value }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Font size */}
      <div className="ms-format-section">
        <div className="ms-format-label">Size</div>
        <div className="ms-format-row items-center gap-2">
          <button
            onClick={() => set('fontSize', Math.max(12, settings.fontSize - 1))}
            className="ms-format-chip w-7 flex items-center justify-center text-base leading-none"
            disabled={settings.fontSize <= 12}
          >−</button>
          <span className="text-[var(--text-main)] text-sm w-8 text-center tabular-nums">{settings.fontSize}px</span>
          <button
            onClick={() => set('fontSize', Math.min(30, settings.fontSize + 1))}
            className="ms-format-chip w-7 flex items-center justify-center text-base leading-none"
            disabled={settings.fontSize >= 30}
          >+</button>
          <div className="flex-1" />
          <input
            type="range"
            min={12}
            max={30}
            value={settings.fontSize}
            onChange={e => set('fontSize', Number(e.target.value))}
            className="ms-range w-24"
          />
        </div>
      </div>

      {/* Line spacing */}
      <div className="ms-format-section">
        <div className="ms-format-label">Spacing</div>
        <div className="ms-format-row gap-1">
          {LINE_SPACINGS.map(s => (
            <button
              key={s.label}
              onClick={() => set('lineHeight', s.value)}
              className={`ms-format-chip ${settings.lineHeight === s.value ? 'active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text alignment */}
      <div className="ms-format-section">
        <div className="ms-format-label">Alignment</div>
        <div className="ms-format-row gap-1">
          {[
            { label: 'Left', value: 'left' },
            { label: 'Center', value: 'center' },
            { label: 'Justify', value: 'justify' },
          ].map(a => (
            <button
              key={a.value}
              onClick={() => set('textAlign', a.value)}
              className={`ms-format-chip gap-1 ${settings.textAlign === a.value ? 'active' : ''}`}
            >
              <AlignIcon type={a.value} />
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Indent */}
      <div className="ms-format-section">
        <div className="ms-format-label flex items-center gap-2">
          <span>Indent on Enter</span>
          <button
            onClick={() => set('autoIndent', !settings.autoIndent)}
            className={`ms-toggle ${settings.autoIndent ? 'active' : ''}`}
            title={settings.autoIndent ? 'Disable auto-indent' : 'Enable auto-indent'}
          >
            <span className="ms-toggle-thumb" />
          </button>
        </div>
        {settings.autoIndent && (
          <div className="ms-format-row gap-1 mt-1">
            {INDENT_SIZES.map(n => (
              <button
                key={n}
                onClick={() => set('indentSize', n)}
                className={`ms-format-chip ${settings.indentSize === n ? 'active' : ''}`}
              >
                {n} spaces
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ms-format-section border-t border-[var(--border)] pt-2 mt-1">
        <button
          onClick={() => onChange(DEFAULT_FORMAT)}
          className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  )
}

const AlignIcon = ({ type }) => {
  if (type === 'left') return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor">
      <rect x="0" y="0" width="12" height="1.5" rx="0.75"/>
      <rect x="0" y="3" width="9" height="1.5" rx="0.75"/>
      <rect x="0" y="6" width="12" height="1.5" rx="0.75"/>
      <rect x="0" y="9" width="7" height="1.5" rx="0.75"/>
    </svg>
  )
  if (type === 'center') return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor">
      <rect x="0" y="0" width="12" height="1.5" rx="0.75"/>
      <rect x="1.5" y="3" width="9" height="1.5" rx="0.75"/>
      <rect x="0" y="6" width="12" height="1.5" rx="0.75"/>
      <rect x="2.5" y="9" width="7" height="1.5" rx="0.75"/>
    </svg>
  )
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="currentColor">
      <rect x="0" y="0" width="12" height="1.5" rx="0.75"/>
      <rect x="0" y="3" width="12" height="1.5" rx="0.75"/>
      <rect x="0" y="6" width="12" height="1.5" rx="0.75"/>
      <rect x="0" y="9" width="12" height="1.5" rx="0.75"/>
    </svg>
  )
}

// ─── Notes panel ──────────────────────────────────────────────────────────────

const NotesPanel = ({ scene, onUpdateScene, onClose, highlightedSeq }) => {
  if (!scene) return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Notes</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm">✕</button>
      </div>
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-xs px-4 text-center">Focus a scene to see its notes</div>
    </div>
  )

  const notes = scene.notes || []
  const updateNoteText = (noteId, text) => onUpdateScene(scene.id, { notes: notes.map(n => n.id === noteId ? { ...n, text } : n) })
  const deleteNote = noteId => onUpdateScene(scene.id, { notes: notes.filter(n => n.id !== noteId) })

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Notes</span>
        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {notes.length === 0 && (
          <p className="text-[var(--text-muted)] text-xs text-center py-6">
            No notes yet.<br />Use <span className="text-[var(--accent)] font-mono">+ Note</span> in the scene toolbar.
          </p>
        )}
        {notes.map(note => (
          <div
            key={note.id}
            className={`rounded-lg border p-3 transition-colors ${highlightedSeq === note.seq ? 'border-[var(--accent)] bg-[var(--accent-fade)]' : 'border-[var(--border)] bg-[var(--bg-main)]'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Note {note.seq}</span>
              <button onClick={() => deleteNote(note.id)} className="text-[var(--text-muted)] hover:text-red-400 text-xs">✕</button>
            </div>
            <textarea
              value={note.text}
              onChange={e => updateNoteText(note.id, e.target.value)}
              placeholder="Write your note here…"
              className="w-full bg-transparent text-[var(--text-main)] text-sm outline-none resize-none min-h-[60px]"
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Focus controls ───────────────────────────────────────────────────────────

const FocusControls = ({
  notesOpen, setNotesOpen,
  activeScene, onExport, exporting,
  formatOpen, setFormatOpen,
  formatSettings, onFormatChange,
}) => (
  <div className="manuscript-focus-controls font-sans relative">
    <button
      onClick={() => setNotesOpen(v => !v)}
      className={`btn btn-sm ${notesOpen ? 'btn-primary' : 'btn-secondary'}`}
      title={notesOpen ? 'Close notes' : 'Open notes'}
    >
      Notes{activeScene?.notes?.length ? ` (${activeScene.notes.length})` : ''}
    </button>

    <div className="relative">
      <button
        onClick={() => setFormatOpen(v => !v)}
        className={`btn btn-sm flex items-center gap-1.5 ${formatOpen ? 'btn-primary' : 'btn-secondary'}`}
        title="Text formatting options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
        </svg>
        Format
      </button>
      {formatOpen && (
        <FormatSettingsPanel
          settings={formatSettings}
          onChange={onFormatChange}
          onClose={() => setFormatOpen(false)}
        />
      )}
    </div>

    <button
      onClick={onExport}
      disabled={exporting}
      className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
      title="Export manuscript as .docx"
    >
      {exporting ? (
        <span className="animate-pulse">Exporting…</span>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export .docx
        </>
      )}
    </button>
  </div>
)

const OutlineSummary = ({ acts, chapters, scenes, labels, getChapterTitle, totalWordCount, onClose }) => {
  const sceneExcerpt = (scene) => {
    const text = (scene.content || '').replace(/\s+/g, ' ').trim()
    if (!text) return 'Blank scene'
    return text.length > 110 ? `${text.slice(0, 110)}...` : text
  }

  return (
    <div className="manuscript-summary-panel font-sans">
      <div className="manuscript-panel-head">
        <div>
          <p className="eyebrow">Story outline</p>
          <h3>Summary</h3>
        </div>
        <button onClick={onClose} className="manuscript-panel-close">×</button>
      </div>

      <div className="manuscript-summary-meta">
        <span>{acts.length} {labels.level1.toLowerCase()}{acts.length === 1 ? '' : 's'}</span>
        <span>{chapters.length} {labels.level2.toLowerCase()}{chapters.length === 1 ? '' : 's'}</span>
        <span>{totalWordCount.toLocaleString()} words</span>
      </div>

      <div className="manuscript-summary-list">
        {acts.length === 0 && <p className="text-sm text-[var(--text-muted)]">No outline yet.</p>}
        {acts.map(act => {
          const actChapters = chapters.filter(c => c.actId === act.id)
          return (
            <section key={act.id}>
              <h4>{act.title}</h4>
              {act.synopsis && <p>{act.synopsis}</p>}
              {actChapters.map(chap => {
                const chapScenes = scenes.filter(s => s.chapterId === chap.id)
                return (
                  <div key={chap.id} className="manuscript-summary-chapter">
                    <strong>{getChapterTitle(chap)}</strong>
                    {chap.synopsis && <p>{chap.synopsis}</p>}
                    {chapScenes.slice(0, 4).map(scene => (
                      <small key={scene.id}>{scene.title && scene.title !== 'Scene' ? `${scene.title}: ` : ''}{sceneExcerpt(scene)}</small>
                    ))}
                    {chapScenes.length > 4 && <em>{chapScenes.length - 4} more scenes</em>}
                  </div>
                )
              })}
            </section>
          )
        })}
      </div>
    </div>
  )
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function Manuscript({ store }) {
  const {
    acts, chapters, scenes,
    addAct, addScene,
    updateSceneContent, updateScene,
    characters, locations,
    setSelectedCharacterId, setSelectedLocationId,
    activeNovel,
  } = store

  const labels = getProjectType(activeNovel?.type).structure
  const [activeSceneId, setActiveSceneId] = useState(null)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [highlightedNoteSeq, setHighlightedNoteSeq] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [formatSettings, setFormatSettings] = useState(loadFormat)
  const [formatOpen, setFormatOpen] = useState(false)
  const [view, setView] = useState('manuscript')
  const editorRefs = useRef({})

  const activeScene = scenes.find(s => s.id === activeSceneId) ?? null

  const handleFormatChange = useCallback((next) => {
    setFormatSettings(next)
    localStorage.setItem('nf-format-settings', JSON.stringify(next))
  }, [])

  const entityMap = useMemo(() => {
    const map = {}
    ;(characters || []).forEach(c => {
      if (c.name?.length >= 2) map[c.name.toLowerCase()] = { id: c.id, section: 'characters', name: c.name }
      ;(c.keywords || []).forEach(kw => { if (kw?.length >= 2) map[kw.toLowerCase()] = { id: c.id, section: 'characters', name: c.name } })
    })
    ;(locations || []).forEach(l => {
      if (l.name?.length >= 2) map[l.name.toLowerCase()] = { id: l.id, section: 'locations', name: l.name }
    })
    return map
  }, [characters, locations])

  const handleEntityClick = useCallback(entity => {
    if (entity.section === 'characters') setSelectedCharacterId(entity.id)
    if (entity.section === 'locations') setSelectedLocationId(entity.id)
    window.dispatchEvent(new CustomEvent('switch-section', { detail: { section: entity.section } }))
  }, [setSelectedCharacterId, setSelectedLocationId])

  const chapterGlobalNumbers = useMemo(() => {
    const map = {}
    let count = 1
    acts.forEach(act => {
      chapters.filter(c => c.actId === act.id).forEach(chap => { map[chap.id] = count++ })
    })
    return map
  }, [acts, chapters])

  const getChapterTitle = useCallback(chap => {
    const num = chapterGlobalNumbers[chap.id]
    const l2lower = labels.level2.toLowerCase()
    const isDefault = !chap.title || chap.title.toLowerCase().startsWith(l2lower)
    return isDefault ? `${labels.level2} ${num}` : `${labels.level2} ${num}: ${chap.title}`
  }, [chapterGlobalNumbers, labels])

  const orderedContent = useMemo(() => {
    const result = []
    acts.forEach(act => {
      const actChapters = chapters.filter(c => c.actId === act.id)
      result.push({ type: 'act', act, hasChapters: actChapters.length > 0 })
      actChapters.forEach(chap => {
        const chapScenes = scenes.filter(s => s.chapterId === chap.id)
        result.push({ type: 'chapter', chap, hasScenes: chapScenes.length > 0 })
        chapScenes.forEach((scene, idx) => {
          result.push({ type: 'scene', scene, sceneIndex: idx, chapterSceneCount: chapScenes.length, chap })
        })
      })
    })
    return result
  }, [acts, chapters, scenes])

  const totalWordCount = useMemo(() =>
    scenes.reduce((acc, s) => acc + (s.content?.trim().split(/\s+/).filter(Boolean).length || 0), 0)
  , [scenes])

  const handleSplitScene = (sceneId, chapterId, before, after) => {
    updateSceneContent(sceneId, before)
    const newScene = addScene(chapterId, labels.level3)
    setTimeout(() => {
      updateSceneContent(newScene.id, after)
      editorRefs.current[newScene.id]?.focus()
      editorRefs.current[newScene.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleAddScene = chapterId => {
    const newScene = addScene(chapterId, labels.level3)
    setTimeout(() => {
      editorRefs.current[newScene.id]?.focus()
      editorRefs.current[newScene.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const handleNoteClick = seq => {
    setHighlightedNoteSeq(seq)
    setTimeout(() => setHighlightedNoteSeq(null), 2000)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportToDocx(activeNovel, acts, chapters, scenes, chapterGlobalNumbers)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="manuscript-processor flex flex-col h-full bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-serif">
      {/* Top tab bar */}
      <div className="flex border-b border-[var(--border)] bg-[var(--bg-nav)] font-sans flex-shrink-0">
        <button
          onClick={() => setView('manuscript')}
          className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors relative ${
            view === 'manuscript' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          {view === 'manuscript' && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)]" />
          )}
          Manuscript
        </button>
      </div>

      {/* Top toolbar — only shown in manuscript view */}
      {view === 'manuscript' && (
        <FocusControls
          notesOpen={notesOpen}
          setNotesOpen={setNotesOpen}
          activeScene={activeScene}
          onExport={handleExport}
          exporting={exporting}
          formatOpen={formatOpen}
          setFormatOpen={setFormatOpen}
          formatSettings={formatSettings}
          onFormatChange={handleFormatChange}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Outline summary toggle — small square, upper-left of content */}
        {view === 'manuscript' && (
          <button
            onClick={() => setOutlineOpen(v => !v)}
            className={`absolute top-3 left-3 z-10 w-7 h-7 flex items-center justify-center rounded border transition-colors font-sans ${
              outlineOpen
                ? 'border-[var(--accent)] bg-[var(--accent-fade)] text-[var(--accent)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-[var(--bg-main)]'
            }`}
            title="Story summary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        )}

        {/* Manuscript writing view */}
        {view === 'manuscript' && (
          <main className="manuscript-page workspace-page flex-1 overflow-y-auto scroll-smooth min-w-0">
            <div className="manuscript-document mx-auto py-16 px-6 md:px-12">

              {acts.length === 0 && (
                <div className="empty-state mt-32 font-sans">
                  <p className="text-lg mb-2 font-semibold">Nothing to write yet.</p>
                  <p className="text-sm mb-6 opacity-70">Add an {labels.level1} in the outline to get started.</p>
                  <button
                    onClick={() => addAct(`${labels.level1} 1`)}
                    className="btn btn-primary"
                  >{labels.level1}</button>
                </div>
              )}

              {orderedContent.map(item => {
                if (item.type === 'act') {
                  return (
                    <div key={`act-${item.act.id}`} className="mt-16 first:mt-0 mb-2">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-[var(--border)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--text-muted)]">
                          {item.act.title}
                        </span>
                        <div className="flex-1 h-px bg-[var(--border)]" />
                      </div>
                    </div>
                  )
                }

                if (item.type === 'chapter') {
                  return (
                    <div key={`chap-${item.chap.id}`} id={`chap-${item.chap.id}`} className="pt-14 pb-8 text-center font-sans">
                      <h2 className="text-[var(--accent)] text-xs font-black uppercase tracking-[0.5em] mb-1 opacity-80">
                        {getChapterTitle(item.chap)}
                      </h2>
                      {item.chap.title && !item.chap.title.toLowerCase().startsWith(labels.level2.toLowerCase()) && (
                        <p className="text-[var(--text-muted)] text-sm italic mt-1 opacity-70">{item.chap.title}</p>
                      )}
                      <div className="w-8 h-px bg-[var(--border)] mx-auto mt-4 rounded-full" />
                      {!item.hasScenes && (
                        <button
                          onClick={() => handleAddScene(item.chap.id)}
                          className="manuscript-add-scene mt-6 font-sans"
                        >+ Add {labels.level3}</button>
                      )}
                    </div>
                  )
                }

                if (item.type === 'scene') {
                  const { scene, sceneIndex, chapterSceneCount, chap } = item
                  const isLastInChapter = sceneIndex === chapterSceneCount - 1

                  return (
                    <div key={`scene-${scene.id}`}>
                      {sceneIndex > 0 && (
                        <div className="py-10 flex items-center justify-center">
                          <div className="flex gap-3 items-center opacity-25 hover:opacity-60 transition-opacity">
                            <div className="w-10 h-px bg-[var(--border)]" />
                            <div className="flex gap-2">
                              <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                              <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                            </div>
                            <div className="w-10 h-px bg-[var(--border)]" />
                          </div>
                        </div>
                      )}

                      <SceneEditor
                        scene={scene}
                        sceneIndex={sceneIndex}
                        onUpdate={updateSceneContent}
                        onUpdateScene={updateScene}
                        onSplit={handleSplitScene}
                        innerRef={proxy => { editorRefs.current[scene.id] = proxy }}
                        onFocus={() => setActiveSceneId(scene.id)}
                        entityMap={entityMap}
                        onEntityClick={handleEntityClick}
                        onOpenNotes={() => setNotesOpen(true)}
                        onNoteClick={handleNoteClick}
                        formatSettings={formatSettings}
                      />

                      {isLastInChapter && (
                        <div className="mt-10 text-center font-sans">
                          <button
                            onClick={() => handleAddScene(chap.id)}
                            className="manuscript-add-scene"
                          >+ {labels.level3}</button>
                        </div>
                      )}
                    </div>
                  )
                }

                return null
              })}

              <div className="h-40" />
            </div>
          </main>
        )}

        {/* Notes sidebar — manuscript view only */}
        {view === 'manuscript' && (
          <aside
            className="studio-rail transition-all duration-300 ease-in-out flex-shrink-0 overflow-hidden font-sans"
            style={{ width: notesOpen ? 264 : 0 }}
          >
            <div className="w-[264px] h-full">
              <NotesPanel
                scene={activeScene}
                onUpdateScene={updateScene}
                onClose={() => setNotesOpen(false)}
                highlightedSeq={highlightedNoteSeq}
              />
            </div>
          </aside>
        )}

      </div>

      {/* Outline summary popup */}
      {outlineOpen && view === 'manuscript' && (
        <OutlineSummary
          acts={acts}
          chapters={chapters}
          scenes={scenes}
          labels={labels}
          getChapterTitle={getChapterTitle}
          totalWordCount={totalWordCount}
          onClose={() => setOutlineOpen(false)}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .ms-textarea {
          width: 100%;
          background: transparent;
          color: var(--text-main);
          min-height: 2.1em;
          resize: none;
          outline: none;
          border: none;
          padding: 0;
          margin: 0;
          overflow: hidden;
          white-space: pre-wrap;
        }
        .ms-textarea::placeholder {
          color: var(--text-muted);
          font-style: italic;
          opacity: 0.45;
        }
        .ms-preview {
          min-height: 2.1em;
          color: var(--text-main);
          white-space: pre-wrap;
          word-break: break-word;
          cursor: text;
        }
        .ms-placeholder {
          color: var(--text-muted);
          font-style: italic;
          opacity: 0.45;
        }
        .ms-bullets {
          list-style: none;
          padding: 0;
          margin: 0;
          color: var(--text-main);
        }
        .ms-bullets li {
          padding-left: 1.4em;
          position: relative;
        }
        .ms-bullets li::before {
          content: '–';
          position: absolute;
          left: 0;
          color: var(--accent);
          opacity: 0.6;
        }
        .ms-entity {
          color: var(--accent);
          text-decoration: underline;
          text-decoration-style: dotted;
          text-underline-offset: 3px;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .ms-entity:hover { opacity: 0.7; }
        .ms-note-marker {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 15px;
          height: 15px;
          background: var(--accent);
          color: var(--bg-main);
          border-radius: 50%;
          font-size: 9px;
          font-family: system-ui, sans-serif;
          font-weight: 700;
          cursor: pointer;
          margin: 0 1px;
          vertical-align: super;
          transition: opacity 0.15s;
          line-height: 1;
        }
        .ms-note-marker:hover { opacity: 0.7; }

        /* Format settings panel */
        .ms-format-panel {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 0;
          z-index: 100;
          min-width: 300px;
          background: var(--bg-nav);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ms-format-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }
        .ms-format-section {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .ms-format-label {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ms-format-row {
          display: flex;
          flex-direction: row;
          align-items: center;
        }
        .ms-format-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 3px 9px;
          border: 1px solid var(--border);
          border-radius: 5px;
          font-size: 11px;
          color: var(--text-muted);
          background: transparent;
          cursor: pointer;
          transition: all 0.12s;
          white-space: nowrap;
        }
        .ms-format-chip:hover {
          border-color: var(--accent);
          color: var(--text-main);
        }
        .ms-format-chip.active {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--bg-main);
        }
        .ms-format-chip:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .ms-range {
          -webkit-appearance: none;
          appearance: none;
          height: 3px;
          background: var(--border);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .ms-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
        }
        .ms-range::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--accent);
          border: none;
          cursor: pointer;
        }
        /* Toggle switch */
        .ms-toggle {
          position: relative;
          width: 28px;
          height: 16px;
          border-radius: 8px;
          background: var(--border);
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .ms-toggle.active {
          background: var(--accent);
        }
        .ms-toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--text-main);
          transition: transform 0.2s;
        }
        .ms-toggle.active .ms-toggle-thumb {
          transform: translateX(12px);
        }
      `}} />
    </div>
  )
}
