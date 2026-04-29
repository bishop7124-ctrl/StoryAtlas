import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const providers = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
    bg: 'bg-white hover:bg-gray-50',
    text: 'text-gray-700',
    border: 'border border-gray-300',
  },
  {
    id: 'microsoft',
    label: 'Continue with Microsoft',
    icon: (
      <svg viewBox="0 0 23 23" className="w-5 h-5">
        <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
        <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
        <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
        <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
      </svg>
    ),
    bg: 'bg-[#2F2F2F] hover:bg-[#3a3a3a]',
    text: 'text-white',
    border: 'border border-[#555]',
  },
  {
    id: 'facebook',
    label: 'Continue with Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2">
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.254h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
    bg: 'bg-[#1877F2] hover:bg-[#166fe5]',
    text: 'text-white',
    border: 'border border-[#1877F2]',
  },
]

export default function LoginPage() {
  const { signInWithGoogle, signInWithMicrosoft, signInWithFacebook } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState('')

  const handlers = {
    google: signInWithGoogle,
    microsoft: signInWithMicrosoft,
    facebook: signInWithFacebook,
  }

  const handleSignIn = async (id) => {
    setError('')
    setLoading(id)
    try {
      await handlers[id]()
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError(e.message || 'Sign-in failed. Please try again.')
      }
    } finally {
      setLoading('')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent-fade)] border border-[var(--border)] mb-4">
            <span className="text-3xl">⚒️</span>
          </div>
          <h1 className="text-4xl font-black text-[var(--accent)] tracking-tighter leading-none mb-2">
            NovelForge
          </h1>
          <p className="text-[var(--text-muted)] text-sm">Sign in to save your worlds across devices</p>
        </div>

        {/* Provider buttons */}
        <div className="space-y-3">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => handleSignIn(p.id)}
              disabled={!!loading}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${p.bg} ${p.text} ${p.border} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="flex-shrink-0">{p.icon}</span>
              <span className="flex-1 text-left">
                {loading === p.id ? 'Signing in…' : p.label}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          Your data is stored securely and synced across all your devices.
        </p>
      </div>
    </div>
  )
}
