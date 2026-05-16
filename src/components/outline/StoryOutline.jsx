import { useState, useRef, useEffect, useMemo } from 'react'
import { getProjectType } from '../../constants/projectTypes'

const ChevronIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12" height="12"
    viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const MoveBtn = ({ onClick, title, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="opacity-0 group-hover:opacity-100 disabled:opacity-0 p-0.5 text-[var(--text-muted)] hover:text-[var(--accent)] disabled:cursor-not-allowed transition-all"
  >
    {children}
  </button>
)

const DeleteBtn = ({ onClick, title = 'Delete' }) => (
  <button
    onClick={onClick}
    className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-muted)] hover:text-red-400 transition-all"
    title={title}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  </button>
)

const AutoTextarea = ({ value, onChange, placeholder, className }) => {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={`w-full bg-transparent resize-none outline-none text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] placeholder-opacity-50 leading-relaxed overflow-hidden ${className || ''}`}
    />
  )
}

const InlineTitle = ({ value, onSave, className }) => {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState(value)
  const saving = useRef(false)

  const commit = () => {
    if (saving.current) return
    saving.current = true
    onSave(temp.trim() || value)
    setEditing(false)
    saving.current = false
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={temp}
        onChange={e => setTemp(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setTemp(value); setEditing(false) } }}
        onBlur={commit}
        className={`bg-transparent outline-none border-b border-[var(--accent)] text-[var(--text-main)] ${className}`}
      />
    )
  }

  return (
    <span
      onDoubleClick={() => { setTemp(value); setEditing(true) }}
      title="Double-click to rename"
      className={`cursor-default select-none ${className}`}
    >
      {value}
    </span>
  )
}

const SceneRow = ({ scene, sceneIdx, isFirst, isLast, updateScene, reorderScene, deleteScene, labels }) => {
  const wordCount = useMemo(() => {
    return scene.content?.trim().split(/\s+/).filter(Boolean).length || 0
  }, [scene.content])

  return (
    <div className="group flex gap-2 px-3 py-2 rounded hover:bg-[var(--bg-hover)] transition-colors">
      <div className="flex flex-col items-center gap-0.5 pt-1 flex-shrink-0">
        <MoveBtn onClick={() => reorderScene(scene.id, 'up')} disabled={isFirst} title="Move up">▲</MoveBtn>
        <MoveBtn onClick={() => reorderScene(scene.id, 'down')} disabled={isLast} title="Move down">▼</MoveBtn>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex-shrink-0">
            {labels.level3} {sceneIdx + 1}
          </span>
          <InlineTitle
            value={scene.title === 'Scene' ? '' : scene.title}
            onSave={t => updateScene(scene.id, { title: t || labels.level3 })}
            className="text-sm text-[var(--text-muted)] italic flex-1"
          />
          {wordCount > 0 && (
            <span className="text-[10px] font-mono text-[var(--accent)] opacity-60 flex-shrink-0">{wordCount.toLocaleString()}w</span>
          )}
        </div>
        <AutoTextarea
          value={scene.synopsis}
          onChange={v => updateScene(scene.id, { synopsis: v })}
          placeholder={`${labels.level3} synopsis — what happens, who's involved, what changes…`}
          className="text-xs opacity-80 pl-0"
        />
      </div>

      <DeleteBtn
        title={`Delete ${labels.level3.toLowerCase()}`}
        onClick={() => {
          if (!confirm(`Delete this ${labels.level3.toLowerCase()} from both the outline and manuscript?`)) return
          deleteScene(scene.id)
        }}
      />
    </div>
  )
}

