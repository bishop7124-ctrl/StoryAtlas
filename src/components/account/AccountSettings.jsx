import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { PLANS, getMembership } from '../../utils/membership'
import { getStorageQuota } from '../../utils/storageQuota'
import StorageCard from './StorageCard'
import { getCookieConsent, setCookieConsent } from '../../utils/cookieConsent'
import {
  BUILT_IN_THEMES,
  DEFAULT_CUSTOM_COLORS,
  QUICK_PALETTES,
  applyThemeToDocument,
  applyThemeTuning,
  getThemeColors,
  getThemeTuning,
  loadThemeChoice,
  loadThemeTuning,
  rgbaFromHex,
  saveThemeChoice,
  saveThemeTuning,
} from '../../utils/theme'

const FONT_OPTIONS = [
  { id: 'system', label: 'System UI', value: 'system-ui, sans-serif' },
  { id: 'serif', label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { id: 'mono', label: 'Mono', value: '"SFMono-Regular", Consolas, "Liberation Mono", monospace' },
  { id: 'dyslexia', label: 'Dyslexie', value: 'Dyslexie, "OpenDyslexic", "Atkinson Hyperlegible", Verdana, Arial, sans-serif' },
]

const CUSTOM_COLOR_FIELDS = [
  { key: 'bgMain', label: 'Background' },
  { key: 'bgNav', label: 'Panels' },
  { key: 'textMain', label: 'Main text' },
  { key: 'textMuted', label: 'Muted text' },
  { key: 'accent', label: 'Accent' },
  { key: 'border', label: 'Borders' },
]

const loadCustomColors = () => {
  try { return JSON.parse(localStorage.getItem('nf-custom-colors') || '{}') }
  catch { return {} }
}

const loadSavedPresets = () => {
  try { return JSON.parse(localStorage.getItem('nf-saved-presets') || '[]') }
  catch { return [] }
}

function applyFontChoice(fontChoice) {
  const font = FONT_OPTIONS.find(option => option.id === fontChoice) || FONT_OPTIONS[0]
  localStorage.setItem('nf-font', font.id)
  document.documentElement.style.setProperty('--font', font.value)
}

const getLuminance = (hex) => {
  if (!hex) return 0
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return 0
  const v = parseInt(clean, 16)
  if (isNaN(v)) return 0
  return (0.2126 * ((v >> 16) & 255) + 0.7152 * ((v >> 8) & 255) + 0.0722 * (v & 255)) / 255
}

function ThemeChoiceButton({ theme: p, active, onClick }) {
  return (
    <button type="button" className={`theme-choice-button${active ? ' is-active' : ''}`} onClick={onClick}>
      <span className="theme-choice-swatches" aria-hidden="true">
        {[p.swatches.bgMain, p.swatches.bgNav, p.swatches.accent, p.swatches.textMain].map((c, i) => (
          <span key={`${c}-${i}`} style={{ background: c }} />
        ))}
      </span>
      <span className="theme-choice-copy">
        <span>{p.label}</span>
        <small>{p.description}</small>
      </span>
      {active && <span className="theme-choice-active">Selected</span>}
    </button>
  )
}

function ThemeLivePreview({ colors, radiusUnit, visualStrength, label }) {
  const r = Number(radiusUnit) || 7
  const strength = Number(visualStrength) || 1
  const shadow = `0 ${Math.round(18 * strength)}px ${Math.round(48 * strength)}px rgba(0,0,0,${Math.min(0.55, 0.16 * strength)})`
  const previewVars = {
    '--preview-bg': colors.bgMain,
    '--preview-panel': colors.bgNav,
    '--preview-text': colors.textMain,
    '--preview-muted': colors.textMuted,
    '--preview-accent': colors.accent,
    '--preview-border': colors.border,
    '--preview-accent-fade': rgbaFromHex(colors.accent, Math.min(0.28, 0.1 + strength * 0.07)),
    '--preview-radius': `${r}px`,
    '--preview-radius-sm': `${Math.max(3, r * 0.65)}px`,
    '--preview-radius-lg': `${r * 2.4}px`,
    '--preview-shadow': shadow,
  }

  return (
    <aside className="theme-live-preview" style={previewVars}>
      <div className="theme-live-preview-shell">
        <div className="theme-live-topbar">
          <div>
            <span className="theme-live-kicker">{label}</span>
            <strong>Your Own World</strong>
          </div>
          <button type="button">New</button>
        </div>
        <div className="theme-live-body">
          <nav className="theme-live-sidebar">
            {['Library', 'Manuscript', 'Characters', 'Timeline'].map((item, i) => (
              <span key={item} className={i === 1 ? 'is-active' : ''}>{item}</span>
            ))}
          </nav>
          <main className="theme-live-main">
            <section className="theme-live-card">
              <div className="theme-live-card-head">
                <div>
                  <small>Chapter 12</small>
                  <strong>The Last Door</strong>
                </div>
                <span>Draft</span>
              </div>
              <p>Marin pressed the brass key into the lock and listened as the house remembered her name.</p>
              <div className="theme-live-actions">
                <button type="button">Continue</button>
                <button type="button">Notes</button>
              </div>
            </section>
            <div className="theme-live-grid">
              <div><strong>24</strong><span>Scenes</span></div>
              <div><strong>8.4k</strong><span>Words</span></div>
            </div>
          </main>
        </div>
      </div>
    </aside>
  )
}

function PreferencesPanel() {
  const [cookieLevel, setCookieLevel] = useState(() => getCookieConsent() || 'essential')
  const [cookieSaved, setCookieSaved] = useState(false)

  const saveCookies = () => {
    setCookieConsent(cookieLevel)
    setCookieSaved(true)
    setTimeout(() => setCookieSaved(false), 2200)
  }

  const Toggle = ({ checked, onChange, label }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
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
                    <Toggle checked={true} onChange={() => {}} label={`${label} cookies (always active)`} />
                  ) : key === 'all' ? (
                    <Toggle
                      checked={checked}
                      label={`${label} cookies`}
                      onChange={() => setCookieLevel(p => p === 'all' ? 'preferences' : 'all')}
                    />
                  ) : (
                    <Toggle
                      checked={checked}
                      label={`${label} cookies`}
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

function AppearancePanel({ user, updateProfile }) {
  const [theme, setTheme] = useState(loadThemeChoice)
  const [fontChoice, setFontChoice] = useState(() => localStorage.getItem('nf-font') || 'system')
  const [customColors, setCustomColors] = useState(loadCustomColors)
  const [themeTuning, setThemeTuning] = useState(loadThemeTuning)
  const [savedPresets, setSavedPresets] = useState(loadSavedPresets)
  const [savePresetName, setSavePresetName] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)

  const themeOptions = [...BUILT_IN_THEMES, ...QUICK_PALETTES]
  const selectedThemeOption = themeOptions.find(t => t.id === theme)
  const effectiveColors = useMemo(() => getThemeColors(theme, customColors), [theme, customColors])
  const effectiveRadius = themeTuning.radiusUnit || selectedThemeOption?.radiusUnit || 7
  const effectiveStrength = themeTuning.visualStrength || 1
  const groupedThemes = useMemo(() => {
    const builtIns = BUILT_IN_THEMES.reduce((groups, option) => {
      const key = getLuminance(option.swatches.bgMain) > 0.55 ? 'Light' : 'Dark'
      groups[key].push(option)
      return groups
    }, { Dark: [], Light: [] })
    return [
      { label: 'Dark themes', options: builtIns.Dark },
      { label: 'Light themes', options: builtIns.Light },
    ]
  }, [])

  useEffect(() => {
    localStorage.setItem('nf-saved-presets', JSON.stringify(savedPresets))
  }, [savedPresets])

  useEffect(() => {
    const appliedTheme = applyThemeToDocument(theme, customColors)
    applyThemeTuning(themeTuning, getThemeColors(appliedTheme, customColors))
    localStorage.setItem('nf-theme', appliedTheme)
  }, [theme, customColors, themeTuning])

  useEffect(() => {
    localStorage.setItem('nf-custom-colors', JSON.stringify(customColors))
  }, [customColors])

  useEffect(() => {
    saveThemeTuning(themeTuning, effectiveColors)
  }, [themeTuning, effectiveColors])

  useEffect(() => {
    applyFontChoice(fontChoice)
  }, [fontChoice])

  const applyPalette = (swatches, tuning) => {
    setCustomColors(swatches)
    if (tuning) setThemeTuning(tuning)
    setTheme('custom')
  }

  const applyThemePreset = (id) => {
    const appliedTheme = saveThemeChoice(id, customColors)
    setThemeTuning(getThemeTuning(appliedTheme, themeTuning))
    setTheme(appliedTheme)
  }

  const handleSavePreset = () => {
    const name = savePresetName.trim()
    if (!name) return
    setSavedPresets(prev => [...prev, {
      id: `saved-${Date.now()}`,
      label: name,
      swatches: { ...effectiveColors },
      tuning: { ...themeTuning },
    }])
    setSavePresetName('')
  }

  const handleDeletePreset = (id) => {
    setSavedPresets(prev => prev.filter(p => p.id !== id))
  }

  const handleMovePreset = (id, dir) => {
    setSavedPresets(prev => {
      const idx = prev.findIndex(p => p.id === id)
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
      return next
    })
  }

  const saveAppearanceToProfile = async () => {
    const appliedTheme = saveThemeChoice(theme, customColors)
    saveThemeTuning(themeTuning, getThemeColors(appliedTheme, customColors))
    setTheme(appliedTheme)

    try {
      await updateProfile({
        ...(user.user_metadata || {}),
        theme: appliedTheme,
        custom_theme_colors: appliedTheme === 'custom' ? { ...customColors } : undefined,
        theme_radius_unit: themeTuning.radiusUnit,
        theme_visual_strength: themeTuning.visualStrength,
      })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2200)
    } catch {
      // Local appearance is already saved, so profile sync can fail quietly.
    }
  }

  const btnStyle = (active) => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
    color: active ? 'var(--text-main)' : 'var(--text-muted)', fontSize: 11, lineHeight: 1,
  })

  return (
    <section className="account-settings-panel account-appearance-panel">
      <div className="account-panel-heading">
        <div>
          <p className="eyebrow">Appearance</p>
          <h2>Themes &amp; display</h2>
        </div>
        <div className="account-actions account-heading-actions">
          <button type="button" onClick={saveAppearanceToProfile} className="account-primary-button">
            Save to profile
          </button>
          {profileSaved && <span className="account-inline-success">Saved</span>}
        </div>
      </div>

      <div className="account-appearance-editor">
        <div className="account-appearance-main">
          <div className="account-appearance-section account-theme-library">
            <p className="eyebrow mb-4">Theme</p>
            <div className="account-theme-groups">
              {groupedThemes.map(group => (
                <div key={group.label} className="account-theme-group">
                  <p className="account-theme-group-title">{group.label}</p>
                  <div className="account-theme-list">
                    {group.options.map(p => (
                      <ThemeChoiceButton
                        key={p.id}
                        theme={p}
                        active={theme === p.id}
                        onClick={() => applyThemePreset(p.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {savedPresets.length > 0 && (
              <>
                <p className="eyebrow mb-2" style={{ marginTop: 20 }}>My presets</p>
                <div className="account-theme-list account-saved-preset-list">
                  {savedPresets.map((p, i) => (
                    <div key={p.id} className="account-saved-preset">
                      <button onClick={() => applyPalette(p.swatches, p.tuning)} className="account-saved-preset-main">
                        <div className="flex items-center gap-2">
                          <div className="account-theme-swatches">
                            {[p.swatches.bgMain, p.swatches.bgNav, p.swatches.accent, p.swatches.textMain].map(c => (
                              <span key={c} className="account-theme-swatch is-small" style={{ background: c }} />
                            ))}
                          </div>
                          <span>{p.label}</span>
                        </div>
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => handleMovePreset(p.id, -1)} disabled={i === 0} style={btnStyle(i > 0)} title="Move up">▲</button>
                        <button onClick={() => handleMovePreset(p.id, 1)} disabled={i === savedPresets.length - 1} style={btnStyle(i < savedPresets.length - 1)} title="Move down">▼</button>
                        <button onClick={() => handleDeletePreset(p.id)} style={{ ...btnStyle(true), color: 'var(--text-muted)', marginLeft: 2 }} title="Delete">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="account-preset-save" style={{ marginTop: savedPresets.length > 0 ? 8 : 16 }}>
              <input
                value={savePresetName}
                onChange={e => setSavePresetName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSavePreset()}
                placeholder="Save current as preset..."
                className="account-appearance-input"
              />
              <button onClick={handleSavePreset} disabled={!savePresetName.trim()} className="account-mini-button">Save</button>
            </div>
          </div>

          <div className="account-appearance-section account-color-section">
            <p className="eyebrow mb-5">Custom colours</p>
            <div className="account-color-grid">
              {CUSTOM_COLOR_FIELDS.map(({ key, label }) => {
                const val = effectiveColors[key] || '#888888'
                return (
                  <div key={key} className="account-color-field">
                    <p>{label}</p>
                    <div className="account-color-control">
                      <input type="color" value={val}
                        onChange={e => {
                          const v = e.target.value
                          setCustomColors(() => {
                            const base = theme !== 'custom'
                              ? { ...(themeOptions.find(t => t.id === theme)?.swatches || DEFAULT_CUSTOM_COLORS) }
                              : { ...effectiveColors }
                            return { ...base, [key]: v }
                          })
                          setTheme('custom')
                        }}
                        className="account-color-picker"
                      />
                      <input value={val}
                        onChange={e => {
                          const v = e.target.value
                          setCustomColors(() => {
                            const base = theme !== 'custom'
                              ? { ...(themeOptions.find(t => t.id === theme)?.swatches || DEFAULT_CUSTOM_COLORS) }
                              : { ...effectiveColors }
                            return { ...base, [key]: v }
                          })
                          setTheme('custom')
                        }}
                        className="account-appearance-input account-color-hex"
                      />
                      <div className="account-color-preview" style={{ background: val }} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="account-tuning-grid">
              <div className="account-range-field">
                <div>
                  <span>Corner roundness</span>
                  <strong>{Math.round(effectiveRadius)}px</strong>
                </div>
                <input
                  type="range"
                  min={2}
                  max={16}
                  step={1}
                  value={effectiveRadius}
                  onChange={e => setThemeTuning(prev => ({ ...prev, radiusUnit: Number(e.target.value) }))}
                />
              </div>
              <div className="account-range-field">
                <div>
                  <span>Colour &amp; shadow strength</span>
                  <strong>{Math.round(effectiveStrength * 100)}%</strong>
                </div>
                <input
                  type="range"
                  min={0.45}
                  max={1.7}
                  step={0.05}
                  value={effectiveStrength}
                  onChange={e => setThemeTuning(prev => ({ ...prev, visualStrength: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          <div className="account-appearance-section account-display-section">
            <p className="eyebrow mb-3">Font family</p>
            <div className="account-choice-list">
              {FONT_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setFontChoice(opt.id)}
                  className={`account-choice-button${fontChoice === opt.id ? ' is-active' : ''}`}
                  style={{
                    fontFamily: opt.value,
                  }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</div>
                  <div style={{ fontSize: 10, marginTop: 2, opacity: 0.6 }}>The quick brown fox</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <ThemeLivePreview
          colors={effectiveColors}
          radiusUnit={effectiveRadius}
          visualStrength={effectiveStrength}
          label={theme === 'custom' ? 'Custom theme' : selectedThemeOption?.label || 'Theme'}
        />
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
  let label = 'Free'
  if (membership.isTrialActive) label = 'Trial'
  else if (membership.isPaid) label = membership.activePlanDef?.label || 'Premium'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span className={`account-plan-badge account-plan-${membership.plan}`}>
        {label}
      </span>
      {membership.isFounder && (
        <span style={{
          fontSize: 10, fontWeight: 900, letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: '#f59e0b',
          background: 'rgba(245,158,11,.12)',
          border: '1px solid rgba(245,158,11,.35)',
          borderRadius: 4, padding: '2px 8px',
        }}>
          Founder
        </span>
      )}
    </div>
  )
}

function PlanCard({ plan, membership, onSelect, busy, anyBusy }) {
  const isCurrent = membership.activePlanKey === plan.key
    || (membership.isTrialActive && plan.key === 'free') // treat "free" as base during trial

  // Lifetime holders can't downgrade to a lower lifetime tier — they already own it.
  const isDowngrade = membership.isLifetime && plan.price < (membership.activePlanDef?.price || 0)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
      borderRadius: 8,
      border: `1px solid ${isCurrent ? 'var(--accent)' : plan.highlight ? 'color-mix(in srgb, var(--accent) 40%, var(--border))' : 'var(--border)'}`,
      background: isCurrent ? 'var(--accent-fade)' : 'var(--bg-main)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontWeight: 900, fontSize: 14, color: 'var(--text-main)' }}>{plan.label}</span>
          {plan.badge && (
            <span style={{
              fontSize: 10, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase',
              color: 'var(--accent)', background: 'var(--accent-fade)', borderRadius: 4, padding: '2px 6px',
            }}>{plan.badge}</span>
          )}
          {isCurrent && (
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase',
              color: membership.isTrialActive ? '#fbbf24' : 'var(--accent)',
            }}>
              {membership.isTrialActive ? 'Trial' : 'Active'}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {plan.description}
        </p>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 60 }}>
        <span style={{ fontWeight: 900, fontSize: 16, color: 'var(--text-main)' }}>{plan.priceLabel}</span>
        {plan.priceSuffix && (
          <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>{plan.priceSuffix}</span>
        )}
      </div>
      <div style={{ flexShrink: 0, minWidth: 110, textAlign: 'right' }}>
        {isCurrent ? (
          <span style={{ fontSize: 12, fontWeight: 800, color: membership.isTrialActive ? '#fbbf24' : 'var(--accent)' }}>
            {membership.isTrialActive ? 'Your trial' : 'Current plan'}
          </span>
        ) : isDowngrade ? null
          : plan.key === 'free' ? (
            membership.isPaid && !membership.isLifetime ? (
              <button
                type="button"
                className="account-secondary-button"
                style={{ fontSize: 12, padding: '0 12px', minHeight: 32 }}
                onClick={() => onSelect(null)}
                disabled={anyBusy}
              >
                {anyBusy ? 'Opening...' : 'Cancel plan'}
              </button>
            ) : membership.isTrialActive ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                Default after trial
              </span>
            ) : null
          ) : (
            <button
              type="button"
              className="account-secondary-button"
              style={{ fontSize: 12, padding: '0 12px', minHeight: 32 }}
              onClick={() => onSelect(plan.key)}
              disabled={anyBusy}
            >
              {busy ? 'Opening...' : plan.key === membership.activePlanKey ? 'Renew' : 'Upgrade'}
            </button>
          )}
      </div>
    </div>
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

export default function AccountSettings({ open, onClose, storageUsedBytes = 0, activeTab = 'profile', onTabChange }) {
  const { user, getAccessToken, updateProfile, refreshUser } = useAuth()
  const membership = useMemo(() => getMembership(user), [user])
  const [billingBusy, setBillingBusy] = useState('')
  const [billingError, setBillingError] = useState('')
  const [billingMessage, setBillingMessage] = useState('')
  const [fallbackTab, setFallbackTab] = useState('profile')
  const selectedTab = onTabChange ? activeTab : fallbackTab
  const setActiveTab = onTabChange || setFallbackTab

  useEffect(() => {
    if (!open) return

    const billingResult = new URLSearchParams(window.location.search).get('billing')
    if (!billingResult) return

    onTabChange?.('membership')
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
  }, [open, refreshUser, onTabChange])

  if (!open || !user) return null

  const openBilling = async (planKey) => {
    // planKey = null → open customer portal; otherwise open checkout for that plan
    const endpoint = planKey ? billingEndpoints.checkout : billingEndpoints.portal
    if (!endpoint) {
      setBillingError('Billing is not configured for this build yet.')
      return
    }

    try {
      setBillingBusy(planKey || 'portal')
      setBillingError('')
      setBillingMessage('')
      const accessToken = await getAccessToken()
      const url = await requestBillingUrl(endpoint, accessToken, {
        userId: user.id,
        email: user.email,
        plan: planKey,
        currency: 'gbp',
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

        <nav className="account-settings-tabs" aria-label="Account settings sections">
          {[
            { id: 'profile', label: 'Profile' },
            { id: 'appearance', label: 'Appearance' },
            { id: 'preferences', label: 'Preferences' },
            { id: 'membership', label: 'Membership' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`account-settings-tab${selectedTab === tab.id ? ' is-active' : ''}`}
              aria-current={selectedTab === tab.id ? true : undefined}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main className="account-settings-grid account-settings-tab-panel">
          {selectedTab === 'profile' && (
            <ProfileDetails key={user.id} user={user} updateProfile={updateProfile} />
          )}

          {selectedTab === 'appearance' && (
            <AppearancePanel user={user} updateProfile={updateProfile} />
          )}

          {selectedTab === 'preferences' && (
            <PreferencesPanel />
          )}

          {selectedTab === 'membership' && (
          <section className="account-settings-panel account-membership-panel">
            <div className="account-panel-heading">
              <div>
                <p className="eyebrow">Membership</p>
                <h2>Your Own World</h2>
              </div>
              <PlanBadge membership={membership} />
            </div>

            {/* Status strip */}
            <div className="account-status-list" style={{ marginBottom: 18 }}>
              {membership.isTrialActive && (
                <>
                  <div>
                    <span>Trial ends</span>
                    <strong>{formatter.format(membership.trialEndsAt)}</strong>
                  </div>
                  <div>
                    <span>Days remaining</span>
                    <strong>{`${membership.daysRemaining} day${membership.daysRemaining === 1 ? '' : 's'}`}</strong>
                  </div>
                  <div>
                    <span>After trial</span>
                    <strong>Free plan (upgrade to keep access)</strong>
                  </div>
                </>
              )}
              {membership.isPaid && !membership.isLifetime && (
                <div>
                  <span>Billing</span>
                  <strong>Monthly — cancel any time</strong>
                </div>
              )}
              {membership.isPaid && membership.isLifetime && (
                <>
                  <div>
                    <span>Billing</span>
                    <strong>Lifetime — no renewal</strong>
                  </div>
                  {membership.isFounder && (
                    <div>
                      <span>Status</span>
                      <strong style={{ color: '#f59e0b' }}>Founder ✦</strong>
                    </div>
                  )}
                </>
              )}
              {membership.isFree && (
                <>
                  <div>
                    <span>Active project</span>
                    <strong>{membership.freeProjectId ? 'Set' : 'Not yet chosen'}</strong>
                  </div>
                  {membership.wasMonthly && (
                    <div>
                      <span>Project lock</span>
                      <strong>Locked — upgrade to change</strong>
                    </div>
                  )}
                </>
              )}
              <div>
                <span>Access level</span>
                <strong>
                  {membership.isPaid
                    ? 'Full access'
                    : membership.isTrialActive
                      ? 'Full access (trial)'
                      : 'Free plan'}
                </strong>
              </div>
            </div>

            {/* Storage card */}
            <div style={{ marginBottom: 18 }}>
              <StorageCard
                usedBytes={storageUsedBytes}
                quotaBytes={getStorageQuota(membership)}
                planLabel={membership.activePlanDef?.label}
                onUpgrade={membership.isFree || membership.isTrialActive
                  ? () => { /* scroll to plans */ }
                  : undefined}
              />
            </div>

            {/* Plan cards */}
            <p style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '.08em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
              marginBottom: 10,
            }}>
              Available plans
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLANS.map(plan => (
                <PlanCard
                  key={plan.key}
                  plan={plan}
                  membership={membership}
                  onSelect={openBilling}
                  busy={billingBusy === plan.key}
                  anyBusy={!!billingBusy}
                />
              ))}
            </div>

            {membership.isFree && (
              <div className="account-readonly-note" style={{ marginTop: 14 }}>
                Free plan includes one active project — all others are view-only. No AI integration on the free plan.
                {membership.wasMonthly && ' Your active project is locked because you previously held a monthly subscription.'}
              </div>
            )}

            {membership.isFounder && (
              <div style={{
                marginTop: 16, padding: '14px 16px',
                borderRadius: 8,
                background: 'rgba(245,158,11,.08)',
                border: '1px solid rgba(245,158,11,.3)',
              }}>
                <p style={{ margin: 0, fontSize: 13, color: '#f59e0b', fontWeight: 700, lineHeight: 1.5 }}>
                  ✦ You are a Founder of Your Own World.
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Your name will appear in the Founder recognition section of the YOW website. Thank you for believing in this from the start.
                </p>
              </div>
            )}

            {/* Portal access for active subscribers */}
            {(membership.isPaid && !membership.isLifetime) && (
              <div className="account-actions">
                <button
                  type="button"
                  className="account-secondary-button"
                  onClick={() => openBilling(null)}
                  disabled={!!billingBusy}
                >
                  {billingBusy === 'portal' ? 'Opening...' : 'Manage subscription & billing'}
                </button>
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <a
                href="/pricing"
                onClick={e => { e.preventDefault(); window.history.pushState(null, '', '/pricing'); window.dispatchEvent(new PopStateEvent('popstate')) }}
                style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}
              >
                View full pricing page →
              </a>
            </div>

            {billingMessage && <p className="account-success">{billingMessage}</p>}
            {billingError && <p className="account-error">{billingError}</p>}
          </section>
          )}

        </main>
      </div>
    </div>
  )
}
