import { createClient } from '@supabase/supabase-js'

// ─── SETUP REQUIRED ──────────────────────────────────────────────────────────
// 1. Go to https://supabase.com → New project (free tier)
// 2. After it's ready: Settings → API → copy Project URL and anon public key
// 3. Paste them below
// 4. In Supabase: Authentication → Providers → Email → disable "Confirm email"
//    (so users can log in immediately without confirming)
// 5. Go to SQL Editor → New query → paste and run this SQL:
//
//    create table user_data (
//      user_id text primary key,
//      data jsonb not null default '{}'
//    );
//    alter table user_data enable row level security;
//    create policy "Users can access own data" on user_data
//      using (auth.uid()::text = user_id);
//
//    create table scenes (
//      user_id text,
//      scene_id text,
//      data jsonb not null default '{}',
//      primary key (user_id, scene_id)
//    );
//    alter table scenes enable row level security;
//    create policy "Users can access own scenes" on scenes
//      using (auth.uid()::text = user_id);
//
// 6. Memberships / payments:
//    - Create a Stripe product with a £10 monthly recurring price.
//    - Deploy two Supabase Edge Functions:
//      VITE_CREATE_CHECKOUT_SESSION_URL points at create-checkout-session.
//      VITE_CUSTOMER_PORTAL_URL points at create-customer-portal.
//    - Handle Stripe webhooks server-side and write subscription_status into the
//      user's app_metadata. The client treats active/trialing as paid; after the
//      built-in 28 day trial, all other statuses become read-only.
//
// ─────────────────────────────────────────────────────────────────────────────

const supabaseUrl = 'https://cwifaklpjqutlcwvkxpp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3aWZha2xwanF1dGxjd3ZreHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTcwODEsImV4cCI6MjA5MzAzMzA4MX0.Nia6Zuypi91kr1CwloAZq0hUMQ_dUboqLEH4cQKVbBk'

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