const ChapterCard = ({ chapter, chapterNum, scenes, isFirst, isLast, updateChapter, reorderChapter, deleteChapter, addScene, updateScene, reorderScene, deleteScene, labels }) => {
  const [open, setOpen] = useState(true)
  const chapterScenes = useMemo(() => scenes.filter(s => s.chapterId === chapter.id), [scenes, chapter.id])
  const wordCount = useMemo(() => chapterScenes.reduce((n, s) => n + (s.content?.trim().split(/\s+/).filter(Boolean).length || 0), 0), [chapterScenes])

  const l2lower = labels.level2.toLowerCase()
  const title = !chapter.title || chapter.title.toLowerCase().startsWith(l2lower)
    ? `${labels.level2} ${chapterNum}`
    : `${labels.level2} ${chapterNum}: ${chapter.title}`

  return (
    <div className="ml-6 border-l border-[var(--border)] pl-4">
      <div className="group flex gap-2 items-start py-2">
        <div className="flex flex-col items-center gap-0.5 pt-0.5 flex-shrink-0">
          <MoveBtn onClick={() => reorderChapter(chapter.id, 'up')} disabled={isFirst} title="Move chapter up">▲</MoveBtn>
          <MoveBtn onClick={() => reorderChapter(chapter.id, 'down')} disabled={isLast} title="Move chapter down">▼</MoveBtn>
        </div>

        <button onClick={() => setOpen(v => !v)} className="mt-1 text-[var(--text-muted)] hover:text-[var(--accent)] flex-shrink-0 transition-colors">
          <ChevronIcon open={open} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <InlineTitle
              value={title}
              onSave={t => updateChapter(chapter.id, { title: t })}
              className="text-sm font-semibold text-[var(--text-main)]"
            />
            <span className="text-[10px] text-[var(--text-muted)] opacity-60">{chapterScenes.length} {labels.level3.toLowerCase()}{chapterScenes.length !== 1 ? 's' : ''}</span>
            {wordCount > 0 && <span className="text-[10px] font-mono text-[var(--accent)] opacity-60">{wordCount.toLocaleString()}w</span>}
          </div>
          <AutoTextarea
            value={chapter.synopsis}
            onChange={v => updateChapter(chapter.id, { synopsis: v })}
            placeholder={`${labels.level2} synopsis…`}
            className="text-xs opacity-70 mt-1"
          />
        </div>

        <DeleteBtn
          title={`Delete ${labels.level2.toLowerCase()}`}
          onClick={() => {
            const count = chapterScenes.length
            const detail = count ? ` This will also delete ${count} ${labels.level3.toLowerCase()}${count === 1 ? '' : 's'}.` : ''
            if (!confirm(`Delete this ${labels.level2.toLowerCase()} from both the outline and manuscript?${detail}`)) return
            deleteChapter(chapter.id)
          }}
        />
      </div>

      {open && (
        <div className="space-y-1 pb-2">
          {chapterScenes.map((scene, idx) => (
            <SceneRow
              key={scene.id}
              scene={scene}
              sceneIdx={idx}
              isFirst={idx === 0}
              isLast={idx === chapterScenes.length - 1}
              updateScene={updateScene}
              reorderScene={reorderScene}
              deleteScene={deleteScene}
              labels={labels}
            />
          ))}
          <button
            onClick={() => addScene(chapter.id, labels.level3)}
            className="ml-3 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] uppercase tracking-wider transition-colors py-1"
          >
            + {labels.level3}
          </button>
        </div>
      )}
    </div>
  )
}

const ActCard = ({ act, chapterGlobalNums, chapters, scenes, isFirst, isLast, updateAct, reorderAct, deleteAct, addChapter, updateChapter, reorderChapter, deleteChapter, addScene, updateScene, reorderScene, deleteScene, labels }) => {
  const [open, setOpen] = useState(true)
  const actChapters = useMemo(() => chapters.filter(c => c.actId === act.id), [chapters, act.id])
  const wordCount = useMemo(() => {
    const sceneIds = actChapters.flatMap(c => scenes.filter(s => s.chapterId === c.id))
    return sceneIds.reduce((n, s) => n + (s.content?.trim().split(/\s+/).filter(Boolean).length || 0), 0)
  }, [actChapters, scenes])

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-nav)] overflow-hidden">
      <div className="group flex gap-2 items-start px-4 py-3" style={{ backgroundColor: 'var(--bg-hover)' }}>
        <div className="flex flex-col items-center gap-0.5 pt-0.5 flex-shrink-0">
          <MoveBtn onClick={() => reorderAct(act.id, 'up')} disabled={isFirst} title="Move act up">▲</MoveBtn>
          <MoveBtn onClick={() => reorderAct(act.id, 'down')} disabled={isLast} title="Move act down">▼</MoveBtn>
        </div>

        <button onClick={() => setOpen(v => !v)} className="mt-1 text-[var(--text-muted)] hover:text-[var(--accent)] flex-shrink-0 transition-colors">
          <ChevronIcon open={open} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <InlineTitle
              value={act.title}
              onSave={t => updateAct(act.id, { title: t })}
              className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest"
            />
            <span className="text-[10px] text-[var(--text-muted)] opacity-60">{actChapters.length} {labels.level2.toLowerCase().slice(0,3)}</span>
            {wordCount > 0 && <span className="text-[10px] font-mono text-[var(--accent)] opacity-60">{wordCount.toLocaleString()}w</span>}
          </div>
          <AutoTextarea
            value={act.synopsis}
            onChange={v => updateAct(act.id, { synopsis: v })}
            placeholder={`${labels.level1} synopsis — the arc, the stakes, how it ends…`}
            className="text-xs opacity-70 mt-1"
          />
        </div>

        <DeleteBtn
          title={`Delete ${labels.level1.toLowerCase()}`}
          onClick={() => {
            const sceneCount = actChapters.reduce((n, chap) => n + scenes.filter(s => s.chapterId === chap.id).length, 0)
            const detail = actChapters.length || sceneCount
              ? ` This will also delete ${actChapters.length} ${labels.level2.toLowerCase()}${actChapters.length === 1 ? '' : 's'} and ${sceneCount} ${labels.level3.toLowerCase()}${sceneCount === 1 ? '' : 's'}.`
              : ''
            if (!confirm(`Delete this ${labels.level1.toLowerCase()} from both the outline and manuscript?${detail}`)) return
            deleteAct(act.id)
          }}
        />
      </div>

      {open && (
        <div className="p-3 space-y-2">
          {actChapters.map((chap, idx) => (
            <ChapterCard
              key={chap.id}
              chapter={chap}
              chapterNum={chapterGlobalNums[chap.id]}
              scenes={scenes}
              isFirst={idx === 0}
              isLast={idx === actChapters.length - 1}
              updateChapter={updateChapter}
              reorderChapter={reorderChapter}
              deleteChapter={deleteChapter}
              addScene={addScene}
              updateScene={updateScene}
              reorderScene={reorderScene}
              deleteScene={deleteScene}
              labels={labels}
            />
          ))}
          <button
            onClick={() => addChapter(act.id, '')}
            className="ml-10 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] uppercase tracking-wider transition-colors py-1"
          >
            + {labels.level2}
          </button>
        </div>
      )}
    </div>
  )
}

