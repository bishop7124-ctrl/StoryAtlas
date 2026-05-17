import Stripe from 'npm:stripe@17.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2.39.7'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2024-12-18.acacia' })
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_ANON_KEY') || '',
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization') || ''
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (error || !user) return jsonResponse({ error: 'Unauthorized' }, 401)

  const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
  const priceId = Deno.env.get('STRIPE_PRICE_ID')
  if (!priceId) return jsonResponse({ error: 'Missing STRIPE_PRICE_ID' }, 500)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: user.app_metadata?.stripe_customer_id || undefined,
    customer_email: user.app_metadata?.stripe_customer_id ? undefined : user.email || undefined,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${siteUrl}/?billing=success`,
    cancel_url: `${siteUrl}/?billing=cancelled`,
  })

  return jsonResponse({ url: session.url })
})
