const StatTile = ({ label, value, detail }) => (
  <div className="panel p-4">
    <div className="font-serif text-3xl font-bold text-[var(--text-main)]">{value}</div>
    <div className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
    {detail && <div className="mt-2 text-xs text-[var(--text-muted)]">{detail}</div>}
  </div>
)

const InlineStat = ({ label, value }) => (
  <div>
    <div className="text-xl font-black text-[var(--text-main)]">{value}</div>
    <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{label}</div>
  </div>
)

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] py-2 last:border-b-0">
    <span className="text-sm text-[var(--text-muted)]">{label}</span>
    <span className="text-sm font-semibold text-[var(--text-main)]">{value}</span>
  </div>
)

const formatNumber = (value) => new Intl.NumberFormat().format(value || 0)

export default function ProjectDashboard({ store }) {
  const stats = store.activeProjectStats
  if (!stats) return null

  const project = stats.project
  const recentScenes = [...stats.scenes]
    .sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))
    .slice(0, 4)
  const hasPlanning = stats.planningItems > 0 || stats.acts.length > 0 || stats.scenes.length > 0

  return (
    <div className="workspace-page">
      <div className="workspace-inner flex flex-col gap-6">
        <header className="page-header">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-3">
              <span className="icon-mark">{stats.projectType.label.slice(0, 1)}</span>
              <span className="eyebrow">{stats.projectType.label}</span>
            </div>
            <h1 className="page-title truncate">{project.title}</h1>
            <p className="page-copy mt-3 max-w-3xl text-sm">
              {project.description || 'No project description yet.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-right sm:flex sm:items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Created</div>
              <div className="text-sm font-semibold text-[var(--text-main)]">{stats.createdLabel}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Updated</div>
              <div className="text-sm font-semibold text-[var(--text-main)]">{stats.updatedLabel}</div>
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Characters" value={formatNumber(stats.characters.length)} detail={`${stats.factions.length} factions tracked`} />
          <StatTile label="Locations" value={formatNumber(stats.locations.length)} detail={`${stats.maps.length} maps available`} />
          <StatTile label="Story Pieces" value={formatNumber(stats.scenes.length)} detail={`${stats.acts.length} acts, ${stats.chapters.length} chapters`} />
          <StatTile label="Words" value={formatNumber(stats.manuscriptWords)} detail="From scene manuscript text" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="panel p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">World Overview</h2>
              <span className="text-xs font-semibold text-[var(--text-muted)]">{stats.timeline.length} timeline events</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <InlineStat label="Lore Entries" value={formatNumber(stats.loreEntries.length)} />
              <InlineStat label="World History" value={formatNumber(stats.worldHistory.length)} />
              <InlineStat label="Ideas" value={formatNumber(stats.ideaEntries.length)} />
            </div>
          </div>

          <div className="panel p-5">
            <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-[var(--text-main)]">Project Snapshot</h2>
            <div className="panel-soft px-4">
              <Row label="Project type" value={stats.projectType.label} />
              <Row label="Characters" value={formatNumber(stats.characters.length)} />
              <Row label="Factions" value={formatNumber(stats.factions.length)} />
              <Row label="Locations" value={formatNumber(stats.locations.length)} />
              <Row label="Maps" value={formatNumber(stats.maps.length)} />
              <Row label="Manuscript words" value={formatNumber(stats.manuscriptWords)} />
            </div>

            <div className="mt-5">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Recent Writing</h3>
              {recentScenes.length > 0 ? (
                <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                  {recentScenes.map(scene => (
                    <div key={scene.id} className="py-2">
                      <div className="truncate text-sm font-semibold text-[var(--text-main)]">{scene.title || 'Untitled scene'}</div>
                      <div className="text-xs text-[var(--text-muted)]">{formatNumber((scene.content || '').trim().match(/\S+/g)?.length || 0)} words</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state p-4 text-sm">
                  No manuscript scenes yet.
                </p>
              )}
            </div>
          </div>
        </section>

        {!hasPlanning && (
          <div className="empty-state text-sm">
            This project is ready for its first characters, locations, scenes, and map notes.
          </div>
        )}
      </div>
    </div>
  )
}
