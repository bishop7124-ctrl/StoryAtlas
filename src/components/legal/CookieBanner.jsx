import { useState, useEffect } from 'react'
import { getCookieConsent, setCookieConsent } from '../../utils/cookieConsent'

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  card: {
    background: 'var(--bg-nav, #1a1c1b)',
    border: '1px solid var(--border, #2d302b)',
    borderRadius: 12,
    width: 'min(480px, 100%)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--border, #2d302b)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  toggle: (on) => ({
    flexShrink: 0, width: 36, height: 20, borderRadius: 10,
    background: on ? 'var(--accent, #b8aa79)' : 'var(--border, #2d302b)',
    border: 'none', cursor: 'pointer', position: 'relative',
    transition: 'background .15s',
  }),
  knob: (on) => ({
    position: 'absolute', top: 3, left: on ? 19 : 3,
    width: 14, height: 14, borderRadius: '50%',
    background: 'var(--bg-main, #101211)',
    transition: 'left .15s',
    pointerEvents: 'none',
  }),
}

function ManageModal({ onSave, onClose }) {
  const current = getCookieConsent()
  const [prefs, setPrefs] = useState({
    preferences: current !== 'essential',
    analytics: current === 'all',
  })

  const save = () => {
    let level = 'essential'
    if (prefs.analytics) level = 'all'
    else if (prefs.preferences) level = 'preferences'
    onSave(level)
  }

  const Row = ({ title, desc, checked, onChange, disabled }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main, #e4dfd2)', marginBottom: 3 }}>{title}</p>
        <p style={{ fontSize: 12, color: 'var(--text-muted, #8f9288)', lineHeight: 1.5 }}>{desc}</p>
      </div>
      <div style={{ flexShrink: 0, opacity: disabled ? 0.45 : 1 }}>
        <button
          type="button"
          onClick={disabled ? undefined : onChange}
          disabled={disabled}
          style={s.toggle(checked)}
          aria-checked={checked}
          role="switch"
        >
          <div style={s.knob(checked)} />
        </button>
      </div>
    </div>
  )

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={s.overlay}>
      <div style={s.card}>
        <div style={s.modalHeader}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main, #e4dfd2)' }}>Cookie Preferences</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #8f9288)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>✕</button>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Row
            title="Essential"
            desc="Authentication tokens and security. Required for the app to function."
            checked={true}
            disabled={true}
          />
          <Row
            title="Preferences"
            desc="Saves your theme, font, and interface settings between sessions."
            checked={prefs.preferences}
            onChange={() => setPrefs(p => ({ ...p, preferences: !p.preferences }))}
          />
          <Row
            title="Analytics"
            desc="Anonymous usage data to help us improve the product. Never linked to your identity."
            checked={prefs.analytics}
            onChange={() => setPrefs(p => ({ ...p, analytics: !p.analytics }))}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border, #2d302b)' }}>
            <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid var(--border, #2d302b)', background: 'transparent', color: 'var(--text-muted, #8f9288)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={save} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--accent, #b8aa79)', color: 'var(--bg-main, #101211)', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Save preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CookieBanner({ onOpenPolicy }) {
  const [visible, setVisible] = useState(false)
  const [showManage, setShowManage] = useState(false)

  useEffect(() => {
    if (!getCookieConsent()) setVisible(true)

    const handler = () => setVisible(false)
    window.addEventListener('cookie-consent-change', handler)
    return () => window.removeEventListener('cookie-consent-change', handler)
  }, [])

  if (!visible) return null

  const accept = () => { setCookieConsent('all'); setVisible(false) }
  const decline = () => { setCookieConsent('essential'); setVisible(false) }
  const handleSavePrefs = (level) => { setCookieConsent(level); setVisible(false); setShowManage(false) }

  return (
    <>
      <div className="cookie-banner" role="region" aria-label="Cookie consent">
        <div className="cookie-banner-text">
          <p className="cookie-banner-title">This site uses cookies</p>
          <p className="cookie-banner-desc">
            Essential cookies keep you signed in. Optional cookies remember your preferences.{' '}
            {onOpenPolicy && (
              <button type="button" onClick={onOpenPolicy} className="cookie-banner-link">
                Cookie policy
              </button>
            )}
          </p>
        </div>
        <div className="cookie-banner-actions">
          <button type="button" onClick={() => setShowManage(true)} className="cookie-btn cookie-btn-ghost">
            Manage
          </button>
          <button type="button" onClick={decline} className="cookie-btn cookie-btn-outline">
            Essential only
          </button>
          <button type="button" onClick={accept} className="cookie-btn cookie-btn-primary">
            Accept all
          </button>
        </div>
      </div>
      {showManage && <ManageModal onSave={handleSavePrefs} onClose={() => setShowManage(false)} />}
    </>
  )
}
