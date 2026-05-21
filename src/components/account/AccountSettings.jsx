import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { MEMBERSHIP_PRICE_GBP, getMembership } from '../../utils/membership'
import { getCookieConsent, setCookieConsent } from '../../utils/cookieConsent'

// ─── Theme presets (mirrors Layout.jsx) ──────────────────────────────────────

const ACCOUNT_PRESET_THEMES = [
  { id: 'atelier',     label: 'Atelier',     swatches: ['#0e1512', '#141c16', '#8fcb9e', '#dce8d7'] },
  { id: 'scriptorium', label: 'Scriptorium', swatches: ['#14100c', '#241b13', '#c89445', '#f4ead9'] },
  { id: 'vellum',      label: 'Vellum',      swatches: ['#f3ead9', '#e6d8bf', '#8a3f2d', '#221b14'] },
  { id: 'nord',        label: 'Nord',        swatches: ['#2e3440', '#3b4252', '#88c0d0', '#eceff4'] },
  { id: 'rosepine',    label: 'Rosé Pine',   swatches: ['#191724', '#1f1d2e', '#ebbcba', '#e0def4'] },
  { id: 'gruvbox',     label: 'Gruvbox',     swatches: ['#282828', '#1d2021', '#fabd2f', '#ebdbb2'] },
]

function PreferencesPanel({ user, updateProfile }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('nf-theme') || 'atelier')
  const [cookieLevel, setCookieLevel] = useState(() => getCookieConsent() || 'essential')
  const [themeSaved, setThemeSaved] = useState(false)
  const [cookieSaved, setCookieSaved] = useState(false)

  const applyTheme = (id) => {
    setTheme(id)
    localStorage.setItem('nf-theme', id)
    window.dispatchEvent(new CustomEvent('profile-theme-apply', { detail: { theme: id } }))
  }

  const saveTheme = async () => {
    try {
      await updateProfile({ ...(user.user_metadata || {}), theme })
    } catch {
      // non-critical — local save already applied
    }
    setThemeSaved(true)
    setTimeout(() => setThemeSaved(false), 2200)
  }

  const saveCookies = () => {
    setCookieConsent(cookieLevel)
    setCookieSaved(true)
    setTimeout(() => setCookieSaved(false), 2200)
  }

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        flexShrink: 0, width: 36, height: 20, borderRadius: 10,
        background: checked ? 'var(--accent)' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .15s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 19 : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: 'var(--bg-main)', transition: 'left .15s', pointerEvents: 'none',
      }} />
    </button>
  )

  return (
    <section className="account-settings-panel">
      <div className="account-panel-heading">
        <div>
          <p className="eyebrow">Preferences</p>
          <h2>Appearance &amp; privacy</h2>
        </div>
      </div>

      {/* Theme */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Theme</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, marginBottom: 14 }}>
          {ACCOUNT_PRESET_THEMES.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyTheme(p.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${theme === p.id ? 'var(--accent)' : 'var(--border)'}`,
                background: theme === p.id ? 'var(--accent-fade)' : 'transparent',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: theme === p.id ? 'var(--accent)' : 'var(--text-main)' }}>{p.label}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                {p.swatches.map(c => (
                  <span key={c} style={{ width: 12, height: 12, borderRadius: 2, background: c, border: '1px solid rgba(0,0,0,.25)', display: 'inline-block', flexShrink: 0 }} />
                ))}
              </div>
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
          Saves locally and to your profile. Your profile theme loads automatically when you sign in on a new device.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={saveTheme} className="account-primary-button" style={{ width: 'auto', padding: '8px 16px' }}>
            Save theme to profile
          </button>
          {themeSaved && <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>Saved</span>}
        </div>
      </div>

      {/* Cookie preferences */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>Cookie preferences</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          {[
            { key: 'essential', label: 'Essential', desc: 'Authentication and security. Always active.', disabled: true },
            { key: 'preferences', label: 'Preferences', desc: 'Theme, font, and interface settings between sessions.' },
            { key: 'all', label: 'Analytics', desc: 'Anonymous usage data to help improve the product.' },
          ].map(({ key, label, desc, disabled }) => {
            const checked = key === 'essential' ? true : key === 'all' ? cookieLevel === 'all' : cookieLevel !== 'essential'
            return (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</p>
                </div>
                <div style={{ opacity: disabled ? 0.45 : 1, flexShrink: 0 }}>
                  {disabled ? (
                    <Toggle checked={true} onChange={() => {}} />
                  ) : key === 'all' ? (
                    <Toggle
                      checked={checked}
                      onChange={() => setCookieLevel(p => p === 'all' ? 'preferences' : 'all')}
                    />
                  ) : (
                    <Toggle
                      checked={checked}
                      onChange={() => setCookieLevel(p => p === 'essential' ? 'preferences' : 'essential')}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={saveCookies} className="account-primary-button" style={{ width: 'auto', padding: '8px 16px' }}>
            Save cookie preferences
          </button>
          {cookieSaved && <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>Saved</span>}
        </div>
      </div>
    </section>
  )
}

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
  const { user, getAccessToken, updateProfile, refreshUser } = useAuth()
  const membership = useMemo(() => getMembership(user), [user])
  const [billingBusy, setBillingBusy] = useState('')
  const [billingError, setBillingError] = useState('')
  const [billingMessage, setBillingMessage] = useState('')

  useEffect(() => {
    if (!open) return

    const billingResult = new URLSearchParams(window.location.search).get('billing')
    if (!billingResult) return

    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.delete('billing')
    window.history.replaceState({}, '', nextUrl)

    if (billingResult === 'cancelled') {
      setBillingMessage('Checkout was cancelled. Your account was not changed.')
      return
    }

    setBillingMessage('Checking your membership...')
    refreshUser()
      .then(() => setBillingMessage('Membership details refreshed.'))
      .catch(() => setBillingMessage('Checkout finished. Membership may take a moment to update.'))
  }, [open, refreshUser])

  if (!open || !user) return null

  const openBilling = async (type) => {
    const endpoint = billingEndpoints[type]
    if (!endpoint) {
      setBillingError('Billing is not configured for this build yet.')
      return
    }

    try {
      setBillingBusy(type)
      setBillingError('')
      setBillingMessage('')
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
          <PreferencesPanel user={user} updateProfile={updateProfile} />

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
                onClick={() => openBilling(membership.isPaid ? 'portal' : 'checkout')}
                disabled={billingBusy === 'checkout' || billingBusy === 'portal'}
              >
                {billingBusy ? 'Opening...' : membership.isPaid ? 'Manage membership' : 'Start paid membership'}
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

            {billingMessage && <p className="account-success">{billingMessage}</p>}
            {billingError && <p className="account-error">{billingError}</p>}
          </section>

        </main>
      </div>
    </div>
  )
}
