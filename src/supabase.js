import { createClient } from '@supabase/supabase-js'

// Credentials live in .env.local — see .env.example for the required keys.
const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  let abortFromParent

  if (options.signal) {
    if (options.signal.aborted) controller.abort(options.signal.reason)
    else {
      abortFromParent = () => controller.abort(options.signal.reason)
      options.signal.addEventListener('abort', abortFromParent, { once: true })
    }
  }

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeout)
    if (abortFromParent) options.signal.removeEventListener('abort', abortFromParent)
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
  realtime: { params: { eventsPerSecond: 0 } },
})
