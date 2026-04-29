import { useState, useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useStore } from './store/useStore'
import { loadUserData } from './utils/firestoreSync'
import NovelManager from './components/NovelManager'
import Layout from './components/Layout'
import LoginPage from './components/auth/LoginPage'

function AppInner() {
  const { user, loading: authLoading } = useAuth()
  const store = useStore(user?.uid)
  const [dataLoading, setDataLoading] = useState(false)
  const [section, setSection] = useState('characters')
  const loadedUid = useRef(null)

  useEffect(() => {
    if (!user) {
      // User signed out — clear local state so next user starts fresh
      if (loadedUid.current) {
        store.clearData()
        loadedUid.current = null
      }
      return
    }

    // Don't reload if we already fetched for this uid
    if (loadedUid.current === user.uid) return
    loadedUid.current = user.uid

    setDataLoading(true)
    loadUserData(user.uid)
      .then(data => store.importData(data))
      .catch(console.error)
      .finally(() => setDataLoading(false))
  }, [user])

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex flex-col items-center justify-center gap-4">
        <span className="text-[var(--accent)] font-black text-2xl tracking-tighter">NovelForge</span>
        <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return store.activeNovel
    ? <Layout store={store} section={section} setSection={setSection} />
    : <NovelManager store={store} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
