import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Vercel API route — replaces supabase/functions/stripe-webhook
//
// Stripe calls this URL directly whenever a subscription event occurs.
// It writes the new subscription status into the user's Supabase app_metadata,
// which is what membership.js reads to decide if the user has an active plan.
//
// IMPORTANT: bodyParser must be disabled so we receive the raw body for
// Stripe's signature verification. Without this, constructEvent() will fail.

export const config = {
  api: { bodyParser: false },
}

// Collect the raw request body as a Buffer
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(Buffer.from(chunk)))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// Find the furthest-future period end across all subscription items
function getCurrentPeriodEnd(subscription) {
  const ends = subscription.items.data
    .map(item => item.current_period_end)
    .filter(v => typeof v === 'number')
  if (ends.length > 0) return Math.max(...ends)
  return subscription.cancel_at || subscription.trial_end || subscription.ended_at
}

// Write subscription fields into the user's app_metadata in Supabase Auth
async function updateMembership(supabaseAdmin, subscription, fallbackUserId) {
  const userId = subscription.metadata?.user_id
    || (typeof subscription.latest_invoice !== 'string'
          ? subscription.latest_invoice?.metadata?.user_id
          : null)
    || fallbackUserId

  if (!userId) {
    console.warn('[stripe-webhook] Could not resolve user_id for subscription', subscription.id)
    return
  }

  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer?.id

  const { data } = await supabaseAdmin.auth.admin.getUserById(userId)
  const existing = data?.user?.app_metadata || {}

  await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...existing,
      stripe_customer_id:                customerId,
      stripe_subscription_id:            subscription.id,
      subscription_status:               subscription.status,
      subscription_current_period_end:   getCurrentPeriodEnd(subscription),
      subscription_cancel_at_period_end: subscription.cancel_at_period_end,
    },
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const signature    = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: 'Webhook not configured — STRIPE_WEBHOOK_SECRET missing' })
  }

  let event
  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err.message)
    return res.status(400).json({ error: err.message || 'Invalid signature' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (!session.subscription) break
        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id
        const sub = await stripe.subscriptions.retrieve(subId, { expand: ['latest_invoice'] })
        await updateMembership(
          supabaseAdmin, sub,
          session.metadata?.user_id || session.client_reference_id
        )
        break
      }

      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        // invoice.subscription is the classic stable field; fall back to the newer parent shape
        const subId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id
            || (typeof invoice.parent?.subscription_details?.subscription === 'string'
                ? invoice.parent.subscription_details.subscription
                : invoice.parent?.subscription_details?.subscription?.id)
        if (!subId) break
        const latestSub = await stripe.subscriptions.retrieve(subId, { expand: ['latest_invoice'] })
        await updateMembership(
          supabaseAdmin, latestSub,
          invoice.metadata?.user_id || invoice.parent?.subscription_details?.metadata?.user_id
        )
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await updateMembership(supabaseAdmin, event.data.object)
        break

      default:
        break // Ignore events we don't handle
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error for', event.type, err)
    return res.status(500).json({ error: err.message })
  }

  return res.status(200).json({ received: true })
}