export default function StoryOutline({ store }) {
  const {
    acts, addAct, updateAct, deleteAct, reorderAct,
    chapters, addChapter, updateChapter, deleteChapter, reorderChapter,
    scenes, addScene, updateScene, deleteScene, reorderScene,
    activeNovel,
  } = store

  const labels = getProjectType(activeNovel?.type).structure

  const totalWords = useMemo(() => scenes.reduce((n, s) => n + (s.content?.trim().split(/\s+/).filter(Boolean).length || 0), 0), [scenes])
  const totalScenes = scenes.length
  const totalChapters = chapters.length

  const chapterGlobalNums = useMemo(() => {
    const map = {}
    let count = 1
    acts.forEach(act => {
      chapters.filter(c => c.actId === act.id).forEach(chap => { map[chap.id] = count++ })
    })
    return map
  }, [acts, chapters])

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden">
      {/* Header */}
      <div className="studio-topbar flex-shrink-0 px-8 py-5 flex items-center justify-between">
        <div>
          <p className="eyebrow">Structure</p>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-main)]">Story Outline</h1>
          <div className="flex gap-4 mt-1 text-[11px] text-[var(--text-muted)]">
            <span>{acts.length} {labels.level1.toLowerCase()}{acts.length !== 1 ? 's' : ''}</span>
            <span>{totalChapters} {labels.level2.toLowerCase()}{totalChapters !== 1 ? 's' : ''}</span>
            <span>{totalScenes} {labels.level3.toLowerCase()}{totalScenes !== 1 ? 's' : ''}</span>
            {totalWords > 0 && <span className="text-[var(--accent)] font-mono font-bold">{totalWords.toLocaleString()} words</span>}
          </div>
        </div>
        <button
          onClick={() => addAct(`${labels.level1} ${acts.length + 1}`)}
          className="btn btn-primary"
        >
          + {labels.level1}
        </button>
      </div>

      {/* Outline tree */}
      <div className="flex-1 overflow-y-auto p-8">
        {acts.length === 0 ? (
          <div className="empty-state mx-auto mt-12 max-w-lg">
            <p className="text-[var(--text-muted)] text-sm">No {labels.level1.toLowerCase()}s yet.</p>
            <p className="text-[var(--text-muted)] text-xs opacity-60 max-w-xs">
              Add your first {labels.level1.toLowerCase()} to start building the outline. {labels.level1}s, {labels.level2.toLowerCase()}s, and {labels.level3.toLowerCase()}s created here are reflected instantly in the writing view, and vice versa.
            </p>
            <button
              onClick={() => addAct(`${labels.level1} 1`)}
              className="btn btn-primary mt-4"
            >
              + Add First {labels.level1}
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {acts.map((act, idx) => (
              <ActCard
                key={act.id}
                act={act}
                chapterGlobalNums={chapterGlobalNums}
                chapters={chapters}
                scenes={scenes}
                isFirst={idx === 0}
                isLast={idx === acts.length - 1}
                updateAct={updateAct}
                reorderAct={reorderAct}
                deleteAct={deleteAct}
                addChapter={addChapter}
                updateChapter={updateChapter}
                reorderChapter={reorderChapter}
                deleteChapter={deleteChapter}
                addScene={addScene}
                updateScene={updateScene}
                reorderScene={reorderScene}
                deleteScene={deleteScene}
                labels={labels}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
