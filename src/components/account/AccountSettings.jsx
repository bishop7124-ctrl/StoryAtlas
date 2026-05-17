import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MEMBERSHIP_PRICE_GBP, getMembership } from '../../utils/membership'

const formatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const billingEndpoints = {
  checkout: import.meta.env.VITE_CREATE_CHECKOUT_SESSION_URL,
  portal: import.meta.env.VITE_CUSTOMER_PORTAL_URL,
}

async function requestBillingUrl(endpoint, accessToken, body) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) throw new Error('Billing could not be opened right now.')
  const data = await response.json()
  if (!data?.url) throw new Error('Billing did not return a destination URL.')
  return data.url
}

function PlanBadge({ membership }) {
  const label = membership.isPaid ? 'Paid' : membership.isTrialActive ? 'Free trial' : 'Read only'
  return (
    <span className={`account-plan-badge account-plan-${membership.plan}`}>
      {label}
    </span>
  )
}

export default function AccountSettings({ open, onClose }) {
  const { user, getAccessToken } = useAuth()
  const membership = useMemo(() => getMembership(user), [user])
  const [billingBusy, setBillingBusy] = useState('')
  const [billingError, setBillingError] = useState('')

  if (!open || !user) return null

  const openBilling = async (type) => {
    const endpoint = billingEndpoints[type]
    if (!endpoint) {
      setBillingError('Billing endpoints are not configured yet.')
      return
    }

    try {
      setBillingBusy(type)
      setBillingError('')
      const accessToken = await getAccessToken()
      const url = await requestBillingUrl(endpoint, accessToken, {
        userId: user.id,
        email: user.email,
        price: MEMBERSHIP_PRICE_GBP,
        currency: 'gbp',
        interval: 'month',
      })
      window.location.assign(url)
    } catch (error) {
      setBillingError(error.message || 'Billing could not be opened right now.')
    } finally {
      setBillingBusy('')
    }
  }

  return (
    <div className="account-settings-page" role="dialog" aria-modal="true" aria-labelledby="account-settings-title">
      <div className="account-settings-shell">
        <header className="account-settings-header">
          <div>
            <p className="eyebrow">Account</p>
            <h1 id="account-settings-title">Settings</h1>
          </div>
          <button className="account-icon-button" type="button" onClick={onClose} aria-label="Close account settings">
            ×
          </button>
        </header>

        <main className="account-settings-grid">
          <section className="account-settings-panel">
            <div className="account-panel-heading">
              <div>
                <p className="eyebrow">Membership</p>
                <h2>Story Atlas</h2>
              </div>
              <PlanBadge membership={membership} />
            </div>

            <div className="account-plan-card">
              <div>
                <p className="account-plan-name">Paid membership</p>
                <p className="account-plan-price">£{MEMBERSHIP_PRICE_GBP}<span>/pm</span></p>
              </div>
              <p>
                Full editing access after the free trial, with payment handled through Stripe Checkout and subscription changes handled through Stripe Customer Portal.
              </p>
            </div>

            <div className="account-status-list">
              <div>
                <span>Trial ends</span>
                <strong>{formatter.format(membership.trialEndsAt)}</strong>
              </div>
              <div>
                <span>Trial time left</span>
                <strong>{membership.isPaid ? 'Covered by membership' : `${membership.daysRemaining} day${membership.daysRemaining === 1 ? '' : 's'}`}</strong>
              </div>
              <div>
                <span>Current access</span>
                <strong>{membership.isReadOnly ? 'Read only' : 'Editing enabled'}</strong>
              </div>
            </div>

            {membership.isReadOnly && (
              <div className="account-readonly-note">
                Your free trial has ended, so projects can be opened and read but changes are paused until a paid membership is active.
              </div>
            )}

            <div className="account-actions">
              <button
                type="button"
                className="account-primary-button"
                onClick={() => openBilling('checkout')}
                disabled={billingBusy === 'checkout'}
              >
                {billingBusy === 'checkout' ? 'Opening…' : membership.isPaid ? 'Update membership' : 'Start paid membership'}
              </button>
              <button
                type="button"
                className="account-secondary-button"
                onClick={() => openBilling('portal')}
                disabled={billingBusy === 'portal'}
              >
                {billingBusy === 'portal' ? 'Opening…' : 'Manage payment'}
              </button>
            </div>

            {billingError && <p className="account-error">{billingError}</p>}
          </section>

          <aside className="account-settings-panel account-setup-panel">
            <p className="eyebrow">Payment setup</p>
            <h2>Recommended integration</h2>
            <p>
              Use a Supabase Edge Function to create Stripe Checkout sessions for the £10 monthly subscription, then update each user’s server metadata from Stripe webhooks.
            </p>
            <p>
              Configure `VITE_CREATE_CHECKOUT_SESSION_URL` and `VITE_CUSTOMER_PORTAL_URL` when those functions are deployed.
            </p>
          </aside>
        </main>
      </div>
    </div>
  )
}
