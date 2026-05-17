export const MEMBERSHIP_PRICE_GBP = 10
export const TRIAL_DAYS = 28

const DAY_MS = 24 * 60 * 60 * 1000
const PAID_STATUSES = new Set(['active', 'trialing'])

const dateFrom = (value) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

export function getMembership(user) {
  const createdAt = dateFrom(user?.created_at || user?.createdAt)
  const trialStartedAt = dateFrom(user?.user_metadata?.trial_started_at) || createdAt || new Date()
  const trialEndsAt = new Date(trialStartedAt.getTime() + TRIAL_DAYS * DAY_MS)
  const now = new Date()
  const subscriptionStatus = user?.app_metadata?.subscription_status || user?.user_metadata?.subscription_status || 'none'
  const isPaid = PAID_STATUSES.has(subscriptionStatus)
  const isTrialActive = !isPaid && now < trialEndsAt
  const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY_MS))
  const isReadOnly = !isPaid && !isTrialActive

  return {
    plan: isPaid ? 'paid' : isTrialActive ? 'trial' : 'read_only',
    subscriptionStatus,
    isPaid,
    isTrialActive,
    isReadOnly,
    trialStartedAt,
    trialEndsAt,
    daysRemaining,
    priceLabel: `£${MEMBERSHIP_PRICE_GBP}/pm`,
  }
}
