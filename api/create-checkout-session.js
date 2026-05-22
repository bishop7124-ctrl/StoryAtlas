import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Maps plan keys to Stripe price IDs and checkout mode.
// Each price ID must be set as an env var on Vercel.
// STRIPE_PRICE_ID is kept as the legacy fallback for premium_monthly.
const PLAN_CONFIG = {
  premium_monthly:      { priceEnv: 'STRIPE_PRICE_ID_PREMIUM_MONTHLY',      mode: 'subscription' },
  premium_lifetime:     { priceEnv: 'STRIPE_PRICE_ID_PREMIUM_LIFETIME',     mode: 'payment' },
  premium_plus_lifetime:{ priceEnv: 'STRIPE_PRICE_ID_PREMIUM_PLUS_LIFETIME',mode: 'payment' },
  founder:              { priceEnv: 'STRIPE_PRICE_ID_FOUNDER',               mode: 'payment' },
}

export default async function handler(req, res) {
  const origin = req.headers.origin || process.env.SITE_URL || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    const token = (req.headers.authorization || '').replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

    const { plan = 'premium_monthly', currency = 'gbp' } = req.body || {}
    const planConfig = PLAN_CONFIG[plan]
    if (!planConfig) return res.status(400).json({ error: `Unknown plan: ${plan}` })

    // Fall back to the legacy STRIPE_PRICE_ID for premium_monthly
    const priceId = process.env[planConfig.priceEnv]
      || (plan === 'premium_monthly' ? process.env.STRIPE_PRICE_ID : null)
    if (!priceId) return res.status(500).json({ error: `Price not configured for plan: ${plan}` })

    const siteUrl = process.env.SITE_URL || 'http://localhost:5173'

    const sessionParams = {
      mode: planConfig.mode,
      customer:       user.app_metadata?.stripe_customer_id || undefined,
      customer_email: user.app_metadata?.stripe_customer_id ? undefined : user.email || undefined,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: user.id, plan },
      success_url: `${siteUrl}/?billing=success`,
      cancel_url:  `${siteUrl}/?billing=cancelled`,
    }

    if (planConfig.mode === 'subscription') {
      sessionParams.subscription_data = { metadata: { user_id: user.id, plan } }
    }

    const session = await stripe.checkout.sessions.create(sessionParams)
    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[create-checkout-session]', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
