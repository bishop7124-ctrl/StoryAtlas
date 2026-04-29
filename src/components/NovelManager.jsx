import { useState } from 'react'

// The Fix: uses theme variables so all 4 themes apply correctly
export default function NovelManager({ store }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    store.addNovel(form)
    setForm({ title: '', description: '' })
    setShowForm(false)
  }

  const handleDelete = (id) => {
    if (confirm('Delete this novel and all its content? This cannot be undone.')) {
      store.deleteNovel(id)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-[var(--accent)] mb-2 tracking-tight">NovelForge</h1>
          <p className="text-[var(--text-muted)] text-sm">Your world. Your story.</p>
        </div>

        {store.novels.length > 0 && (
          <div className="mb-6 space-y-2">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Your novels</p>
            {store.novels.map(n => (
              <div
                key={n.id}
                className="flex items-center justify-between bg-[var(--bg-nav)] border border-[var(--border)] rounded-lg px-4 py-3 group"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate text-[var(--text-main)]">{n.title}</div>
                  {n.description && (
                    <div className="text-sm text-[var(--text-muted)] mt-0.5 truncate">{n.description}</div>
                  )}
                </div>
                <div className="flex gap-2 ml-3 flex-shrink-0">
                  <button
                    onClick={() => store.setActiveNovelId(n.id)}
                    className="text-sm px-3 py-1.5 bg-[var(--accent)] hover:opacity-90 text-[var(--bg-main)] font-semibold rounded transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-sm px-2 py-1.5 text-[var(--text-muted)] hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete novel"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleCreate} className="bg-[var(--bg-nav)] border border-[var(--border)] rounded-lg p-5 space-y-3">
            <input
              autoFocus
              placeholder="Novel title *"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
              required
            />
            <textarea
              placeholder="Short description (optional)"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full bg-[var(--bg-main)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] resize-none placeholder:text-[var(--text-muted)]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-[var(--accent)] hover:opacity-90 text-[var(--bg-main)] font-semibold rounded text-sm transition-colors"
              >
                Create Novel
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-main)] text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--accent)] rounded-lg text-sm transition-colors"
          >
            + Create new novel
          </button>
        )}
      </div>
    </div>
  )
}
