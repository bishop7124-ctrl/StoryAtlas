import { useState, useEffect, useRef, useMemo } from 'react'
import { streamMessage, buildSystemPrompt, PROVIDERS } from '../../utils/aiApi'

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const load = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def } }
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val))

const DEFAULT_SETTINGS = {
  activeProvider: 'google',
  google:    { apiKey: '', model: 'gemma-3-27b-it' },
  anthropic: { apiKey: '', model: 'claude-sonnet-4-6' },
  openai:    { apiKey: '', model: '', baseUrl: 'https://api.openai.com/v1' },
}

// ── Provider Settings ─────────────────────────────────────────────────────────

function ProviderSettings({ settings, onSave, onCancel }) {
  const [local, setLocal] = useState(settings)
  const active = local.activeProvider
  const prov = PROVIDERS[active]
  const cfg = local[active]

  const update = (field, val) =>
    setLocal(prev => ({ ...prev, [active]: { ...prev[active], [field]: val } }))

  const hasKey = !!cfg.apiKey.trim()

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
        <h3 className="font-bold text-[var(--text-main)] text-sm">AI Settings</h3>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Keys are stored locally and sent only to the chosen provider.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Provider tabs */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Provider</label>
          <div className="flex gap-1 p-1 bg-[var(--bg-main)] rounded-lg border border-[var(--border)]">
            {Object.entries(PROVIDERS).map(([id, p]) => {
              const connected = !!local[id]?.apiKey?.trim()
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLocal(prev => ({ ...prev, activeProvider: id }))}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all relative ${
                    active === id
                      ? 'bg-[var(--accent)] text-[var(--bg-main)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {p.name.split(' ')[0]}
                  {connected && (
                    <span className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${active === id ? 'bg-[var(--bg-main)]/60' : 'bg-[var(--accent)]'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Model */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Model</label>
          <input
            list={`models-${active}`}
            value={cfg.model}
            onChange={e => update('model', e.target.value)}
            placeholder={`e.g. ${prov.defaultModel}`}
            className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
          />
          <datalist id={`models-${active}`}>
            {prov.models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </datalist>
        </div>

        {/* Base URL (OpenAI-compatible only) */}
        {prov.hasBaseUrl && (
          <div>
            <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Base URL</label>
            <input
              value={cfg.baseUrl || ''}
              onChange={e => update('baseUrl', e.target.value)}
              placeholder={PROVIDERS.openai.defaultBaseUrl}
              className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Works with Groq, Together, Mistral, Ollama, and any OpenAI-compatible endpoint.</p>
          </div>
        )}

        {/* API Key */}
        <div>
          <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">
            API Key {hasKey && <span className="text-[var(--accent)] normal-case font-normal">· saved</span>}
          </label>
          <input
            type="password"
            value={cfg.apiKey}
            onChange={e => update('apiKey', e.target.value)}
            placeholder={prov.keyPlaceholder}
            className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[var(--border)] flex gap-2 flex-shrink-0">
        <button
          onClick={() => onSave(local)}
          className="flex-1 bg-[var(--accent)] text-[var(--bg-main)] font-bold py-2 rounded text-sm hover:opacity-90"
        >
          Save
        </button>
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2 text-[var(--text-muted)] text-sm hover:text-[var(--text-main)]">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

// ── Context Selector ──────────────────────────────────────────────────────────

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-main)] transition-colors"
      >
        {title}
        <span className="text-[var(--accent)] text-base leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="p-3 bg-[var(--bg-nav)] space-y-1">{children}</div>}
    </div>
  )
}

function CheckItem({ label, sub, checked, onChange }) {
  return (
    <label className="flex items-start gap-2 cursor-pointer group py-0.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-0.5 accent-[var(--accent)] flex-shrink-0" />
      <span className="text-sm text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors leading-tight">
        {label}
        {sub && <span className="block text-[11px] text-[var(--text-muted)]">{sub}</span>}
      </span>
    </label>
  )
}

function ContextSelector({ store, onStart, onCancel, initialContext }) {
  const [ctx, setCtx] = useState(initialContext || {
    characterIds: [], locationIds: [], loreEntryIds: [], chapterIds: [], customInstruction: '',
  })

  const toggle = (field, id) => setCtx(prev => {
    const arr = prev[field]
    return { ...prev, [field]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] }
  })
  const selectAll = (field, ids) => setCtx(prev => ({ ...prev, [field]: ids }))
  const clearAll  = (field)      => setCtx(prev => ({ ...prev, [field]: [] }))

  const { characters, locations, loreEntries, chapters, acts } = store

  const chaptersByAct = useMemo(() => {
    const map = {}
    acts.forEach(act => { map[act.id] = { act, chapters: chapters.filter(c => c.actId === act.id) } })
    return map
  }, [acts, chapters])

  const loreByCategory = useMemo(() => {
    const map = {}
    loreEntries.forEach(e => {
      const cat = e.category || 'Uncategorized'
      if (!map[cat]) map[cat] = []
      map[cat].push(e)
    })
    return map
  }, [loreEntries])

  const total = ctx.characterIds.length + ctx.locationIds.length + ctx.loreEntryIds.length + ctx.chapterIds.length

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
        <h3 className="font-bold text-[var(--text-main)] text-sm">Configure context for this chat</h3>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Choose what the AI knows about your novel.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {characters.length > 0 && (
          <Section title={`Characters${ctx.characterIds.length ? ` (${ctx.characterIds.length})` : ''}`} defaultOpen={ctx.characterIds.length > 0}>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => selectAll('characterIds', characters.map(c => c.id))} className="text-[10px] text-[var(--accent)] hover:underline">All</button>
              <button type="button" onClick={() => clearAll('characterIds')} className="text-[10px] text-[var(--text-muted)] hover:underline">None</button>
            </div>
            {characters.map(c => <CheckItem key={c.id} label={c.name} sub={c.role} checked={ctx.characterIds.includes(c.id)} onChange={() => toggle('characterIds', c.id)} />)}
          </Section>
        )}

        {locations.length > 0 && (
          <Section title={`Locations${ctx.locationIds.length ? ` (${ctx.locationIds.length})` : ''}`} defaultOpen={ctx.locationIds.length > 0}>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => selectAll('locationIds', locations.map(l => l.id))} className="text-[10px] text-[var(--accent)] hover:underline">All</button>
              <button type="button" onClick={() => clearAll('locationIds')} className="text-[10px] text-[var(--text-muted)] hover:underline">None</button>
            </div>
            {locations.map(l => <CheckItem key={l.id} label={l.name} sub={l.category} checked={ctx.locationIds.includes(l.id)} onChange={() => toggle('locationIds', l.id)} />)}
          </Section>
        )}

        {loreEntries.length > 0 && (
          <Section title={`Lore${ctx.loreEntryIds.length ? ` (${ctx.loreEntryIds.length})` : ''}`} defaultOpen={ctx.loreEntryIds.length > 0}>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => selectAll('loreEntryIds', loreEntries.map(e => e.id))} className="text-[10px] text-[var(--accent)] hover:underline">All</button>
              <button type="button" onClick={() => clearAll('loreEntryIds')} className="text-[10px] text-[var(--text-muted)] hover:underline">None</button>
            </div>
            {Object.entries(loreByCategory).map(([cat, entries]) => (
              <div key={cat}>
                <div className="text-[10px] text-[var(--accent)] uppercase tracking-wider mb-1 mt-2">{cat}</div>
                {entries.map(e => <CheckItem key={e.id} label={e.title} checked={ctx.loreEntryIds.includes(e.id)} onChange={() => toggle('loreEntryIds', e.id)} />)}
              </div>
            ))}
          </Section>
        )}

        {chapters.length > 0 && (
          <Section title={`Manuscript${ctx.chapterIds.length ? ` (${ctx.chapterIds.length} chapters)` : ''}`} defaultOpen={ctx.chapterIds.length > 0}>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => selectAll('chapterIds', chapters.map(c => c.id))} className="text-[10px] text-[var(--accent)] hover:underline">All</button>
              <button type="button" onClick={() => clearAll('chapterIds')} className="text-[10px] text-[var(--text-muted)] hover:underline">None</button>
            </div>
            {Object.values(chaptersByAct).map(({ act, chapters: actChaps }) => (
              <div key={act.id}>
                <div className="text-[10px] text-[var(--accent)] uppercase tracking-wider mb-1 mt-2">{act.title}</div>
                {actChaps.map((ch, i) => <CheckItem key={ch.id} label={ch.title || `Chapter ${i + 1}`} checked={ctx.chapterIds.includes(ch.id)} onChange={() => toggle('chapterIds', ch.id)} />)}
              </div>
            ))}
          </Section>
        )}

        <Section title="Custom instruction" defaultOpen={!!ctx.customInstruction}>
          <textarea
            value={ctx.customInstruction}
            onChange={e => setCtx(prev => ({ ...prev, customInstruction: e.target.value }))}
            placeholder="Tell the AI anything extra — tone, style, what you're working on…"
            rows={4}
            className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-2 py-1.5 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] resize-none"
          />
        </Section>
      </div>

      <div className="px-4 py-3 border-t border-[var(--border)] flex gap-2 flex-shrink-0">
        <button
          onClick={() => onStart(ctx)}
          className="flex-1 bg-[var(--accent)] text-[var(--bg-main)] font-bold py-2 rounded text-sm hover:opacity-90"
        >
          Start Chat{total > 0 ? ` · ${total} item${total !== 1 ? 's' : ''}` : ''}
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-[var(--text-muted)] text-sm hover:text-[var(--text-main)]">Cancel</button>
      </div>
    </div>
  )
}

