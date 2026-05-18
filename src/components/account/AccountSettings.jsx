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

function getProfileDraft(user) {
  const metadata = user?.user_metadata || {}
  return {
    fullName: metadata.full_name || metadata.name || user?.displayName || '',
    alias: metadata.alias || metadata.writer_alias || '',
    bio: metadata.bio || '',
    website: metadata.website || '',
    avatarUrl: metadata.avatar_url || user?.photoURL || '',
  }
}

function ProfileDetails({ user, updateProfile }) {
  const [profileDraft, setProfileDraft] = useState(() => getProfileDraft(user))
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const profileDisplayName = profileDraft.fullName.trim() || profileDraft.alias.trim() || user.email?.split('@')[0] || 'Writer'
  const avatarInitial = profileDisplayName[0]?.toUpperCase() || '?'
  const createdAt = user.created_at || user.createdAt

  const updateProfileField = (field) => (event) => {
    setProfileDraft(current => ({ ...current, [field]: event.target.value }))
    setProfileMessage('')
    setProfileError('')
  }

  const saveProfile = async (event) => {
    event.preventDefault()

    try {
      setProfileBusy(true)
      setProfileMessage('')
      setProfileError('')
      const nextProfile = {
        ...(user.user_metadata || {}),
        full_name: profileDraft.fullName.trim(),
        name: profileDraft.fullName.trim(),
        alias: profileDraft.alias.trim(),
        writer_alias: profileDraft.alias.trim(),
        bio: profileDraft.bio.trim(),
        website: profileDraft.website.trim(),
        avatar_url: profileDraft.avatarUrl.trim(),
      }
      await updateProfile(nextProfile)
      setProfileMessage('Profile details saved.')
    } catch (error) {
      setProfileError(error.message || 'Profile details could not be saved right now.')
    } finally {
      setProfileBusy(false)
    }
  }

  return (
    <section className="account-settings-panel account-profile-panel">
      <div className="account-panel-heading">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Writer details</h2>
        </div>
        <div className="account-profile-avatar" aria-hidden="true">
          {profileDraft.avatarUrl ? (
            <img src={profileDraft.avatarUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span>{avatarInitial}</span>
          )}
        </div>
      </div>

      <form className="account-profile-form" onSubmit={saveProfile}>
        <label>
          <span>Name</span>
          <input value={profileDraft.fullName} onChange={updateProfileField('fullName')} placeholder="Your name" />
        </label>
        <label>
          <span>Writing alias</span>
          <input value={profileDraft.alias} onChange={updateProfileField('alias')} placeholder="Pen name or studio name" />
        </label>
        <label className="account-profile-wide">
          <span>Bio</span>
          <textarea value={profileDraft.bio} onChange={updateProfileField('bio')} placeholder="A short note for your creative profile" rows={4} />
        </label>
        <label>
          <span>Website</span>
          <input value={profileDraft.website} onChange={updateProfileField('website')} placeholder="https://example.com" inputMode="url" />
        </label>
        <label>
          <span>Avatar URL</span>
          <input value={profileDraft.avatarUrl} onChange={updateProfileField('avatarUrl')} placeholder="https://..." inputMode="url" />
        </label>

        <div className="account-profile-summary account-profile-wide">
          <div>
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div>
            <span>Account created</span>
            <strong>{createdAt ? formatter.format(new Date(createdAt)) : 'Unknown'}</strong>
          </div>
        </div>

        <div className="account-actions account-profile-wide">
          <button type="submit" className="account-primary-button" disabled={profileBusy}>
            {profileBusy ? 'Saving...' : 'Save profile'}
          </button>
        </div>

        {profileMessage && <p className="account-success account-profile-wide">{profileMessage}</p>}
        {profileError && <p className="account-error account-profile-wide">{profileError}</p>}
      </form>
    </section>
  )
}

export default function AccountSettings({ open, onClose }) {
  const { user, getAccessToken, updateProfile } = useAuth()
  const membership = useMemo(() => getMembership(user), [user])
  const [billingBusy, setBillingBusy] = useState('')
  const [billingError, setBillingError] = useState('')

  if (!open || !user) return null

  const openBilling = async (type) => {
    const endpoint = billingEndpoints[type]
    if (!endpoint) {
      setBillingError('Paid memberships are coming soon. Check back shortly!')
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
          <ProfileDetails key={user.id} user={user} updateProfile={updateProfile} />

          <section className="account-settings-panel">
            <div className="account-panel-heading">
              <div>
                <p className="eyebrow">Membership</p>
                <h2>Your Own World</h2>
              </div>
              <PlanBadge membership={membership} />
            </div>

            <div className="account-plan-card">
              <div>
                <p className="account-plan-name">Paid membership</p>
                <p className="account-plan-price">£{MEMBERSHIP_PRICE_GBP}<span>/pm</span></p>
              </div>
              <p>Full editing access beyond the free trial period.</p>
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

        </main>
      </div>
    </div>
  )
}
