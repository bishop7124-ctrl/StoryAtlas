export const TRIAL_DAYS = 28

const DAY_MS = 24 * 60 * 60 * 1000
const PAID_STATUSES = new Set(['active', 'trialing'])
const LIFETIME_PLAN_KEYS = new Set(['premium_lifetime', 'premium_plus_lifetime', 'founder'])

// Storage quotas in bytes per plan key.
// These are the canonical quota values — also used by storageQuota.js.
export const PLAN_STORAGE_BYTES = {
  free:                  250  * 1024 * 1024,        //  250 MB
  trial:                 10   * 1024 * 1024 * 1024,  //  10 GB (full access during trial)
  premium_monthly:       10   * 1024 * 1024 * 1024,  //  10 GB
  premium_lifetime:       5   * 1024 * 1024 * 1024,  //   5 GB
  premium_plus_lifetime: 10   * 1024 * 1024 * 1024,  //  10 GB
  founder:               25   * 1024 * 1024 * 1024,  //  25 GB
}

// Maximum founder slots. The API also reads from app_config; this is the client-side default.
export const FOUNDER_SLOTS_TOTAL = 100

// Ordered display list — also used by AccountSettings and PricingPage to render plan cards.
export const PLANS = [
  {
    key: 'free',
    label: 'Free',
    price: 0,
    interval: null,
    priceLabel: 'Free',
    priceSuffix: null,
    storageLabelShort: '250 MB',
    description: 'Start building your world. One active project, community support.',
    features: [
      '1 active project',
      '250 MB storage',
      'Basic exports',
      'Bring-your-own-key AI',
      'Community support',
    ],
    badge: null,
    highlight: false,
  },
  {
    key: 'premium_lifetime',
    label: 'YOW Launch Edition Lifetime',
    price: 149,
    interval: 'one_time',
    priceLabel: '£149',
    priceSuffix: 'once',
    storageLabelShort: '5 GB',
    description: 'Own the launch version of YOW forever. Unlimited projects, no recurring fees.',
    longDescription: 'Own this era of the platform outright — unlimited projects and premium exports with a single payment. Covers the launch-era feature set; not a guarantee of every future major update.',
    features: [
      'Unlimited projects',
      '5 GB storage',
      'Premium exports',
      'Bring-your-own-key AI',
      'Priority support',
      'Lifetime access to launch version',
    ],
    badge: null,
    highlight: false,
    disclaimer: 'Lifetime access covers the launch-era version. Future major updates are not guaranteed.',
  },
  {
    key: 'premium_plus_lifetime',
    label: 'YOW Creator Lifetime',
    price: 249,
    interval: 'one_time',
    priceLabel: '£249',
    priceSuffix: 'once',
    storageLabelShort: '10 GB',
    description: 'Everything in Lifetime Launch, plus access to all future platform updates — forever.',
    longDescription: 'The definitive one-time investment. You get every feature we ship going forward, early access to selected future tools, and the peace of mind that your workspace grows with you.',
    features: [
      'Everything in Lifetime Launch',
      '10 GB storage',
      'Access to all future updates',
      'Advanced exports',
      'Backup & version history (upcoming)',
      'Early access to future features',
    ],
    badge: 'Best value',
    highlight: true,
  },
  {
    key: 'founder',
    label: 'YOW Founder',
    price: 399,
    interval: 'one_time',
    priceLabel: '£399',
    priceSuffix: 'once',
    storageLabelShort: '25 GB',
    description: 'Become a named Founder of Your Own World. Limited slots. Your mark on the platform.',
    longDescription: 'For the writers who believe in this from the start. Founder status is permanent, visible, and limited — once the slots are gone, they\'re gone. Feature your first published work on the YOW website, and shape the platform\'s future.',
    features: [
      'Everything in Premium Plus',
      '25 GB storage',
      'Permanent Founder badge',
      'Feature your debut work on YOW',
      'Founder recognition section',
      'Priority feature consideration',
    ],
    badge: 'Exclusive',
    highlight: false,
    isFounder: true,
  },
  {
    key: 'premium_monthly',
    label: 'YOW Monthly Creator',
    price: 10,
    interval: 'month',
    priceLabel: '£10',
    priceSuffix: '/month',
    storageLabelShort: '10 GB',
    description: 'Full platform access on a flexible monthly subscription. Cancel any time.',
    features: [
      'Full platform access',
      '10 GB storage',
      'Future updates included',
      'Cancel any time',
    ],
    badge: null,
    highlight: false,
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
  const isFounder = subscriptionPlan === 'founder'

  const isPaid = PAID_STATUSES.has(subscriptionStatus) || isLifetime
  const isTrialActive = !isPaid && now < trialEndsAt
  const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY_MS))
  const isFree = !isPaid && !isTrialActive

  // wasMonthly: downgraded from a monthly subscription — active project is locked
  const wasMonthly = isFree && (user?.user_metadata?.was_monthly === true)
  const freeProjectId = isFree ? (user?.user_metadata?.free_project_id ?? null) : null

  // 'plan' is the tier category used for CSS badge classes
  const plan = isPaid ? 'paid' : isTrialActive ? 'trial' : 'free'

  const activePlanKey = isPaid
    ? (subscriptionPlan || 'premium_monthly')
    : isTrialActive
      ? 'trial'
      : 'free'

  const activePlanDef = PLANS.find(p => p.key === activePlanKey)
    || PLANS.find(p => p.key === 'premium_monthly') // trial fallback for display

  const storageQuotaBytes = PLAN_STORAGE_BYTES[activePlanKey] ?? PLAN_STORAGE_BYTES.free

  return {
    plan,
    subscriptionPlan,
    activePlanKey,
    activePlanDef,
    subscriptionStatus,
    isPaid,
    isLifetime,
    isFounder,
    isTrialActive,
    isFree,
    isReadOnly: false,
    freeProjectId,
    wasMonthly,
    trialStartedAt,
    trialEndsAt,
    daysRemaining,
    storageQuotaBytes,
    priceLabel: '£10/pm', // legacy compat
  }
}
