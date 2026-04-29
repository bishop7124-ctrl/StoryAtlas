import { useState, useMemo, useEffect, useRef, useCallback } from 'react'

function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  return useCallback((...args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

const InlineInput = ({ value, onSave, className }) => {
  const [temp, setTemp] = useState(value);
  const isSaving = useRef(false);

  const handleSave = () => {
    if (isSaving.current) return;
    isSaving.current = true;
    onSave(temp);
  };

  return (
    <input
      autoFocus
      className={`bg-[var(--bg-main)] text-[var(--text-main)] outline-none px-1 py-0.5 rounded border border-[var(--accent)] ${className}`}
      value={temp}
      onChange={e => setTemp(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && handleSave()}
      onBlur={handleSave}
    />
  );
};

// Renders scene text with entity names highlighted and clickable
const HighlightedText = ({ content, entityMap, onEntityClick }) => {
  const entityNames = useMemo(() => Object.keys(entityMap).sort((a, b) => b.length - a.length), [entityMap]);

  const parts = useMemo(() => {
    if (!content || entityNames.length === 0) return null;
    const escaped = entityNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
    const result = [];
    let lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match.index > lastIndex) result.push({ type: 'text', value: content.slice(lastIndex, match.index) });
      const matchedKey = Object.keys(entityMap).find(k => k.toLowerCase() === match[1].toLowerCase());
      result.push({ type: 'entity', value: match[1], entity: entityMap[matchedKey] });
      lastIndex = match.index + match[1].length;
    }
    if (lastIndex < content.length) result.push({ type: 'text', value: content.slice(lastIndex) });
    return result;
  }, [content, entityNames, entityMap]);

  if (!content) {
    return <span className="manuscript-placeholder">Begin writing here...</span>;
  }

  if (!parts) {
    return <span>{content}</span>;
  }

  return (
    <>
      {parts.map((part, i) =>
        part.type === 'entity' ? (
          <span
            key={i}
            className="entity-link"
            onClick={e => { e.stopPropagation(); onEntityClick(part.entity); }}
            title={`Open ${part.entity.section}: ${part.value}`}
          >
            {part.value}
          </span>
        ) : (
          <span key={i}>{part.value}</span>
        )
      )}
    </>
  );
};

const SceneEditor = ({ scene, onUpdate, onSplit, setCommandHint, innerRef, onFocus: onFocusExternal, entityMap, onEntityClick }) => {
  const [localContent, setLocalContent] = useState(scene.content || '');
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef(null);
  const wrapperRef = useRef(null);

  // Expose a proxy object so parent can call .focus() and .scrollIntoView()
  useEffect(() => {
    if (!innerRef) return;
    innerRef({
      focus: () => {
        setFocused(true);
        setTimeout(() => textareaRef.current?.focus(), 0);
      },
      scrollIntoView: (opts) => wrapperRef.current?.scrollIntoView(opts),
    });
  }, [innerRef]);

  // Sync external content when scene updates and not focused
  useEffect(() => {
    if (!focused) setLocalContent(scene.content || '');
  }, [scene.content, focused]);

  useEffect(() => {
    if (focused && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localContent, focused]);

  const debouncedUpdate = useDebounce((newText) => onUpdate(scene.id, newText), 500);

  const handleChange = (e) => {
    const val = e.target.value;
    setLocalContent(val);
    debouncedUpdate(val);
    setCommandHint(val.includes('/scene'));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && localContent.includes('/scene')) {
      e.preventDefault();
      const cursorPosition = e.target.selectionStart;
      const textBefore = localContent.slice(0, cursorPosition).replace('/scene', '').trim();
      const textAfter = localContent.slice(cursorPosition).replace('/scene', '').trim();
      setLocalContent(textBefore);
      setCommandHint(false);
      onSplit(scene.id, scene.chapterId, textBefore, textAfter);
    }
  };

  const handleFocus = () => {
    setFocused(true);
    onFocusExternal();
  };

  const handleBlur = () => setFocused(false);

  const activateEdit = () => {
    setFocused(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Preview layer — visible when not editing */}
      {!focused && (
        <div className="manuscript-preview" onClick={activateEdit}>
          <HighlightedText content={localContent} entityMap={entityMap} onEntityClick={onEntityClick} />
        </div>
      )}

      {/* Editing textarea — visible when focused */}
      {focused && (
        <textarea
          ref={textareaRef}
          value={localContent}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Begin writing here..."
          spellCheck="true"
          rows={1}
          className="manuscript-input"
          autoFocus
        />
      )}

      {/* Hidden textarea used only for external scroll/focus via ref when in preview mode */}
      {!focused && (
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={() => {}}
          onFocus={handleFocus}
          rows={1}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 1, width: 1, top: 0, left: 0 }}
          tabIndex={-1}
        />
      )}
    </div>
  );
};

