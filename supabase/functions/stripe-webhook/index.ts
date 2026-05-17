import Stripe from 'npm:stripe@17.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2.39.7'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2024-12-18.acacia' })
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
)

async function updateMembership(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  if (!userId) return

  const { data } = await supabaseAdmin.auth.admin.getUserById(userId)
  const existingMetadata = data.user?.app_metadata || {}

  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...existingMetadata,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_current_period_end: subscription.current_period_end,
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!signature || !webhookSecret) return jsonResponse({ error: 'Webhook is not configured' }, 400)

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Invalid webhook signature' }, 400)
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    await updateMembership(event.data.object as Stripe.Subscription)
  }

  return jsonResponse({ received: true })
})
