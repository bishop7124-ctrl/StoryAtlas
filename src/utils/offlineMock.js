// Offline development mode — activated by VITE_OFFLINE_MODE=true in .env.local
// All external services (Supabase, AI APIs) are replaced with local stubs.

export const OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true'

// Fake paid user — has founder-tier membership so all features are accessible
export const OFFLINE_USER = {
  id: 'offline-dev-user',
  uid: 'offline-dev-user',
  email: 'dev@localhost',
  created_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {
    subscription_status: 'active',
    subscription_plan: 'founder',
    is_admin: false,
  },
  user_metadata: {
    full_name: 'Dev User',
  },
}

const CANNED_RESPONSE = `This is a canned offline response. AI features are unavailable in offline mode — your API key settings and provider configuration are preserved and will work once you're online. Everything else in the app is fully functional and saves to localStorage.`

export function mockStreamMessage({ onChunk, onDone }) {
  const words = CANNED_RESPONSE.split(' ')
  let i = 0
  const tick = () => {
    if (i >= words.length) {
      onDone()
      return
    }
    onChunk((i === 0 ? '' : ' ') + words[i++])
    setTimeout(tick, 30)
  }
  setTimeout(tick, 80)
}
