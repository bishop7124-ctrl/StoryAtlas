export const DEFAULT_LOGO_BACKGROUND = '#0c0c12'
export const DEFAULT_LOGO_BACKGROUND_TRANSPARENT = true

export function normalizeFactionLogo(logo) {
  if (Array.isArray(logo)) {
    return {
      shapes: logo,
      backgroundColor: DEFAULT_LOGO_BACKGROUND,
      backgroundTransparent: DEFAULT_LOGO_BACKGROUND_TRANSPARENT,
    }
  }

  if (logo && typeof logo === 'object') {
    return {
      shapes: Array.isArray(logo.shapes) ? logo.shapes : [],
      backgroundColor: logo.backgroundColor || DEFAULT_LOGO_BACKGROUND,
      backgroundTransparent: Object.hasOwn(logo, 'backgroundTransparent')
        ? Boolean(logo.backgroundTransparent)
        : DEFAULT_LOGO_BACKGROUND_TRANSPARENT,
    }
  }

  return {
    shapes: [],
    backgroundColor: DEFAULT_LOGO_BACKGROUND,
    backgroundTransparent: DEFAULT_LOGO_BACKGROUND_TRANSPARENT,
  }
}
