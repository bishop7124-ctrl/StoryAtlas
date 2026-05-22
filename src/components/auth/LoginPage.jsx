import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import YOWLogo from '../brand/YOWLogo'

const FEATURES = [
  {
    label: 'Manuscript',
    desc: 'Write scenes, chapters, acts',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="12" height="16" rx="2" />
        <line x1="7" y1="7" x2="13" y2="7" />
        <line x1="7" y1="10" x2="13" y2="10" />
        <line x1="7" y1="13" x2="10" y2="13" />
      </svg>
    ),
  },
  {
    label: 'Planning',
    desc: 'Outline arcs, beats, structure',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="5" height="5" rx="1" />
        <rect x="2" y="12" width="5" height="5" rx="1" />
        <rect x="13" y="7" width="5" height="6" rx="1" />
        <line x1="7" y1="5.5" x2="13" y2="9" />
        <line x1="7" y1="14.5" x2="13" y2="11" />
      </svg>
    ),
  },
  {
    label: 'Characters',
    desc: 'Profiles, relationships, arcs',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="7" r="3" />
        <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" />
      </svg>
    ),
  },
  {
    label: 'Atlas',
    desc: 'Worlds, maps, lore',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M2 10h16" />
        <path d="M10 2c-2.5 2-4 5-4 8s1.5 6 4 8" />
        <path d="M10 2c2.5 2 4 5 4 8s-1.5 6-4 8" />
      </svg>
    ),
  },
  {
    label: 'Analytics',
    desc: 'Word counts, pacing, progress',
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,15 7,9 11,12 17,5" />
        <line x1="3" y1="17" x2="17" y2="17" />
      </svg>
    ),
  },
]

const HOME_SECTIONS = [
  ['Draft', 'Manuscript drafting with acts, chapters, scenes, and writing progress.'],
  ['Plan', 'Story outlines, beat planning, schedules, and loose idea boards.'],
  ['Cast', 'Character dossiers, relationships, factions, and family trees.'],
  ['World', 'Locations, maps, lore entries, timelines, and world history.'],
  ['Track', 'Project dashboards for word counts, pacing, goals, and momentum.'],
  ['Assist', 'Built-in creative AI context for the project you are working on.'],
]

function HeroIllustration() {
  return (
    <img src="/hero-illustration.png" alt="" style={{ width: '100%', display: 'block' }} aria-hidden="true" />
  )
}