// ── Chat View ─────────────────────────────────────────────────────────────────

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-[var(--accent)] text-[var(--bg-main)] rounded-br-sm'
          : 'bg-[var(--bg-nav)] border border-[var(--border)] text-[var(--text-main)] rounded-bl-sm'
      } ${msg.error ? 'border-red-500/50 text-red-400 bg-transparent' : ''}`}>
        {msg.content}
        {msg.streaming && <span className="inline-block w-1.5 h-3.5 bg-[var(--accent)] ml-0.5 animate-pulse rounded-sm align-middle" />}
      </div>
    </div>
  )
}

function ChatView({ session, store, aiSettings, onUpdate, onBack }) {
  const [input, setInput]     = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)
  const abortRef  = useRef(false)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [session.messages])

  const provider  = aiSettings.activeProvider
  const provCfg   = aiSettings[provider]
  const provLabel = PROVIDERS[provider]?.name || provider
  const modelLabel = provCfg.model || PROVIDERS[provider]?.defaultModel

  const systemPrompt = useMemo(
    () => buildSystemPrompt(store.activeNovel, session.context, store),
    [store, session.context]
  )

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput('')
    abortRef.current = false

    const userMsg      = { id: uid(), role: 'user',      content: text }
    const assistantMsg = { id: uid(), role: 'assistant', content: '', streaming: true }
    const nextMessages = [...session.messages, userMsg, assistantMsg]
    onUpdate(session.id, { messages: nextMessages })
    setStreaming(true)

    let accumulated = ''
    const apiMessages = [...session.messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    streamMessage({
      provider,
      apiKey:  provCfg.apiKey,
      model:   provCfg.model || PROVIDERS[provider]?.defaultModel,
      baseUrl: provCfg.baseUrl,
      systemPrompt,
      messages: apiMessages,
      onChunk: (chunk) => {
        if (abortRef.current) return
        accumulated += chunk
        onUpdate(session.id, {
          messages: nextMessages.map(m => m.id === assistantMsg.id ? { ...m, content: accumulated } : m),
        })
      },
      onDone: () => {
        setStreaming(false)
        onUpdate(session.id, {
          messages: nextMessages.map(m => m.id === assistantMsg.id ? { ...m, content: accumulated, streaming: false } : m),
        })
      },
      onError: (err) => {
        setStreaming(false)
        onUpdate(session.id, {
          messages: nextMessages.map(m => m.id === assistantMsg.id ? { ...m, content: `Error: ${err}`, streaming: false, error: true } : m),
        })
      },
    })
  }

  const contextCount = (session.context.characterIds?.length || 0) + (session.context.locationIds?.length || 0) +
    (session.context.loreEntryIds?.length || 0) + (session.context.chapterIds?.length || 0)

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2 flex-shrink-0">
        <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[var(--text-main)] truncate">{session.title}</div>
          <div className="text-[10px] text-[var(--text-muted)]">
            {provLabel} · {modelLabel}{contextCount > 0 ? ` · ${contextCount} context item${contextCount !== 1 ? 's' : ''}` : ''}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {session.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2 opacity-50">
            <div className="text-2xl">✦</div>
            <p className="text-xs text-[var(--text-muted)]">Ask anything about your novel.</p>
          </div>
        )}
        {session.messages.map(msg => <Message key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 pb-3 pt-2 border-t border-[var(--border)] flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask the AI…  (Shift+Enter for new line)"
            rows={2}
            disabled={streaming}
            className="flex-1 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] resize-none disabled:opacity-50 transition-colors"
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="h-9 w-9 flex items-center justify-center bg-[var(--accent)] text-[var(--bg-main)] rounded-lg disabled:opacity-40 hover:opacity-90 transition-all flex-shrink-0"
          >
            {streaming
              ? <span className="w-3 h-3 border-2 border-[var(--bg-main)]/40 border-t-[var(--bg-main)] rounded-full animate-spin" />
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Session List ──────────────────────────────────────────────────────────────

function SessionList({ sessions, aiSettings, onSelect, onNew, onDelete, onSettings }) {
  const provider  = aiSettings.activeProvider
  const provLabel = PROVIDERS[provider]?.name || provider
  const model     = aiSettings[provider]?.model || PROVIDERS[provider]?.defaultModel

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
        <div>
          <h3 className="font-bold text-[var(--text-main)] text-sm">Chats</h3>
          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{provLabel} · {model}</div>
        </div>
        <button
          onClick={onNew}
          className="text-xs font-bold text-[var(--accent)] bg-[var(--accent-fade)] border border-[var(--accent)]/30 px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
        >
          + New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 opacity-60">
            <div className="text-3xl">✦</div>
            <p className="text-sm text-[var(--text-muted)]">Start a new chat to get writing help from AI.</p>
          </div>
        )}
        {[...sessions].reverse().map(s => {
          const lastMsg = s.messages[s.messages.length - 1]
          const preview = lastMsg?.content?.slice(0, 70) || 'No messages yet'
          const total   = (s.context.characterIds?.length || 0) + (s.context.locationIds?.length || 0) +
            (s.context.loreEntryIds?.length || 0) + (s.context.chapterIds?.length || 0)
          return (
            <div
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer group transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--text-main)] truncate">{s.title}</div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{preview}</div>
                  {total > 0 && <div className="text-[10px] text-[var(--accent)] mt-1">{total} context item{total !== 1 ? 's' : ''}</div>}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(s.id) }}
                  className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Root Panel ────────────────────────────────────────────────────────────────

export default function AIPanel({ store, open, onClose, initialContext }) {
  const novelId = store.activeNovelId
  const [aiSettings, setAiSettings] = useState(() => load('nf_aiSettings', DEFAULT_SETTINGS))
  const [sessions,   setSessions]   = useState(() => load(`nf_chats_${novelId}`, []))
  const [view,       setView]       = useState('sessions') // 'sessions' | 'settings' | 'context' | 'chat'
  const [activeId,   setActiveId]   = useState(null)

  useEffect(() => { save('nf_aiSettings', aiSettings) }, [aiSettings])
  useEffect(() => { save(`nf_chats_${novelId}`, sessions) }, [sessions, novelId])

  const activeProvider = aiSettings.activeProvider
  const hasKey = !!aiSettings[activeProvider]?.apiKey?.trim()

  // Auto-show settings if active provider has no key
  useEffect(() => {
    if (open && !hasKey && view === 'sessions') setView('settings')
  }, [open, hasKey])

  const handleSaveSettings = (newSettings) => {
    setAiSettings(newSettings)
    setView('sessions')
  }

  const handleNewChat = () => setView('context')

  const handleContextConfirm = (ctx) => {
    const session = {
      id: uid(), novelId, title: `Chat ${sessions.length + 1}`,
      context: ctx, messages: [], createdAt: Date.now(),
    }
    setSessions(prev => [...prev, session])
    setActiveId(session.id)
    setView('chat')
  }

  const updateSession = (id, patch) =>
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))

  const deleteSession = (id) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeId === id) { setActiveId(null); setView('sessions') }
  }

  const activeSession = sessions.find(s => s.id === activeId) ?? null

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-[400px] bg-[var(--bg-nav)] border-l border-[var(--border)] z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[var(--accent)]">✦</span>
            <span className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setView(v => v === 'settings' ? (hasKey ? 'sessions' : 'settings') : 'settings')}
              className={`text-[10px] font-bold border px-2 py-0.5 rounded transition-colors ${
                view === 'settings'
                  ? 'text-[var(--accent)] border-[var(--accent)]/40'
                  : 'text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-main)]'
              }`}
            >
              {PROVIDERS[activeProvider]?.name.split(' ')[0] || 'Settings'}
            </button>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 rounded transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {view === 'settings' && (
            <ProviderSettings
              settings={aiSettings}
              onSave={handleSaveSettings}
              onCancel={hasKey ? () => setView('sessions') : null}
            />
          )}
          {view === 'context' && (
            <ContextSelector
              store={store}
              initialContext={initialContext}
              onStart={handleContextConfirm}
              onCancel={() => setView('sessions')}
            />
          )}
          {view === 'chat' && activeSession && (
            <ChatView
              session={activeSession}
              store={store}
              aiSettings={aiSettings}
              onUpdate={updateSession}
              onBack={() => { setActiveId(null); setView('sessions') }}
            />
          )}
          {view === 'sessions' && (
            <SessionList
              sessions={sessions}
              aiSettings={aiSettings}
              onSelect={(id) => { setActiveId(id); setView('chat') }}
              onNew={handleNewChat}
              onDelete={deleteSession}
            />
          )}
        </div>
      </div>
    </>
  )
}
