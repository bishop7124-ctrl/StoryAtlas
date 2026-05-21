// Cookie consent levels:  'all' | 'preferences' | 'essential' | null (not yet set)

export function getCookieConsent() {
  try {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('yow_consent='))
    return match ? match.trim().slice('yow_consent='.length) : null
  } catch {
    return null
  }
}

export function setCookieConsent(level) {
  const maxAge = 60 * 60 * 24 * 365 // 1 year
  document.cookie = `yow_consent=${level}; max-age=${maxAge}; path=/; SameSite=Lax`
  window.dispatchEvent(new CustomEvent('cookie-consent-change', { detail: { level } }))
}

export function hasConsent(feature) {
  const level = getCookieConsent()
  if (!level) return false
  if (level === 'all') return true
  if (level === 'preferences' && (feature === 'preferences' || feature === 'essential')) return true
  if (level === 'essential' && feature === 'essential') return true
  return false
}
