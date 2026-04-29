import { useEffect } from 'react'

// The Fix: uses theme variables so all 4 themes apply correctly
export default function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-[var(--bg-nav)] rounded-xl border border-[var(--border)] shadow-2xl flex flex-col ${wide ? 'w-full max-w-2xl' : 'w-full max-w-lg'} max-h-[90vh]`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="font-semibold text-[var(--text-main)] text-sm">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] text-xl leading-none rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
