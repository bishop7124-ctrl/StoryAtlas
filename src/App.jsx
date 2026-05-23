import { Component, useMemo, useState, useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useStore } from './store/useStore'
import { loadUserData } from './utils/firestoreSync'
import NovelManager from './components/NovelManager'
import Layout from './components/Layout'
import LoginPage from './components/auth/LoginPage'
import AIPanel from './components/ai/AIPanel'
import AccountSettings from './components/account/AccountSettings'
import HelpContact from './components/help/HelpContact'
import CookieBanner from './components/legal/CookieBanner'
import LegalModal from './components/legal/LegalModal'
import AboutPage from './components/about/AboutPage'
import YOWLogo from './components/brand/YOWLogo'
import FreeProjectSelector from './components/account/FreeProjectSelector'
import PricingPage from './components/pricing/PricingPage'
import { getMembership } from './utils/membership'
import { estimateStoreSize } from './utils/storageQuota'
import { applyThemeToDocument, loadThemeChoice, saveThemeChoice } from './utils/theme'

const APP_FONT_OPTIONS = {
  system: 'system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  dyslexia: 'Dyslexie, "OpenDyslexic", "Atkinson Hyperlegible", Verdana, Arial, sans-serif',
}

function isPricingPath(path) {
  return path === '/pricing' || path === '/pricing/'
}

function parseRoute() {
  const path = window.location.pathname
  const m = path.match(/^\/project\/([^/]+)(?:\/(.+))?$/)
  if (!m) return { novelId: null, section: 'dashboard', layoutViewMode: 'planning' }
  const novelId = decodeURIComponent(m[1])
  const sub = m[2]
  if (sub === 'writing') return { novelId, section: 'dashboard', layoutViewMode: 'writing' }
  return { novelId, section: sub || 'dashboard', layoutViewMode: 'planning' }
}

