// ── Provider definitions ─────────────────────────────────────────────────────

export const PROVIDERS = {
  google: {
    label: 'Google AI Studio',
    keyPlaceholder: 'AIza...',
    models: [
      'gemma-3-27b-it',
      'gemma-3-12b-it',
      'gemma-3-4b-it',
      'gemma-3-1b-it',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ],
    hasBaseUrl: false,
  },
  anthropic: {
    label: 'Anthropic',
    keyPlaceholder: 'sk-ant-...',
    models: [
      'claude-sonnet-4-6',
      'claude-opus-4-7',
      'claude-haiku-4-5-20251001',
    ],
    hasBaseUrl: false,
  },
  openai: {
    label: 'OpenAI-compatible',
    keyPlaceholder: 'sk-...',
    models: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
    ],
    hasBaseUrl: true,
    baseUrlPlaceholder: 'https://api.openai.com  (or your custom endpoint)',
  },
}

export const DEFAULT_SETTINGS = {
  provider: 'google',
  model: 'gemma-3-27b-it',
  apiKey: '',
  baseUrl: '',
}

// ── Streaming implementations ────────────────────────────────────────────────

async function streamGoogle({ apiKey, model, systemPrompt, messages, onChunk, onDone, onError }) {
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body = {
    contents,
    ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
    generationConfig: { maxOutputTokens: 4096 },
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      let errMsg = `API error (${response.status})`
      try { const d = await response.json(); errMsg = d.error?.message || errMsg } catch {}
      onError(errMsg); return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (!data) continue
        try {
          const parsed = JSON.parse(data)
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) onChunk(text)
          if (parsed.candidates?.[0]?.finishReason) { onDone(); return }
        } catch {}
      }
    }
    onDone()
  } catch (err) {
    onError(err.message || 'Network error')
  }
}

async function streamAnthropic({ apiKey, model, systemPrompt, messages, onChunk, onDone, onError }) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        stream: true,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!response.ok) {
      let errMsg = `API error (${response.status})`
      try { const d = await response.json(); errMsg = d.error?.message || errMsg } catch {}
      onError(errMsg); return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (!data) continue
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') onChunk(parsed.delta.text)
          if (parsed.type === 'message_stop') { onDone(); return }
        } catch {}
      }
    }
    onDone()
  } catch (err) {
    onError(err.message || 'Network error')
  }
}

async function streamOpenAI({ apiKey, model, baseUrl, systemPrompt, messages, onChunk, onDone, onError }) {
  const apiMessages = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ]

  const base = (baseUrl || 'https://api.openai.com').replace(/\/$/, '')

  try {
    const response = await fetch(`${base}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: apiMessages, stream: true, max_tokens: 4096 }),
    })

    if (!response.ok) {
      let errMsg = `API error (${response.status})`
      try { const d = await response.json(); errMsg = d.error?.message || errMsg } catch {}
      onError(errMsg); return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') { onDone(); return }
        if (!data) continue
        try {
          const parsed = JSON.parse(data)
          const text = parsed.choices?.[0]?.delta?.content
          if (text) onChunk(text)
          if (parsed.choices?.[0]?.finish_reason) { onDone(); return }
        } catch {}
      }
    }
    onDone()
  } catch (err) {
    onError(err.message || 'Network error')
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export function streamMessage(settings, { systemPrompt, messages, onChunk, onDone, onError }) {
  const { provider, apiKey, model, baseUrl } = settings
  const args = { apiKey, model, baseUrl, systemPrompt, messages, onChunk, onDone, onError }
  if (provider === 'google') return streamGoogle(args)
  if (provider === 'anthropic') return streamAnthropic(args)
  return streamOpenAI(args)
}

export function buildSystemPrompt(novel, context, store) {
  const lines = [
    `You are a creative writing assistant for the novel "${novel?.title || 'Untitled'}".`,
    novel?.description ? `Premise: ${novel.description}` : '',
    'Help with writing, plot, character development, world-building, and any creative task.',
  ].filter(Boolean)

  const { characterIds, locationIds, loreEntryIds, chapterIds, customInstruction } = context

  if (characterIds?.length) {
    const chars = (store.characters || []).filter(c => characterIds.includes(c.id))
    if (chars.length) {
      lines.push('\n--- CHARACTERS ---')
      chars.forEach(c => {
        lines.push(`\n${c.name}${c.role ? ` — ${c.role}` : ''}`)
        if (c.familyGroup) lines.push(`Family: ${c.familyGroup}`)
        if (c.bio) lines.push(c.bio)
        if (c.keywords?.length) lines.push(`Also known as: ${c.keywords.join(', ')}`)
      })
    }
  }

  if (locationIds?.length) {
    const locs = (store.locations || []).filter(l => locationIds.includes(l.id))
    if (locs.length) {
      lines.push('\n--- LOCATIONS ---')
      locs.forEach(l => {
        lines.push(`\n${l.name}${l.category ? ` (${l.category})` : ''}`)
        if (l.description) lines.push(l.description)
      })
    }
  }

  if (loreEntryIds?.length) {
    const entries = (store.loreEntries || []).filter(e => loreEntryIds.includes(e.id))
    if (entries.length) {
      lines.push('\n--- LORE ---')
      entries.forEach(e => {
        lines.push(`\n${e.title}${e.category ? ` (${e.category})` : ''}`)
        if (e.content) lines.push(e.content)
      })
    }
  }

  if (chapterIds?.length) {
    lines.push('\n--- MANUSCRIPT ---')
    chapterIds.forEach(chapId => {
      const chap = (store.chapters || []).find(c => c.id === chapId)
      if (!chap) return
      const num = (store.chapters || []).findIndex(c => c.id === chapId) + 1
      lines.push(`\n[Chapter ${num}${chap.title ? `: ${chap.title}` : ''}]`)
      ;(store.scenes || []).filter(s => s.chapterId === chapId).forEach(s => {
        if (s.content?.trim()) lines.push(s.content)
      })
    })
  }

  if (customInstruction?.trim()) lines.push(`\n--- ADDITIONAL CONTEXT ---\n${customInstruction.trim()}`)

  return lines.join('\n')
}
