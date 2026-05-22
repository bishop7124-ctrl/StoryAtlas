export const TRIAL_DAYS = 28

const DAY_MS = 24 * 60 * 60 * 1000
const PAID_STATUSES = new Set(['active', 'trialing'])
const LIFETIME_PLAN_KEYS = new Set(['premium_lifetime', 'premium_plus_lifetime', 'founder'])

// Ordered display list — also used by AccountSettings to render plan cards.
export const PLANS = [
  {
    key: 'premium_lifetime',
    label: 'Premium Lifetime',
    price: 99,
    interval: 'one_time',
    priceLabel: '£99',
    priceSuffix: 'once',
    description: 'Lifetime access to the full launch version of YOW, outside of Beta.',
    features: ['Full access at launch', 'All project types', 'No monthly fee'],
    badge: null,
  },
  {
    key: 'premium_plus_lifetime',
    label: 'Premium+ Lifetime',
    price: 199,
    interval: 'one_time',
    priceLabel: '£199',
    priceSuffix: 'once',
    description: 'Lifetime access to the most up-to-date version of YOW, forever.',
    features: ['Always latest features', 'All project types', 'No monthly fee'],
    badge: 'Best value',
  },
  {
    key: 'founder',
    label: 'Founder',
    price: 249,
    interval: 'one_time',
    priceLabel: '£249',
    priceSuffix: 'once',
    description: 'Premium+ and option to have your first published work featured on the YOW website.',
    features: ['Everything in Premium+', 'First publication advertised on YOW', 'Exclusive Founder status'],
    badge: 'Exclusive',
  },
  {
    key: 'premium_monthly',
    label: 'Premium',
    price: 10,
    interval: 'month',
    priceLabel: '£10',
    priceSuffix: '/month',
    description: 'Full access to the most up-to-date version of YOW.',
    features: ['Always latest features', 'All project types', 'Cancel anytime'],
    badge: null,
  },
  {
    key: 'free',
    label: 'Free',
    price: 0,
    interval: null,
    priceLabel: 'Free',
    priceSuffix: null,
    description: 'Limited access — one active project, no AI integration.',
    features: ['1 active project', 'Other projects read-only', 'No AI integration'],
    badge: null,
  },
]

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
  const subscriptionPlan = user?.app_metadata?.subscription_plan || user?.user_metadata?.subscription_plan || null
  const isLifetime = LIFETIME_PLAN_KEYS.has(subscriptionPlan)

  const isPaid = PAID_STATUSES.has(subscriptionStatus) || isLifetime
  const isTrialActive = !isPaid && now < trialEndsAt
  const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY_MS))
  const isFree = !isPaid && !isTrialActive

  // wasMonthly: downgraded from a monthly subscription — active project is locked
  const wasMonthly = isFree && (user?.user_metadata?.was_monthly === true)
  const freeProjectId = isFree ? (user?.user_metadata?.free_project_id ?? null) : null

  // 'plan' is the tier category used for CSS badge classes
  const plan = isPaid ? 'paid' : isTrialActive ? 'trial' : 'free'

  // activePlanKey is the specific plan key; trial maps to premium_monthly (what it auto-renews to)
  const activePlanKey = isPaid
    ? (subscriptionPlan || 'premium_monthly')
    : isTrialActive
      ? 'trial'
      : 'free'

  const activePlanDef = PLANS.find(p => p.key === activePlanKey)
    || PLANS.find(p => p.key === 'premium_monthly') // trial fallback for display

  return {
    plan,
    subscriptionPlan,
    activePlanKey,
    activePlanDef,
    subscriptionStatus,
    isPaid,
    isLifetime,
    isTrialActive,
    isFree,
    isReadOnly: false,
    freeProjectId,
    wasMonthly,
    trialStartedAt,
    trialEndsAt,
    daysRemaining,
    priceLabel: '£10/pm', // legacy compat
  }
}
