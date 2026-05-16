import { useMemo, useState } from 'react'
import { StudioBoard, StudioEmpty } from '../presentation/Studio'

const formatNumber = (value) => new Intl.NumberFormat().format(value || 0)
const READ_WPM = 220

const countWords = value => value?.trim().match(/\S+/g)?.length || 0
const toDateKey = value => {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const startOfDay = value => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}
const shiftDate = (base, offset) => {
  const date = new Date(base)
  date.setDate(date.getDate() + offset)
  return date
}
const formatShortDate = key => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${key}T00:00:00`))
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getSceneTimestamp = scene => {
  const raw = scene.lastModified || scene.updatedAt || scene.createdAt || scene.created
  const timestamp = typeof raw === 'number' ? raw : Date.parse(raw)
  return Number.isFinite(timestamp) ? timestamp : Date.now()
}

const syncCurrentSceneHistory = (scene, history) => {
  const currentWords = countWords(scene.content || '')
  const timestamp = getSceneTimestamp(scene)
  const latest = history[history.length - 1]
  if (latest && (latest.words === currentWords || timestamp < latest.timestamp)) return history

  const entry = {
    date: toDateKey(timestamp),
    words: currentWords,
    timestamp,
  }

  if (latest?.date === entry.date) {
    return history.map((item, index) => index === history.length - 1 ? entry : item)
  }
  return [...history, entry].slice(-120)
}

const getSceneHistory = scene => {
  if (Array.isArray(scene.wordHistory) && scene.wordHistory.length) {
    const history = scene.wordHistory
      .map(entry => ({
        date: entry.date || toDateKey(entry.timestamp || Date.now()),
        words: Number(entry.words) || 0,
        timestamp: entry.timestamp || Date.parse(entry.date || '') || Date.now(),
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
    return syncCurrentSceneHistory(scene, history)
  }
  return [{
    date: toDateKey(getSceneTimestamp(scene)),
    words: countWords(scene.content || ''),
    timestamp: getSceneTimestamp(scene),
  }]
}

const buildWritingAnalytics = (stats, dailyGoal) => {
  const today = startOfDay(Date.now())
  const dateKeys = Array.from({ length: 35 }, (_, index) => toDateKey(shiftDate(today, index - 34)))
  const dailyWords = Object.fromEntries(dateKeys.map(key => [key, 0]))

  stats.scenes.forEach(scene => {
    const history = getSceneHistory(scene)
    history.forEach((entry, index) => {
      const previous = index > 0 ? history[index - 1].words : 0
      const delta = Math.max(0, entry.words - previous)
      if (dailyWords[entry.date] !== undefined) dailyWords[entry.date] += delta
    })
  })

  const progression = dateKeys.slice(-14).map(key => {
    const end = Date.parse(`${key}T23:59:59`)
    const words = stats.scenes.reduce((sum, scene) => {
      const history = getSceneHistory(scene).filter(entry => entry.timestamp <= end)
      if (history.length) return sum + history[history.length - 1].words
      return sum
    }, 0)
    return { date: key, words }
  })

  const todayKey = toDateKey(today)
  const todayWords = dailyWords[todayKey] || 0
  const goal = Math.max(1, Number(dailyGoal) || 1)
  const heatmapMax = Math.max(1, ...Object.values(dailyWords))

  return {
    dailyWords,
    progression,
    todayWords,
    goalProgress: Math.min(100, Math.round((todayWords / goal) * 100)),
    heatmapMax,
    activeDays: Object.values(dailyWords).filter(Boolean).length,
  }
}

const countSyllables = word => {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!cleaned) return 0
  const groups = cleaned.replace(/e$/, '').match(/[aeiouy]+/g)
  return Math.max(1, groups?.length || 1)
}

const buildReadability = scenes => {
  const text = scenes.map(scene => scene.content || '').join(' ').trim()
  const words = text.match(/\S+/g) || []
  const sentences = text.split(/[.!?]+/).filter(part => part.trim().length > 0)
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0)
  const wordCount = Math.max(1, words.length)
  const sentenceCount = Math.max(1, sentences.length)
  const flesch = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount)
  const grade = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllables / wordCount) - 15.59
  const label = flesch >= 70 ? 'Easy' : flesch >= 50 ? 'Moderate' : 'Dense'
  return {
    flesch: Math.round(Math.max(0, Math.min(100, flesch))),
    grade: Math.max(0, grade).toFixed(1),
    label,
    avgSentence: Math.round(wordCount / sentenceCount),
  }
}

const buildCharacterFocus = stats => {
  const characters = stats.characters.map(character => {
    const terms = [character.name, ...(character.keywords || [])]
      .filter(Boolean)
      .map(escapeRegExp)
    if (!terms.length) return null
    const pattern = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi')
    let mentions = 0
    let scenes = 0
    let allocatedWords = 0

    stats.scenes.forEach(scene => {
      const content = scene.content || ''
      const sceneMentions = content.match(pattern)?.length || 0
      if (!sceneMentions) return
      mentions += sceneMentions
      scenes += 1
      allocatedWords += countWords(content)
    })

    return {
      id: character.id,
      name: character.name,
      role: character.role,
      mentions,
      scenes,
      words: allocatedWords,
      minutes: Math.round(allocatedWords / READ_WPM),
    }
  }).filter(Boolean)

  return characters
    .filter(item => item.mentions > 0)
    .sort((a, b) => b.words - a.words || b.mentions - a.mentions)
    .slice(0, 8)
}

const LedgerRow = ({ label, value }) => (
  <div className="overview-row">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
)

const Stat = ({ label, value, detail }) => (
  <div className="overview-stat">
    <span>{label}</span>
    <strong>{value}</strong>
    {detail && <small>{detail}</small>}
  </div>
)

const Sparkline = ({ points }) => {
  const max = Math.max(1, ...points.map(point => point.words))
  return (
    <div className="analytics-sparkline" aria-label="Word count progression">
      {points.map(point => (
        <span
          key={point.date}
          title={`${formatShortDate(point.date)}: ${formatNumber(point.words)} words`}
          style={{ height: `${Math.max(8, (point.words / max) * 100)}%` }}
        />
      ))}
    </div>
  )
}

const ActivityHeatmap = ({ dailyWords, heatmapMax }) => (
  <div className="analytics-heatmap" aria-label="Writing activity heatmap">
    {Object.entries(dailyWords).map(([date, words]) => (
      <span
        key={date}
        title={`${formatShortDate(date)}: ${formatNumber(words)} words`}
        data-level={words === 0 ? 0 : Math.max(1, Math.ceil((words / heatmapMax) * 4))}
      />
    ))}
  </div>
)

export default function ProjectDashboard({ store }) {
  const stats = store.activeProjectStats
  const [dailyGoal, setDailyGoal] = useState(() => localStorage.getItem('nf-daily-word-goal') || '500')
  const analytics = useMemo(() => stats ? buildWritingAnalytics(stats, dailyGoal) : null, [stats, dailyGoal])
  const readability = useMemo(() => stats ? buildReadability(stats.scenes) : null, [stats])
  const characterFocus = useMemo(() => stats ? buildCharacterFocus(stats) : [], [stats])
  if (!stats) return null

  const project = stats.project
  const recentScenes = [...stats.scenes]
    .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
    .slice(0, 5)
  const hasPlanning = stats.planningItems > 0 || stats.acts.length > 0 || stats.scenes.length > 0
  const maxCharacterWords = Math.max(1, ...characterFocus.map(item => item.words))

  const updateDailyGoal = value => {
    const next = value.replace(/[^\d]/g, '')
    setDailyGoal(next)
    localStorage.setItem('nf-daily-word-goal', next)
  }

  return (
    <StudioBoard className="overview-board">
      <div className="overview-layout">
        <header className="overview-hero">
          <div>
            <p className="studio-kicker">{stats.projectType.label}</p>
            <h1>{project.title}</h1>
            <p>{project.description || 'No project description yet.'}</p>
          </div>
          <div className="overview-status">
            <span>{formatNumber(stats.manuscriptWords)} words</span>
            <span>{stats.updatedLabel}</span>
          </div>
        </header>

        <section className="overview-strip">
          <Stat label="Words" value={formatNumber(stats.manuscriptWords)} detail="Draft total" />
          <Stat label="Scenes" value={formatNumber(stats.scenes.length)} detail={`${stats.acts.length} acts, ${stats.chapters.length} chapters`} />
          <Stat label="Characters" value={formatNumber(stats.characters.length)} detail={`${stats.factions.length} factions`} />
          <Stat label="Atlas" value={formatNumber(stats.locations.length)} detail={`${stats.maps.length} maps`} />
        </section>

        <div className="overview-columns">
          <section className="overview-section panel-soft">
            <div className="overview-section-head">
              <div>
                <p className="studio-kicker">Project</p>
                <h2>Details</h2>
              </div>
            </div>
            <div className="overview-list">
            <LedgerRow label="Created" value={stats.createdLabel} />
            <LedgerRow label="Updated" value={stats.updatedLabel} />
            <LedgerRow label="Project type" value={stats.projectType.label} />
            <LedgerRow label="Words" value={formatNumber(stats.manuscriptWords)} />
            </div>
          </section>

          <section className="overview-section panel-soft">
            <div className="overview-section-head">
              <div>
                <p className="studio-kicker">Reference</p>
                <h2>World Material</h2>
              </div>
            </div>
            <div className="overview-list">
              <LedgerRow label="Lore entries" value={formatNumber(stats.loreEntries.length)} />
              <LedgerRow label="History events" value={formatNumber(stats.worldHistory.length)} />
              <LedgerRow label="Notes" value={formatNumber(stats.ideaEntries.length)} />
            </div>
          </section>

          <section className="overview-section overview-section-wide panel-soft">
            <div className="overview-section-head">
              <div>
                <p className="studio-kicker">Recent Draft</p>
                <h2>Scenes</h2>
              </div>
            </div>
            <div className="overview-scene-list">
              {recentScenes.length > 0 ? recentScenes.map(scene => (
                <div key={scene.id} className="overview-scene">
                  <span>{scene.title || 'Untitled scene'}</span>
                  <small>{formatNumber((scene.content || '').trim().match(/\S+/g)?.length || 0)} words</small>
                </div>
              )) : (
                <StudioEmpty title="No manuscript scenes yet" />
              )}
            </div>
          </section>

          <section className="overview-section overview-section-wide panel-soft analytics-dashboard">
            <div className="overview-section-head">
              <div>
                <p className="studio-kicker">Writing Analytics</p>
                <h2>Progress</h2>
              </div>
              <label className="analytics-goal">
                <span>Daily goal</span>
                <input
                  value={dailyGoal}
                  onChange={event => updateDailyGoal(event.target.value)}
                  inputMode="numeric"
                  aria-label="Daily writing goal"
                />
              </label>
            </div>

            <div className="analytics-grid">
              <div className="analytics-card analytics-card-wide">
                <div className="analytics-card-head">
                  <span>Word progression</span>
                  <strong>{formatNumber(stats.manuscriptWords)}</strong>
                </div>
                <Sparkline points={analytics.progression} />
                <small>Estimated from scene word history and edit dates.</small>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-head">
                  <span>Today</span>
                  <strong>{formatNumber(analytics.todayWords)}</strong>
                </div>
                <div className="analytics-goal-meter">
                  <span style={{ width: `${analytics.goalProgress}%` }} />
                </div>
                <small>{analytics.goalProgress}% of {formatNumber(Number(dailyGoal) || 0)} words</small>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-head">
                  <span>Activity</span>
                  <strong>{analytics.activeDays} days</strong>
                </div>
                <ActivityHeatmap dailyWords={analytics.dailyWords} heatmapMax={analytics.heatmapMax} />
                <small>Last 35 days</small>
              </div>

              <div className="analytics-card">
                <div className="analytics-card-head">
                  <span>Readability</span>
                  <strong>{readability.flesch}</strong>
                </div>
                <div className="analytics-readability">
                  <span>{readability.label}</span>
                  <small>Grade {readability.grade} · {readability.avgSentence} words/sentence</small>
                </div>
              </div>

              <div className="analytics-card analytics-card-wide character-focus-card">
                <div className="analytics-card-head">
                  <span>Character focus</span>
                  <strong>{characterFocus.length || 0}</strong>
                </div>
                <div className="character-focus-list">
                  {characterFocus.length ? characterFocus.map(item => (
                    <div key={item.id} className="character-focus-row">
                      <div>
                        <strong>{item.name}</strong>
                        <small>{formatNumber(item.words)} words · {item.scenes} scenes · {item.minutes} min read</small>
                      </div>
                      <span>{item.mentions}</span>
                      <div className="character-focus-bar">
                        <i style={{ width: `${Math.max(5, (item.words / maxCharacterWords) * 100)}%` }} />
                      </div>
                    </div>
                  )) : (
                    <p className="analytics-empty">No character names or keywords appear in the manuscript yet.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {!hasPlanning && (
          <StudioEmpty title="Nothing here yet" body="Add the first characters, locations, scenes, or notes when you are ready." />
        )}
      </div>
    </StudioBoard>
  )
}