export default function LoginPage({ onOpenLegal, onOpenAbout }) {
  const { signIn, signUp } = useAuth()
  const [screen, setScreen] = useState('home')
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState(import.meta.env.VITE_DEV_EMAIL ?? '')
  const [password, setPassword] = useState(import.meta.env.VITE_DEV_PASSWORD ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  // Surface auth errors that Supabase encodes in the URL hash (e.g. expired link)
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.includes('error=')) return
    const params = new URLSearchParams(hash.replace(/^#/, ''))
    const desc = params.get('error_description')
    if (desc) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScreen('auth')
      setMode('login')
      setError(decodeURIComponent(desc.replace(/\+/g, ' ')))
      // Clean the URL so the error doesn't persist on refresh
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [])

  const openAuth = (nextMode) => {
    setMode(nextMode)
    setError('')
    setSent(false)
    setScreen('auth')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error: err } = await signIn(email, password)
        if (err) setError(err.message)
      } else {
        const { data, error: err } = await signUp(email, password)
        if (err) {
          setError(err.message)
        } else if (!data?.session) {
          // Email confirmation required — session won't exist until the link is clicked
          setSent(true)
        }
        // If session is already set (confirmation disabled), onAuthStateChange handles it
      }
    } catch (e) {
      setError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (screen === 'home') {
    return (
      <div className="auth-shell yow-home min-h-screen text-[var(--text-main)]">
        <header className="yow-home-nav">
          <div className="flex items-center gap-3">
            <div className="studio-logo"><YOWLogo /></div>
            <div>
              <p className="eyebrow text-xs mb-0.5">Story world workspace</p>
              <strong>Your Own World</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenAbout && (
              <button type="button" className="btn btn-secondary" onClick={onOpenAbout}>About</button>
            )}
            <button type="button" className="btn btn-secondary" data-testid="home-nav-login" onClick={() => openAuth('login')}>Log in</button>
            <button type="button" className="btn btn-primary" data-testid="home-nav-start" onClick={() => openAuth('signup')}>Get started</button>
          </div>
        </header>

        <main className="yow-home-main">
          <section className="yow-home-hero">
            <div className="yow-home-copy">
              <p className="eyebrow mb-3">Your Own World</p>
              <h1>Build the world your story needs.</h1>
              <p>
                Your Own World keeps the manuscript, map room, character board, lore archive, and project dashboard in one focused writing workspace.
              </p>
              <div className="yow-home-actions">
                <button type="button" className="btn btn-primary" data-testid="home-hero-start" onClick={() => openAuth('signup')}>Get started</button>
                <button type="button" className="btn btn-secondary" data-testid="home-hero-login" onClick={() => openAuth('login')}>Log in</button>
              </div>
            </div>

            <div aria-hidden="true">
              <HeroIllustration />
            </div>
          </section>

          <section className="yow-home-grid" aria-label="Your Own World functionality">
            {HOME_SECTIONS.map(([title, copy]) => (
              <article key={title} className="yow-home-card">
                <span>{title}</span>
                <p>{copy}</p>
              </article>
            ))}
          </section>
        </main>

        <footer className="yow-home-footer">
          <p className="yow-home-footer-copy">© 2026 YourOwnWorld. All rights reserved.</p>
          <nav className="yow-home-footer-nav" aria-label="Legal and info links">
            {onOpenAbout && (
              <button type="button" onClick={onOpenAbout} className="yow-footer-link">About</button>
            )}
            {onOpenLegal && (
              <>
                <button type="button" onClick={() => onOpenLegal('privacy')}  className="yow-footer-link">Privacy</button>
                <button type="button" onClick={() => onOpenLegal('terms')}    className="yow-footer-link">Terms</button>
                <button type="button" onClick={() => onOpenLegal('ethics')}   className="yow-footer-link">Ethics</button>
                <button type="button" onClick={() => onOpenLegal('beta')}     className="yow-footer-link">Beta</button>
                <button type="button" onClick={() => onOpenLegal('cookies')}  className="yow-footer-link">Cookies</button>
              </>
            )}
          </nav>
        </footer>
      </div>
    )
  }

  return (
    <div className="auth-shell min-h-screen p-6 text-[var(--text-main)]">
      <div className="auth-frame mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl grid-cols-[minmax(300px,440px)_minmax(0,1fr)] overflow-hidden max-lg:grid-cols-1">

        {/* Left panel */}
        <aside className="auth-aside flex flex-col justify-between p-8 max-lg:border-r-0 max-lg:border-b">
          <div>
            {/* Brand */}
            <div className="flex items-center gap-3 mb-8">
              <div className="studio-logo"><YOWLogo /></div>
              <div>
                <p className="eyebrow text-xs mb-0.5">Story world workspace</p>
                <h1 className="font-semibold text-base leading-none" style={{ color: 'var(--text-main)' }}>Your Own World</h1>
              </div>
            </div>

            {/* Illustration */}
            <div className="mb-8">
              <HeroIllustration />
            </div>

            {/* Tagline */}
            <h2 className="font-serif text-2xl font-medium leading-snug mb-2">
              Build the world your story needs.
            </h2>
            <p className="page-copy text-sm" style={{ color: 'var(--text-muted)' }}>
              Your Own World is a focused home for manuscripts, characters, lore, maps, and the living logic behind a story.
            </p>
          </div>

          {/* Feature list */}
          <div className="mt-8 grid gap-2">
            {FEATURES.map(({ label, desc, icon }) => (
              <div key={label} className="auth-nav-item pointer-events-none">
                <span className="studio-room-glyph" style={{ width: 28, height: 28 }}>
                  <span style={{ width: 14, height: 14, display: 'block' }}>{icon}</span>
                </span>
                <div className="min-w-0">
                  <span className="text-sm font-semibold block leading-none mb-0.5">{label}</span>
                  <span className="text-xs leading-none" style={{ color: 'var(--text-muted)' }}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right panel — form */}
        <main className="auth-main flex items-center justify-center">
          <div className="w-full max-w-md">
            {sent ? (
              <>
                <div className="mb-6">
                  <p className="eyebrow mb-2">Your Own World</p>
                  <h2 className="font-serif text-4xl font-medium leading-none">Check your inbox</h2>
                  <p className="page-copy mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    We sent a confirmation link to <strong style={{ color: 'var(--text-main)' }}>{email}</strong>. Click it to activate your account and start writing.
                  </p>
                </div>
                <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
                  Already confirmed?{' '}
                  <button
                    onClick={() => { setSent(false); setMode('login'); setError('') }}
                    className="text-[var(--accent)] hover:underline font-medium"
                  >
                    Go to login
                  </button>
                </p>
                <p className="mt-3 text-center text-sm text-[var(--text-muted)]">
                  Wrong address?{' '}
                  <button
                    onClick={() => { setSent(false); setEmail(''); setPassword('') }}
                    className="text-[var(--accent)] hover:underline font-medium"
                  >
                    Try again
                  </button>
                </p>
                <p className="mt-4 text-center text-xs">
                  <button type="button" onClick={() => setScreen('home')} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
                    Back to homepage
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <p className="eyebrow mb-2">Your Own World</p>
                  <h2 className="font-serif text-4xl font-medium leading-none">
                    {mode === 'login' ? 'Welcome back' : 'Create account'}
                  </h2>
                  <p className="page-copy mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {mode === 'login'
                      ? 'Sign in to return to your worlds, drafts, timelines, and story notes.'
                      : 'Create your account and start building your first story world.'}
                  </p>
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
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSent(false) }}
                    className="text-[var(--accent)] hover:underline font-medium"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>

                <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
                  Your data is stored securely and synced across all your devices.
                </p>

                <p className="mt-4 text-center text-xs">
                  <button type="button" onClick={() => setScreen('home')} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
                    Back to homepage
                  </button>
                </p>

                {onOpenLegal && (
                  <div className="mt-6 flex justify-center gap-4 flex-wrap">
                    <button type="button" onClick={() => onOpenLegal('privacy')} className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Privacy</button>
                    <button type="button" onClick={() => onOpenLegal('terms')}   className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Terms</button>
                    <button type="button" onClick={() => onOpenLegal('ethics')}  className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Ethics</button>
                    <button type="button" onClick={() => onOpenLegal('beta')}    className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Beta</button>
                    <button type="button" onClick={() => onOpenLegal('cookies')} className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">Cookies</button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
