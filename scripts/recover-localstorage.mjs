import fs from 'node:fs'

const input = process.argv[2]
const output = process.argv[3] || 'novelforge-recovery.json'

if (!input) {
  console.error('Usage: node scripts/recover-localstorage.mjs <leveldb-file> [output]')
  process.exit(1)
}

const text = fs.readFileSync(input).toString('utf8')

function readJsonAt(source, start) {
  const first = source[start]

  if (first === '"') {
    let escaped = false
    for (let i = start + 1; i < source.length; i += 1) {
      const ch = source[i]
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        return source.slice(start, i + 1)
      }
    }
    return null
  }

  if (source.startsWith('null', start)) return 'null'
  if (first !== '[' && first !== '{') return null

  const stack = [first === '[' ? ']' : '}']
  let inString = false
  let escaped = false

  for (let i = start + 1; i < source.length; i += 1) {
    const ch = source[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') inString = true
    else if (ch === '[') stack.push(']')
    else if (ch === '{') stack.push('}')
    else if (ch === stack[stack.length - 1]) {
      stack.pop()
      if (stack.length === 0) return source.slice(start, i + 1)
    }
  }

  return null
}

function classify(value) {
  if (value === null) return 'null'
  if (typeof value === 'string') {
    if (/^[a-z0-9]+$/i.test(value)) return 'id-string'
    return 'string'
  }
  if (!Array.isArray(value)) return 'object'
  if (value.length === 0) return 'empty-array'

  const item = value.find((entry) => entry && typeof entry === 'object')
  if (!item) return 'array'
  if ('content' in item && 'chapterId' in item) return 'scenes'
  if ('actId' in item) return 'chapters'
  if ('order' in item && 'synopsis' in item) return 'acts'
  if ('role' in item && 'parentIds' in item) return 'characters'
  if ('familyGroup' in item && 'relationships' in item) return 'characters'
  if ('category' in item && 'characterIds' in item) return 'loreEntries'
  if ('date' in item && 'characterIds' in item) return 'timeline'
  if ('name' in item && 'createdAt' in item && !('novelId' in item)) return 'novels'
  if ('name' in item && 'novelId' in item && ('description' in item || 'category' in item)) return 'locations'
  if ('name' in item && 'novelId' in item && ('iconId' in item || 'logo' in item)) return 'factions'
  return 'array'
}

const candidates = []
const starts = []

for (let i = 0; i < text.length; i += 1) {
  const ch = text[i]
  if (ch === '[' || ch === '{' || ch === '"' || text.startsWith('null', i)) starts.push(i)
}

for (const start of starts) {
  const raw = readJsonAt(text, start)
  if (!raw || raw.length < 2) continue

  try {
    const value = JSON.parse(raw)
    const kind = classify(value)
    if (
      kind === 'empty-array' ||
      (kind === 'string' && raw.length < 8) ||
      (kind === 'id-string' && raw.length < 8)
    ) continue

    candidates.push({
      offset: start,
      kind,
      length: raw.length,
      count: Array.isArray(value) ? value.length : undefined,
      preview: Array.isArray(value)
        ? value.slice(0, 3).map((entry) => entry?.name || entry?.title || entry?.id || entry).filter(Boolean)
        : value,
      value,
    })
  } catch {
    // Not a complete JSON value at this byte.
  }
}

const best = {}
for (const candidate of candidates) {
  if (!best[candidate.kind] || candidate.length > best[candidate.kind].length) {
    best[candidate.kind] = candidate
  }
}

const recovered = {
  recoveredAt: new Date().toISOString(),
  source: input,
  summary: Object.fromEntries(
    Object.entries(best).map(([key, candidate]) => [
      key,
      {
        offset: candidate.offset,
        length: candidate.length,
        count: candidate.count,
        preview: candidate.preview,
      },
    ])
  ),
  data: {
    novels: best.novels?.value ?? [],
    characters: best.characters?.value ?? [],
    factions: best.factions?.value ?? [],
    locations: best.locations?.value ?? [],
    timeline: best.timeline?.value ?? [],
    worldHistory: best.worldHistory?.value ?? [],
    acts: best.acts?.value ?? [],
    chapters: best.chapters?.value ?? [],
    scenes: best.scenes?.value ?? [],
    loreEntries: best.loreEntries?.value ?? [],
    activeNovelId: best['id-string']?.value ?? null,
  },
  candidates: candidates
    .map(({ value, ...candidate }) => candidate)
    .sort((a, b) => b.length - a.length)
    .slice(0, 100),
}

fs.writeFileSync(output, `${JSON.stringify(recovered, null, 2)}\n`)
console.log(`Wrote ${output}`)
console.log(JSON.stringify(recovered.summary, null, 2))
