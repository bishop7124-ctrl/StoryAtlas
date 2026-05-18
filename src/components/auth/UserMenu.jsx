import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function UserMenu({ onOpenAccount }) {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  const metadata = user.user_metadata || {}
  const displayName = metadata.full_name || metadata.name || metadata.alias || metadata.writer_alias || user.displayName || user.email
  const avatarUrl = metadata.avatar_url || user.photoURL
  const initial = (displayName || '?')[0].toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        title={displayName || user.email}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="w-7 h-7 rounded-full border border-[var(--border)]" referrerPolicy="no-referrer" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-[var(--accent)] text-[var(--bg-main)] flex items-center justify-center text-xs font-black">
            {initial}
          </span>
        )}
        <span className="text-xs text-[var(--text-muted)] max-w-[120px] truncate hidden sm:block">
          {displayName || user.email}
        </span>
        <span className="text-[var(--text-muted)] text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-nav)] border border-[var(--border)] rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-main)] truncate">
              {displayName || 'Account'}
            </p>
            <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{user.email}</p>
          </div>
          {onOpenAccount && (
            <button
              onClick={() => { setOpen(false); onOpenAccount() }}
              className="w-full text-left px-4 py-3 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-fade)] transition-colors"
            >
              Account settings
            </button>
          )}
          <button
            onClick={() => { setOpen(false); signOut() }}
            className="w-full text-left px-4 py-3 text-sm text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/5 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