function buildRoute(viewMode, novelId, section, layoutViewMode) {
  if (viewMode !== 'editor' || !novelId) return '/'
  if (layoutViewMode === 'writing') return `/project/${encodeURIComponent(novelId)}/writing`
  if (!section || section === 'dashboard') return `/project/${encodeURIComponent(novelId)}`
  return `/project/${encodeURIComponent(novelId)}/${section}`
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#0f1115] flex flex-col items-center justify-center gap-4 p-8 text-center">
          <span className="w-12 h-12 text-[#f59e0b]"><YOWLogo /></span>
          <p className="text-[#f8fafc] font-semibold">Something went wrong.</p>
          <p className="text-[#64748b] text-sm max-w-sm">{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
            className="mt-2 px-4 py-2 rounded-lg bg-[#f59e0b] text-[#0f1115] font-bold text-sm"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function BetaWatermark() {
  return (
    <div className="beta-watermark" aria-hidden="true">
      Beta
    </div>
  )
}

function AppInner() {
  const { user, loading: authLoading, updateProfile, recoveryMode } = useAuth()
  const userId = user?.uid || user?.id || null
  const membership = getMembership(user)
  const store = useStore(userId, { readOnly: membership.isReadOnly, freeProjectId: membership.freeProjectId })
  const { importData, finishRemoteLoad } = store
  const [dataLoading, setDataLoading] = useState(false)
  const initialRoute = useRef(parseRoute())
  const [section, setSection] = useState(() => initialRoute.current.section)
  const [viewMode, setViewMode] = useState(() => initialRoute.current.novelId ? 'editor' : 'manager')
  const [layoutViewMode, setLayoutViewMode] = useState(() => initialRoute.current.layoutViewMode)
  const [showPricing, setShowPricing] = useState(() => isPricingPath(window.location.pathname))
  const [libraryAiOpen, setLibraryAiOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [readOnlyNotice, setReadOnlyNotice] = useState('')
  const [freeProjectBusy, setFreeProjectBusy] = useState(false)
  const [legalPage, setLegalPage] = useState(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const firstUrlSync = useRef(true)
  const loadedUid = useRef(null)

  // Estimate store size for storage quota display (recalculated when account opens).
  const storageUsedBytes = useMemo(() => {
    if (!accountOpen) return 0
    return estimateStoreSize(store)
  }, [accountOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyThemeToDocument(loadThemeChoice())
    const fontChoice = localStorage.getItem('nf-font') || 'system'
    document.documentElement.style.setProperty('--font', APP_FONT_OPTIONS[fontChoice] || APP_FONT_OPTIONS.system)
    localStorage.removeItem('nf-radius')
    document.documentElement.removeAttribute('data-radius')
  }, [])

  useEffect(() => {
    if (!store.activeNovelId) { setViewMode('manager'); setLayoutViewMode('planning') }
  }, [store.activeNovelId])

  useEffect(() => {
    setViewMode('manager')
    setLayoutViewMode('planning')
  }, [userId])

  // On mount: if URL points to a project, activate it
  useEffect(() => {
    const { novelId } = initialRoute.current
    if (novelId && novelId !== store.activeNovelId) store.setActiveNovelId(novelId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync browser URL with navigation state
  useEffect(() => {
    if (firstUrlSync.current) { firstUrlSync.current = false; return }
    const url = buildRoute(viewMode, store.activeNovelId, section, layoutViewMode)
    if (window.location.pathname !== url) history.pushState(null, '', url)
  }, [viewMode, store.activeNovelId, section, layoutViewMode])

  // Restore state from browser back/forward navigation (including /pricing)
  useEffect(() => {
    const handlePop = () => {
      const path = window.location.pathname
      if (isPricingPath(path)) {
        setShowPricing(true)
        return
      }
      setShowPricing(false)
      const route = parseRoute()
      setSection(route.section)
      setLayoutViewMode(route.layoutViewMode)
      if (route.novelId) {
        store.setActiveNovelId(route.novelId)
        setViewMode('editor')
      } else {
        store.setActiveNovelId(null)
        setViewMode('manager')
      }
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [store]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleOpenAccount = () => setAccountOpen(true)
    window.addEventListener('open-account-settings', handleOpenAccount)
    return () => window.removeEventListener('open-account-settings', handleOpenAccount)
  }, [])

  useEffect(() => {
    const handleReadOnly = (event) => {
      const reason = event.detail?.reason
      let msg = 'Your trial has ended. Upgrade in Account settings to edit again.'
      if (reason === 'free-project') msg = 'This project is view-only on your free plan. Upgrade to edit all projects.'
      if (reason === 'free-limit') msg = 'Free plan includes one active project. Upgrade to create unlimited projects.'
      setReadOnlyNotice(msg)
      window.clearTimeout(handleReadOnly.timeout)
      handleReadOnly.timeout = window.setTimeout(() => setReadOnlyNotice(''), 4000)
    }
    window.addEventListener('membership-read-only', handleReadOnly)
    return () => {
      window.removeEventListener('membership-read-only', handleReadOnly)
      window.clearTimeout(handleReadOnly.timeout)
    }
  }, [])

  // Apply profile-saved theme on login (overrides local if set)
  useEffect(() => {
    const profileTheme = user?.user_metadata?.theme
    const profileCustomColors = user?.user_metadata?.custom_theme_colors || {}
    if (profileTheme) {
      const appliedTheme = saveThemeChoice(profileTheme, profileCustomColors)
      if (appliedTheme === 'custom') {
        localStorage.setItem('nf-custom-colors', JSON.stringify(profileCustomColors))
      }
    }
  }, [user?.id, user?.user_metadata?.theme, user?.user_metadata?.custom_theme_colors])

  useEffect(() => {
    if (!user) {
      loadedUid.current = null
      finishRemoteLoad()
      return
    }

    // Don't reload if we already fetched for this uid
    if (loadedUid.current === userId) return
    loadedUid.current = userId

    setDataLoading(true)
    loadUserData(userId)
      .then(data => {
        importData(data)
        // URL takes priority over remote last-active project
        const urlNovelId = initialRoute.current.novelId
        if (urlNovelId) store.setActiveNovelId(urlNovelId)
      })
      .catch(error => {
        console.error(error)
        finishRemoteLoad()
      })
      .finally(() => setDataLoading(false))
  }, [user, userId, importData, finishRemoteLoad])

  // Pricing page is accessible regardless of auth state
  if (showPricing) {
    return (
      <>
        <PricingPage
          user={user}
          onGetStarted={() => {
            window.history.pushState(null, '', '/')
            setShowPricing(false)
          }}
          onSignIn={() => {
            window.history.pushState(null, '', '/')
            setShowPricing(false)
          }}
        />
        <CookieBanner onOpenPolicy={() => setLegalPage('cookies')} />
        <LegalModal page={legalPage} onClose={() => setLegalPage(null)} onNavigate={setLegalPage} />
      </>
    )
  }

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center gap-4">
        <span className="w-12 h-12 text-[var(--accent)]"><YOWLogo /></span>
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || recoveryMode) return (
    <>
      <LoginPage onOpenLegal={setLegalPage} onOpenAbout={() => setAboutOpen(true)} recoveryMode={recoveryMode} />
      <CookieBanner onOpenPolicy={() => setLegalPage('cookies')} />
      <LegalModal page={legalPage} onClose={() => setLegalPage(null)} onNavigate={setLegalPage} />
      <AboutPage open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  )

  const showFreeSelector = membership.isFree && !membership.freeProjectId && store.novels.length >= 1

  const handleFreeProjectConfirm = async (projectId) => {
    try {
      setFreeProjectBusy(true)
      await updateProfile({ ...(user.user_metadata || {}), free_project_id: projectId })
    } catch {
      // non-fatal — user can retry on next load
    } finally {
      setFreeProjectBusy(false)
    }
  }

  const accountPage = (
    <>
      <AccountSettings open={accountOpen} onClose={() => setAccountOpen(false)} storageUsedBytes={storageUsedBytes} />
      <HelpContact open={helpOpen} onClose={() => setHelpOpen(false)} />
      {readOnlyNotice && (
        <div role="alert" className="membership-toast">{readOnlyNotice}</div>
      )}
      {showFreeSelector && (
        <FreeProjectSelector
          novels={store.novels}
          onConfirm={handleFreeProjectConfirm}
          busy={freeProjectBusy}
        />
      )}
    </>
  )

  const handleOpenProject = (id) => {
    store.setActiveNovelId(id)
    setSection('dashboard')
    setViewMode('editor')
    setLayoutViewMode('planning')
  }

  const globalOverlays = (
    <>
      <CookieBanner onOpenPolicy={() => setLegalPage('cookies')} />
      <LegalModal page={legalPage} onClose={() => setLegalPage(null)} onNavigate={setLegalPage} />
      <AboutPage open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  )

  return (viewMode === 'editor' && store.activeNovel)
    ? (
      <>
        <Layout key={store.activeNovelId} store={store} section={section} setSection={setSection} onOpenAccount={() => setAccountOpen(true)} onOpenHelp={() => setHelpOpen(true)} onOpenLegal={setLegalPage} onOpenAbout={() => setAboutOpen(true)} membership={membership} viewMode={layoutViewMode} setViewMode={setLayoutViewMode} />
        {accountPage}
        {globalOverlays}
      </>
    )
    : (
      <>
        <NovelManager store={store} user={user} onOpenProject={handleOpenProject} onOpenChat={() => setLibraryAiOpen(true)} onOpenAccount={() => setAccountOpen(true)} onOpenHelp={() => setHelpOpen(true)} onOpenLegal={setLegalPage} onOpenAbout={() => setAboutOpen(true)} membership={membership} />
        <AIPanel
          store={store}
          open={libraryAiOpen}
          onClose={() => setLibraryAiOpen(false)}
          initialContext={{ characterIds: [], locationIds: [], loreEntryIds: [], chapterIds: [], customInstruction: '' }}
          membership={membership}
        />
        {accountPage}
        {globalOverlays}
      </>
    )
}

export default function App() {
  return (
    <>
      <ErrorBoundary>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </ErrorBoundary>
      <BetaWatermark />
    </>
  )
}