export default function Manuscript({ store }) {
  const { acts, chapters, scenes, addAct, addChapter, addScene, updateSceneContent, updateAct, updateChapter, characters, locations, setSelectedCharacterId, setSelectedLocationId } = store
  const [activeSceneId, setActiveSceneId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const editorRefs = useRef({})

  // Build entity map: { lowercaseName: { id, section, name } }
  const entityMap = useMemo(() => {
    const map = {};
    (characters || []).forEach(c => {
      if (c.name && c.name.length >= 2) map[c.name.toLowerCase()] = { id: c.id, section: 'characters', name: c.name };
      (c.keywords || []).forEach(kw => {
        if (kw && kw.length >= 2) map[kw.toLowerCase()] = { id: c.id, section: 'characters', name: c.name };
      });
    });
    (locations || []).forEach(l => {
      if (l.name && l.name.length >= 2) map[l.name.toLowerCase()] = { id: l.id, section: 'locations', name: l.name };
    });
    return map;
  }, [characters, locations]);

  const handleEntityClick = useCallback((entity) => {
    if (entity.section === 'characters') setSelectedCharacterId(entity.id);
    if (entity.section === 'locations') setSelectedLocationId(entity.id);
    window.dispatchEvent(new CustomEvent('switch-section', { detail: { section: entity.section } }));
  }, [setSelectedCharacterId, setSelectedLocationId]);

  const chapterGlobalNumbers = useMemo(() => {
    const map = {};
    let count = 1;
    acts.forEach(act => {
      chapters.filter(c => c.actId === act.id).forEach(chap => { map[chap.id] = count++; });
    });
    return map;
  }, [acts, chapters]);

  const getChapterTitle = (chap) => {
    const num = chapterGlobalNumbers[chap.id];
    const isDefault = !chap.title || chap.title.toLowerCase().startsWith('chapter');
    return isDefault ? `Chapter ${num}` : `Chapter ${num}: ${chap.title}`;
  };

  const orderedScenes = useMemo(() => {
    const sorted = [];
    acts.forEach(act => {
      chapters.filter(c => c.actId === act.id).forEach(chap => {
        scenes.filter(s => s.chapterId === chap.id).forEach(scene => sorted.push(scene));
      });
    });
    return sorted;
  }, [acts, chapters, scenes]);

  const totalWordCount = useMemo(() => {
    return scenes.reduce((acc, s) => acc + (s.content?.trim().split(/\s+/).filter(Boolean).length || 0), 0)
  }, [scenes]);

  const scrollToChapter = (chapId) => {
    const el = document.getElementById(`chapter-anchor-${chapId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToAct = (actId) => {
    const firstChap = chapters.find(c => c.actId === actId);
    if (firstChap) scrollToChapter(firstChap.id);
  };

  const handleSplitScene = (sceneId, chapterId, textBefore, textAfter) => {
    updateSceneContent(sceneId, textBefore);
    const newScene = addScene(chapterId, `Scene`);
    setTimeout(() => {
      updateSceneContent(newScene.id, textAfter);
      editorRefs.current[newScene.id]?.focus();
      editorRefs.current[newScene.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleAddScene = (chapterId) => {
    const newScene = addScene(chapterId, `Scene`);
    setTimeout(() => {
      editorRefs.current[newScene.id]?.focus();
      editorRefs.current[newScene.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="relative flex h-full bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-serif transition-colors duration-300">

      {/* Sidebar toggle button — positioned relative to Manuscript container */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 z-50 p-2 bg-[var(--bg-nav)] border border-[var(--border)] rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Outline sidebar */}
      <aside className={`${sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full'} transition-all duration-300 ease-in-out bg-[var(--bg-nav)] border-r border-[var(--border)] flex flex-col flex-shrink-0 font-sans relative z-40`}>
        <div className="p-4 pl-14 border-b border-[var(--border)] flex justify-between items-center sticky top-0 bg-[var(--bg-nav)] z-10">
          <h2 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">Outline</h2>
          <button onClick={() => addAct(`Act ${acts.length + 1}`)} className="text-[var(--accent)] text-xs font-bold">+ ACT</button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6 pb-24">
          {acts.map(act => (
            <div key={act.id} className="space-y-2">
              <div className="flex justify-between items-center px-2 py-1.5 rounded border border-[var(--border)] group" style={{ backgroundColor: 'var(--bg-hover)' }}>
                {editingId === act.id ? (
                  <InlineInput value={act.title} onSave={(t) => { updateAct(act.id, { title: t }); setEditingId(null); }} className="text-xs font-bold w-full" />
                ) : (
                  <span
                    onClick={() => scrollToAct(act.id)}
                    onDoubleClick={() => setEditingId(act.id)}
                    className="text-xs font-black text-[var(--text-main)] uppercase cursor-pointer hover:text-[var(--accent)] transition-colors flex-1"
                    title="Click to jump · Double-click to rename"
                  >
                    {act.title}
                  </span>
                )}
                <button onClick={() => addChapter(act.id, '')} className="text-[var(--text-muted)] text-xs opacity-0 group-hover:opacity-100 hover:text-[var(--accent)] ml-2">+</button>
              </div>

              {chapters.filter(c => c.actId === act.id).map(chap => (
                <div key={chap.id} className="ml-3 space-y-0.5 border-l border-[var(--border)] pl-2">
                  <div className="flex justify-between items-center px-2 py-1 group rounded hover:bg-[var(--bg-hover)]">
                    {editingId === chap.id ? (
                      <InlineInput value={chap.title} onSave={(t) => { updateChapter(chap.id, { title: t }); setEditingId(null); }} className="text-sm w-full" />
                    ) : (
                      <span
                        onClick={() => scrollToChapter(chap.id)}
                        onDoubleClick={() => setEditingId(chap.id)}
                        className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--accent)] truncate cursor-pointer transition-colors flex-1"
                        title="Click to jump · Double-click to rename"
                      >
                        {getChapterTitle(chap)}
                      </span>
                    )}
                    <button onClick={() => handleAddScene(chap.id)} className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--accent)] text-xs ml-1">+</button>
                  </div>

                  {scenes.filter(s => s.chapterId === chap.id).map((scene, idx) => (
                    <div key={scene.id} className="relative group/scene flex items-center">
                      <button
                        onClick={() => {
                          editorRefs.current[scene.id]?.focus();
                          editorRefs.current[scene.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[13px] truncate transition-all rounded ${activeSceneId === scene.id ? 'bg-[var(--accent-fade)] text-[var(--accent)] font-medium' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
                      >
                        {scene.title === 'Scene' ? `Scene ${idx + 1}` : scene.title}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-[var(--bg-nav)] border-t border-[var(--border)]">
          <div className="flex justify-between text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            <span>Word Count</span>
            <span className="text-[var(--accent)] font-mono">{totalWordCount.toLocaleString()}</span>
          </div>
        </div>
      </aside>

      {/* Main writing area */}
      <main className="flex-1 overflow-y-auto scroll-smooth cursor-text relative">
        <div className="max-w-3xl mx-auto py-24 px-8 md:px-12">
          {orderedScenes.map((scene, idx) => {
            const chapter = chapters.find(c => c.id === scene.chapterId);
            const isFirstInChapter = idx === 0 || orderedScenes[idx - 1].chapterId !== scene.chapterId;

            return (
              <section key={scene.id} className="relative group/section">

                {isFirstInChapter && (
                  <div id={`chapter-anchor-${chapter?.id}`} className="pt-16 pb-12 text-center font-sans sticky top-0 z-10" style={{ background: 'linear-gradient(to bottom, var(--bg-main) 70%, transparent)' }}>
                    <h2 className="text-[var(--accent)] opacity-80 text-xs font-black uppercase tracking-[0.6em] mb-4">
                      {chapter ? getChapterTitle(chapter) : ''}
                    </h2>
                    <div className="w-8 h-[2px] bg-[var(--border)] mx-auto rounded-full" />
                  </div>
                )}

                <div className="relative">
                  <SceneEditor
                    scene={scene}
                    onUpdate={updateSceneContent}
                    onSplit={handleSplitScene}
                    setCommandHint={() => {}}
                    innerRef={proxy => { editorRefs.current[scene.id] = proxy; }}
                    onFocus={() => setActiveSceneId(scene.id)}
                    entityMap={entityMap}
                    onEntityClick={handleEntityClick}
                  />
                </div>

                <div className="py-16 flex flex-col items-center justify-center opacity-30 hover:opacity-100 transition-all group/asterism">
                  <div className="flex gap-4 mb-3">
                    <div className="w-12 h-px bg-gradient-to-r from-transparent to-[var(--border)] group-hover/asterism:to-[var(--accent)]" />
                    <div className="flex gap-2 -mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)] group-hover/asterism:bg-[var(--accent)]" />
                      <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] group-hover/asterism:bg-[var(--accent)]" />
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--border)] group-hover/asterism:bg-[var(--accent)]" />
                    </div>
                    <div className="w-12 h-px bg-gradient-to-l from-transparent to-[var(--border)] group-hover/asterism:to-[var(--accent)]" />
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .manuscript-input {
          width: 100%;
          background: transparent;
          color: var(--text-main);
          font-family: 'Georgia', 'Times New Roman', Times, serif;
          font-size: 20px;
          line-height: 2.1;
          min-height: 2.2em;
          resize: none;
          outline: none;
          border: none;
          padding: 0;
          margin: 0;
          overflow: hidden;
          white-space: pre-wrap;
          transition: color 0.3s ease;
        }
        .manuscript-input::placeholder {
          color: var(--text-muted);
          font-style: italic;
          opacity: 0.5;
        }
        .manuscript-preview {
          font-family: 'Georgia', 'Times New Roman', Times, serif;
          font-size: 20px;
          line-height: 2.1;
          min-height: 2.2em;
          color: var(--text-main);
          white-space: pre-wrap;
          word-break: break-word;
          cursor: text;
          padding: 0;
          margin: 0;
        }
        .manuscript-placeholder {
          font-family: 'Georgia', 'Times New Roman', Times, serif;
          font-size: 20px;
          line-height: 2.1;
          color: var(--text-muted);
          font-style: italic;
          opacity: 0.5;
        }
        .entity-link {
          color: var(--accent);
          text-decoration: underline;
          text-decoration-style: dotted;
          text-underline-offset: 3px;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .entity-link:hover {
          opacity: 0.75;
        }
      `}} />
    </div>
  );
}
