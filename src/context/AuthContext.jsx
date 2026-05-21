import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext({ user: null, loading: false, signUp: () => {}, signIn: () => {}, signOut: () => {}, updateProfile: () => {}, refreshUser: () => null, getAccessToken: () => null })

// Read the cached Supabase session from localStorage synchronously so the app
// renders immediately on return visits without waiting for a network round-trip.
function readCachedUser() {
  try {
    const key = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
    if (!key) return null
    const { user, expires_at } = JSON.parse(localStorage.getItem(key)) ?? {}
    if (expires_at && expires_at * 1000 < Date.now()) return null
    return user ?? null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser)
  // loading is always false — we derive initial state synchronously above
  const [loading] = useState(false)

  useEffect(() => {
    // Silently validate / refresh the session in the background
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    }).catch(console.warn)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = (email, password) => supabase.auth.signUp({ email, password })
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()
  const updateProfile = async (profile) => {
    const { data, error } = await supabase.auth.updateUser({ data: profile })
    if (error) throw error
    setUser(data.user ?? null)
    return data.user
  }
  const refreshUser = async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()
    if (sessionError) throw sessionError
    if (session?.user) {
      setUser(session.user)
      return session.user
    }

    const { data: { user: nextUser }, error } = await supabase.auth.getUser()
    if (error) throw error
    setUser(nextUser ?? null)
    return nextUser
  }
  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const isAdmin = user?.app_metadata?.is_admin === true

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signUp, signIn, signOut, updateProfile, refreshUser, getAccessToken }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
