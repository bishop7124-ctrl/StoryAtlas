export const BUILT_IN_THEMES = [
  { id: 'atelier',     label: 'Atelier',     description: 'Dark forest studio', swatches: { bgMain: '#0e1512', bgNav: '#141c16', textMain: '#dce8d7', textMuted: '#6b856d', accent: '#8fcb9e', border: '#1e2c20' } },
  { id: 'scriptorium', label: 'Scriptorium', description: 'Warm dark desk',     swatches: { bgMain: '#14100c', bgNav: '#241b13', textMain: '#f4ead9', textMuted: '#b8a58f', accent: '#c89445', border: '#3c3023' } },
  { id: 'vellum',      label: 'Vellum',      description: 'Soft paper mode',    swatches: { bgMain: '#f3ead9', bgNav: '#e6d8bf', textMain: '#221b14', textMuted: '#71624e', accent: '#8a3f2d', border: '#c9b89e' } },
]

export const QUICK_PALETTES = [
  { id: 'nord',      label: 'Nord',      swatches: { bgMain: '#2e3440', bgNav: '#3b4252', textMain: '#eceff4', textMuted: '#d8dee9', accent: '#88c0d0', border: '#4c566a' } },
  { id: 'rosepine',  label: 'Rose Pine', swatches: { bgMain: '#191724', bgNav: '#1f1d2e', textMain: '#e0def4', textMuted: '#908caa', accent: '#ebbcba', border: '#403d52' } },
  { id: 'gruvbox',   label: 'Gruvbox',   swatches: { bgMain: '#282828', bgNav: '#1d2021', textMain: '#ebdbb2', textMuted: '#bdae93', accent: '#fabd2f', border: '#504945' } },
]

export const DEFAULT_THEME = BUILT_IN_THEMES[0].id
export const DEFAULT_CUSTOM_COLORS = BUILT_IN_THEMES[0].swatches

const THEME_CSS_VARS = ['--bg-main', '--bg-nav', '--text-main', '--text-muted', '--accent', '--border', '--bg-hover', '--accent-fade', '--logo-filter']
const THEME_OPTIONS = [...BUILT_IN_THEMES, ...QUICK_PALETTES]
const THEME_IDS = new Set(THEME_OPTIONS.map(theme => theme.id))

export const ACCOUNT_THEME_OPTIONS = THEME_OPTIONS.map(theme => ({
  id: theme.id,
  label: theme.label,
  swatches: [theme.swatches.bgMain, theme.swatches.bgNav, theme.swatches.accent, theme.swatches.textMain],
}))

export const normalizeThemeChoice = (theme) => (
  THEME_IDS.has(theme) || theme === 'custom' ? theme : DEFAULT_THEME
)

export const loadThemeChoice = () => normalizeThemeChoice(localStorage.getItem('nf-theme'))

const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') return null
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return null
  const v = parseInt(clean, 16)
  if (Number.isNaN(v)) return null
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }
}

export const rgbaFromHex = (hex, alpha) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return `rgba(255,255,255,${alpha})`
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
}

const logoFilterForBackground = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return 'none'
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
  return luminance > 0.56 ? 'brightness(0)' : 'none'
}

const setThemeVars = (root, colors) => {
  root.style.setProperty('--bg-main', colors.bgMain)
  root.style.setProperty('--bg-nav', colors.bgNav)
  root.style.setProperty('--text-main', colors.textMain)
  root.style.setProperty('--text-muted', colors.textMuted)
  root.style.setProperty('--accent', colors.accent)
  root.style.setProperty('--border', colors.border)
  root.style.setProperty('--bg-hover', rgbaFromHex(colors.textMain, 0.06))
  root.style.setProperty('--accent-fade', rgbaFromHex(colors.accent, 0.18))
  root.style.setProperty('--logo-filter', logoFilterForBackground(colors.bgNav))
}

export const applyThemeToDocument = (theme, customColors = {}) => {
  const root = document.documentElement
  const normalized = normalizeThemeChoice(theme)

  if (normalized === 'custom') {
    root.setAttribute('data-theme', 'custom')
    setThemeVars(root, { ...DEFAULT_CUSTOM_COLORS, ...customColors })
    return normalized
  }

  const quickPalette = QUICK_PALETTES.find(option => option.id === normalized)
  if (quickPalette) {
    root.setAttribute('data-theme', normalized)
    setThemeVars(root, quickPalette.swatches)
    return normalized
  }

  THEME_CSS_VARS.forEach(variable => root.style.removeProperty(variable))
  root.setAttribute('data-theme', normalized)
  return normalized
}

export const saveThemeChoice = (theme, customColors) => {
  const normalized = applyThemeToDocument(theme, customColors)
  localStorage.setItem('nf-theme', normalized)
  return normalized
}
