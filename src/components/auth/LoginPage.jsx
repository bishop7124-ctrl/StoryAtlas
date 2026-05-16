import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = mode === 'login'
        ? await signIn(email, password)
        : await signUp(email, password)
      if (err) setError(err.message)
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell min-h-screen p-6 text-[var(--text-main)]">
      <div className="auth-frame mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl grid-cols-[minmax(280px,420px)_minmax(0,1fr)] overflow-hidden max-lg:grid-cols-1">
        <aside className="auth-aside flex flex-col justify-between p-8 max-lg:border-r-0 max-lg:border-b">
          <div>
            <div className="studio-logo mb-7">S</div>
            <p className="eyebrow mb-3">Writing system</p>
            <h1 className="studio-wall-title">StoryAtlas</h1>
            <p className="page-copy mt-5 max-w-sm text-sm">
              A quiet workspace for manuscripts, notes, lore, timelines, maps, and the context that keeps a long project coherent.
            </p>
          </div>

          <div className="mt-10 grid gap-3">
            {['Manuscript', 'Notes', 'Characters', 'Atlas'].map(label => (
              <div key={label} className="auth-nav-item pointer-events-none">
                <span className="studio-room-glyph">{label.slice(0, 1)}</span>
                <span className="text-sm font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="auth-main flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <p className="eyebrow mb-2">Account</p>
              <h2 className="font-serif text-4xl font-medium leading-none">{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="auth-form space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="field w-full px-4 py-3 text-sm placeholder:text-[var(--text-muted)]"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="field w-full px-4 py-3 text-sm placeholder:text-[var(--text-muted)]"
              />

              {error && (
                <p className="text-red-400 text-sm text-center bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '…' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                className="text-[var(--accent)] hover:underline font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>

            <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
              Your data is stored securely and synced across all your devices.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
