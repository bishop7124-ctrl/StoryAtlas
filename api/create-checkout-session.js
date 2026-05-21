import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Vercel API route — replaces supabase/functions/create-checkout-session
// Called by AccountSettings.jsx when a user clicks "Start paid membership"

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

    // Validate the caller is a signed-in user
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' })

    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) return res.status(500).json({ error: 'STRIPE_PRICE_ID not configured' })

    const siteUrl = process.env.SITE_URL || 'http://localhost:5173'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // Re-use an existing Stripe customer if this user has checked out before
      customer:       user.app_metadata?.stripe_customer_id || undefined,
      customer_email: user.app_metadata?.stripe_customer_id ? undefined : user.email || undefined,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: user.id },
      subscription_data: {
        billing_mode: { type: 'flexible' },
        metadata: { user_id: user.id },
      },
      success_url: `${siteUrl}/?billing=success`,
      cancel_url:  `${siteUrl}/?billing=cancelled`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('[create-checkout-session]', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
