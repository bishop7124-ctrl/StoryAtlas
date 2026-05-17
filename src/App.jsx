import { Component, useState, useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useStore } from './store/useStore'
import { loadUserData } from './utils/firestoreSync'
import NovelManager from './components/NovelManager'
import Layout from './components/Layout'
import LoginPage from './components/auth/LoginPage'
import AIPanel from './components/ai/AIPanel'
import AccountSettings from './components/account/AccountSettings'
import YOWLogo from './components/brand/YOWLogo'
import { getMembership } from './utils/membership'

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

const DATA_KEYS = [
  'nf_novels',
  'nf_characters',
  'nf_factions',
  'nf_locations',
  'nf_timeline',
  'nf_worldHistory',
  'nf_acts',
  'nf_chapters',
  'nf_scenes',
  'nf_loreEntries',
  'nf_ideaEntries',
  'nf_whiteboards'
]

const hasEntries = (value) => Array.isArray(value) && value.length > 0

const hasRemoteData = (data) => {
  if (!data) return false
  if (DATA_KEYS.some(key => hasEntries(data[key.replace('nf_', '')]))) return true
  return Boolean(data.activeNovelId || data.currentYear)
}

const hasLocalData = () => {
  try {
    return DATA_KEYS.some(key => hasEntries(JSON.parse(localStorage.getItem(key)))) ||
      Boolean(JSON.parse(localStorage.getItem('nf_activeNovel'))) ||
      Boolean(JSON.parse(localStorage.getItem('nf_currentYear')))
  } catch {
    return false
  }
}

function AppInner() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.uid || user?.id || null
  const membership = getMembership(user)
  const store = useStore(userId, { readOnly: membership.isReadOnly })
  const { importData, finishRemoteLoad } = store
  const [dataLoading, setDataLoading] = useState(false)
  const [section, setSection] = useState('dashboard')
  const [libraryAiOpen, setLibraryAiOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [readOnlyNotice, setReadOnlyNotice] = useState(false)
  const loadedUid = useRef(null)
  const prevNovelId = useRef(null)

  useEffect(() => {
    if (store.activeNovelId && store.activeNovelId !== prevNovelId.current) {
      setSection('dashboard')
    }
    prevNovelId.current = store.activeNovelId ?? null
  }, [store.activeNovelId])

  useEffect(() => {
    const handleReadOnly = () => {
      setReadOnlyNotice(true)
      window.clearTimeout(handleReadOnly.timeout)
      handleReadOnly.timeout = window.setTimeout(() => setReadOnlyNotice(false), 3600)
    }
    window.addEventListener('membership-read-only', handleReadOnly)
    return () => {
      window.removeEventListener('membership-read-only', handleReadOnly)
      window.clearTimeout(handleReadOnly.timeout)
    }
  }, [])

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
        if (!hasRemoteData(data) && hasLocalData()) {
          finishRemoteLoad()
          return
        }
        importData(data)
      })
      .catch(error => {
        console.error(error)
        finishRemoteLoad()
      })
      .finally(() => setDataLoading(false))
  }, [user, userId, importData, finishRemoteLoad])

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center gap-4">
        <span className="w-12 h-12 text-[var(--accent)]"><YOWLogo /></span>
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  const accountPage = (
    <>
      <AccountSettings open={accountOpen} onClose={() => setAccountOpen(false)} />
      {readOnlyNotice && (
        <div className="membership-toast">
          Your trial has ended. Upgrade in Account settings to edit again.
        </div>
      )}
    </>
  )

  return store.activeNovel
    ? (
      <>
        <Layout key={store.activeNovelId} store={store} section={section} setSection={setSection} onOpenAccount={() => setAccountOpen(true)} />
        {accountPage}
      </>
    )
    : (
      <>
        <NovelManager store={store} user={user} onOpenChat={() => setLibraryAiOpen(true)} onOpenAccount={() => setAccountOpen(true)} />
        <AIPanel
          store={store}
          open={libraryAiOpen}
          onClose={() => setLibraryAiOpen(false)}
          initialContext={{ characterIds: [], locationIds: [], loreEntryIds: [], chapterIds: [], customInstruction: '' }}
        />
        {accountPage}
      </>
    )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  )
}
