export const DEFAULT_LOGO_BACKGROUND = '#0c0c12'

export function normalizeFactionLogo(logo) {
  if (Array.isArray(logo)) {
    return {
      shapes: logo,
      backgroundColor: DEFAULT_LOGO_BACKGROUND,
      backgroundTransparent: false,
    }
  }

  if (logo && typeof logo === 'object') {
    return {
      shapes: Array.isArray(logo.shapes) ? logo.shapes : [],
      backgroundColor: logo.backgroundColor || DEFAULT_LOGO_BACKGROUND,
      backgroundTransparent: Boolean(logo.backgroundTransparent),
    }
  }

  return {
    shapes: [],
    backgroundColor: DEFAULT_LOGO_BACKGROUND,
    backgroundTransparent: false,
  }
}
