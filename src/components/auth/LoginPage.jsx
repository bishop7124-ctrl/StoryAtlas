import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

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
    desc: 'Build worlds, maps, lore',
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

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 340 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="fogL" cx="20%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#8fcb9e" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#8fcb9e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fogR" cx="80%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#a8d8b4" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#a8d8b4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="inkFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8fcb9e" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#8fcb9e" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="stemG" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#8fcb9e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#8fcb9e" stopOpacity="0.05" />
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Ambient fog */}
      <rect width="340" height="210" fill="url(#fogL)" />
      <rect width="340" height="210" fill="url(#fogR)" />

      {/* ── Open book / manuscript pages ── */}
      {/* Left page */}
      <path d="M28 40 Q56 34 84 40 L84 162 Q56 156 28 162 Z"
        fill="#141c16" stroke="#8fcb9e" strokeWidth="0.6" strokeOpacity="0.35" />
      {/* Right page */}
      <path d="M84 40 Q112 34 140 40 L140 162 Q112 156 84 162 Z"
        fill="#141c16" stroke="#8fcb9e" strokeWidth="0.6" strokeOpacity="0.25" />
      {/* Spine shadow */}
      <line x1="84" y1="40" x2="84" y2="162" stroke="#8fcb9e" strokeWidth="0.8" strokeOpacity="0.2" />
      {/* Handwriting lines — left page */}
      {[0,1,2,3,4,5,6,7,8].map(i => (
        <path key={`ll${i}`}
          d={`M36 ${58 + i * 12} Q${60 + (i % 3) * 4} ${55 + i * 12} ${72 + (i % 2) * 4} ${58 + i * 12}`}
          stroke="#dce8d7" strokeWidth="0.7" strokeOpacity={0.18 - i * 0.01} strokeLinecap="round" />
      ))}
      {/* Handwriting lines — right page */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <path key={`rl${i}`}
          d={`M92 ${60 + i * 12} Q${114 + (i % 2) * 3} ${57 + i * 12} ${132 - (i % 3) * 3} ${60 + i * 12}`}
          stroke="#dce8d7" strokeWidth="0.7" strokeOpacity={0.15 - i * 0.008} strokeLinecap="round" />
      ))}
      {/* Paragraph indent marks */}
      <path d="M36 58 L42 58" stroke="#8fcb9e" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      <path d="M36 94 L42 94" stroke="#8fcb9e" strokeWidth="1" strokeOpacity="0.35" strokeLinecap="round" />
      {/* Drop cap effect */}
      <rect x="36" y="55" width="10" height="14" rx="1" fill="#8fcb9e" fillOpacity="0.12" stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.4" />
      <text x="38.5" y="66" fontSize="10" fill="#8fcb9e" fillOpacity="0.5" fontFamily="Georgia, serif" fontStyle="italic">T</text>

      {/* ── Botanical / organic side elements ── */}
      {/* Left vine stem */}
      <path d="M18 170 Q14 140 18 110 Q22 80 16 55"
        stroke="url(#stemG)" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* Leaves */}
      <path d="M18 130 Q8 118 10 108 Q20 116 18 130Z" fill="#8fcb9e" fillOpacity="0.14" />
      <path d="M18 130 Q10 128 10 108" stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
      <path d="M16 100 Q4 92 6 80 Q18 86 16 100Z" fill="#8fcb9e" fillOpacity="0.1" />
      <path d="M16 100 Q6 96 6 80" stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.25" fill="none" />

      {/* Right vine */}
      <path d="M150 165 Q156 138 152 112 Q148 86 154 60"
        stroke="url(#stemG)" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M152 128 Q164 116 162 104 Q150 112 152 128Z" fill="#8fcb9e" fillOpacity="0.12" />
      <path d="M152 128 Q162 120 162 104" stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.25" fill="none" />

      {/* ── World / constellation cluster ── */}
      {/* Organic world blob */}
      <ellipse cx="225" cy="78" rx="46" ry="42" fill="#141c16" stroke="#8fcb9e" strokeWidth="0.6" strokeOpacity="0.3" />
      {/* Topographic contour lines */}
      <ellipse cx="225" cy="78" rx="34" ry="30" stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.18" fill="none" />
      <ellipse cx="225" cy="78" rx="22" ry="19" stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.14" fill="none" />
      <ellipse cx="225" cy="78" rx="10" ry="9" stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.1" fill="none" />
      {/* Irregular land masses */}
      <path d="M206 68 Q215 58 228 62 Q240 60 244 70 Q250 80 242 88 Q232 96 220 90 Q208 84 206 68Z"
        fill="#8fcb9e" fillOpacity="0.08" stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.22" />
      <path d="M210 82 Q206 86 208 92 Q214 90 212 84Z"
        fill="#8fcb9e" fillOpacity="0.07" stroke="#8fcb9e" strokeWidth="0.4" strokeOpacity="0.18" />
      {/* Latitude / longitude whispers */}
      <path d="M179 78 Q225 68 271 78" stroke="#8fcb9e" strokeWidth="0.4" strokeOpacity="0.15" fill="none" />
      <path d="M182 62 Q225 56 268 62" stroke="#8fcb9e" strokeWidth="0.4" strokeOpacity="0.1" fill="none" />
      <line x1="225" y1="36" x2="225" y2="120" stroke="#8fcb9e" strokeWidth="0.4" strokeOpacity="0.12" />
      {/* Marker pins */}
      <circle cx="233" cy="70" r="2.5" fill="#141c16" stroke="#8fcb9e" strokeWidth="0.8" strokeOpacity="0.7" />
      <circle cx="233" cy="70" r="1" fill="#8fcb9e" fillOpacity="0.8" />
      <circle cx="218" cy="82" r="1.8" fill="#141c16" stroke="#8fcb9e" strokeWidth="0.6" strokeOpacity="0.5" />
      <circle cx="218" cy="82" r="0.7" fill="#8fcb9e" fillOpacity="0.6" />

      {/* ── Character constellation ── */}
      {/* Nodes */}
      {[
        [290, 52, 5.5, 0.9],
        [316, 74, 4, 0.6],
        [278, 84, 3.5, 0.55],
        [304, 102, 3, 0.5],
        [330, 56, 3, 0.45],
      ].map(([cx, cy, r, op], i) => (
        <g key={i} filter={i === 0 ? 'url(#glow)' : undefined}>
          <circle cx={cx} cy={cy} r={r + 2} fill="#8fcb9e" fillOpacity={0.05} />
          <circle cx={cx} cy={cy} r={r} fill="#141c16" stroke="#8fcb9e" strokeWidth="0.7" strokeOpacity={op} />
          <circle cx={cx} cy={cy} r={r * 0.38} fill="#8fcb9e" fillOpacity={op * 0.9} />
        </g>
      ))}
      {/* Constellation edges */}
      {[
        [290, 52, 316, 74],
        [290, 52, 278, 84],
        [316, 74, 304, 102],
        [278, 84, 304, 102],
        [316, 74, 330, 56],
        [290, 52, 330, 56],
      ].map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="2.5 2.5" />
      ))}

      {/* ── Ink/analytics flourish at bottom ── */}
      {/* Brushstroke base */}
      <path d="M165 162 Q185 148 210 155 Q240 162 268 148 Q292 136 318 145"
        stroke="#8fcb9e" strokeWidth="1.4" strokeOpacity="0.55" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
      {/* Shadow/blur version for depth */}
      <path d="M165 162 Q185 148 210 155 Q240 162 268 148 Q292 136 318 145"
        stroke="#8fcb9e" strokeWidth="3" strokeOpacity="0.08" fill="none"
        strokeLinecap="round" filter="url(#soft)" />
      {/* Data accent dots along the line */}
      {[[210, 155], [240, 161], [268, 148], [295, 139]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill="#8fcb9e" fillOpacity={0.5 - i * 0.06} />
      ))}
      {/* Vertical tick marks */}
      {[[210, 155], [240, 161], [268, 148], [295, 139]].map(([x, y], i) => (
        <line key={i} x1={x} y1={y + 6} x2={x} y2={y + 16}
          stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.2" />
      ))}
      {/* Baseline */}
      <line x1="165" y1="175" x2="320" y2="175" stroke="#8fcb9e" strokeWidth="0.4" strokeOpacity="0.15" />

      {/* ── Connective tissue — organic threads ── */}
      <path d="M140 100 Q170 88 179 78"
        stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="2 4" fill="none" />
      <path d="M271 78 Q280 64 278 55"
        stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.18" strokeDasharray="2 4" fill="none" />
      <path d="M225 120 Q228 140 240 155"
        stroke="#8fcb9e" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="2 4" fill="none" />

      {/* ── Ambient ink spatter ── */}
      {[[48, 175, 1.4], [72, 178, 0.9], [162, 30, 1.2], [306, 115, 1.1], [334, 82, 0.8]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#8fcb9e" fillOpacity={0.25} />
      ))}
    </svg>
  )
}

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
      <div className="auth-frame mx-auto grid min-h-[calc(100vh-48px)] max-w-6xl grid-cols-[minmax(300px,440px)_minmax(0,1fr)] overflow-hidden max-lg:grid-cols-1">

        {/* Left panel */}
        <aside className="auth-aside flex flex-col justify-between p-8 max-lg:border-r-0 max-lg:border-b">
          <div>
            {/* Brand */}
            <div className="flex items-center gap-3 mb-8">
              <div className="studio-logo">S</div>
              <div>
                <p className="eyebrow text-xs mb-0.5">Writing system</p>
                <h1 className="font-semibold text-base leading-none" style={{ color: 'var(--text-main)' }}>StoryAtlas</h1>
              </div>
            </div>

            {/* Illustration */}
            <div className="rounded-xl overflow-hidden mb-8" style={{
              background: 'linear-gradient(160deg, color-mix(in srgb, var(--bg-nav) 70%, var(--accent) 3%), var(--bg-main))',
              border: '1px solid color-mix(in srgb, var(--border) 90%, var(--accent) 10%)',
              padding: '18px 14px 10px',
            }}>
              <HeroIllustration />
            </div>

            {/* Tagline */}
            <h2 className="font-serif text-2xl font-medium leading-snug mb-2">
              Every story needs a home.
            </h2>
            <p className="page-copy text-sm" style={{ color: 'var(--text-muted)' }}>
              A quiet workspace for writers who think in worlds.
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
            <div className="mb-6">
              <p className="eyebrow mb-2">Account</p>
              <h2 className="font-serif text-4xl font-medium leading-none">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
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
