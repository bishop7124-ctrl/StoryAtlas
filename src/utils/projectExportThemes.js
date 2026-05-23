const serifStack = 'Georgia, "Times New Roman", serif'
const sansStack = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export const EXPORT_PDF_THEMES = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Codex',
    tagline: 'Soft candlelit encyclopedia',
    palette: {
      page: '#1c1b19',
      pageAlt: '#26231f',
      panel: '#2c2924',
      panelSoft: '#342f27',
      text: '#f2ead9',
      muted: '#cfc2a8',
      faint: '#9d8e74',
      accent: '#d7b86f',
      accent2: '#a98756',
      border: '#7b6a4d',
      shadow: 'rgba(24,20,14,.28)',
    },
    typography: {
      display: serifStack,
      body: serifStack,
      ui: sansStack,
    },
    cover: {
      overlay: 'linear-gradient(125deg, rgba(28,27,25,.22), rgba(215,184,111,.16) 48%, rgba(28,27,25,.58))',
      marker: 'CODEX',
    },
    texture:
      'radial-gradient(circle at 18% 12%, rgba(215,184,111,.11), transparent 25%), linear-gradient(rgba(255,255,255,.024) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)',
  },
  royal: {
    id: 'royal',
    name: 'Royal Archive',
    tagline: 'Misty blue historical manuscript',
    palette: {
      page: '#172331',
      pageAlt: '#203044',
      panel: '#25384d',
      panelSoft: '#2d4054',
      text: '#edf3f5',
      muted: '#c6d1d8',
      faint: '#92a3af',
      accent: '#c9d6df',
      accent2: '#93aabd',
      border: '#708698',
      shadow: 'rgba(12,20,29,.28)',
    },
    typography: {
      display: serifStack,
      body: serifStack,
      ui: sansStack,
    },
    cover: {
      overlay: 'linear-gradient(130deg, rgba(23,35,49,.2), rgba(201,214,223,.15) 50%, rgba(23,35,49,.55))',
      marker: 'ARCHIVE',
    },
    texture:
      'radial-gradient(circle at 80% 20%, rgba(201,214,223,.11), transparent 27%), linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)',
  },
  verdant: {
    id: 'verdant',
    name: 'Verdant Chronicle',
    tagline: 'Muted woodland world lore',
    palette: {
      page: '#1a271f',
      pageAlt: '#233328',
      panel: '#2b3d30',
      panelSoft: '#344737',
      text: '#edf0df',
      muted: '#c8cfad',
      faint: '#8e9a72',
      accent: '#c3a06d',
      accent2: '#8fa36f',
      border: '#7f875e',
      shadow: 'rgba(14,24,16,.27)',
    },
    typography: {
      display: serifStack,
      body: serifStack,
      ui: sansStack,
    },
    cover: {
      overlay: 'linear-gradient(135deg, rgba(26,39,31,.18), rgba(195,160,109,.15) 45%, rgba(26,39,31,.55))',
      marker: 'CHRONICLE',
    },
    texture:
      'radial-gradient(circle at 25% 25%, rgba(143,163,111,.16), transparent 24%), radial-gradient(circle at 78% 72%, rgba(195,160,109,.11), transparent 24%), linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px)',
  },
  ivory: {
    id: 'ivory',
    name: 'Ivory Manuscript',
    tagline: 'Warm printed encyclopedia',
    palette: {
      page: '#f5ecdc',
      pageAlt: '#fff8ed',
      panel: '#fffaf2',
      panelSoft: '#efe4d2',
      text: '#2d261f',
      muted: '#786855',
      faint: '#aa9679',
      accent: '#8b6040',
      accent2: '#b99768',
      border: '#d0bea0',
      shadow: 'rgba(111,82,50,.16)',
    },
    typography: {
      display: serifStack,
      body: serifStack,
      ui: sansStack,
    },
    cover: {
      overlay: 'linear-gradient(130deg, rgba(255,250,242,.42), rgba(185,151,104,.18) 52%, rgba(114,83,52,.15))',
      marker: 'MANUSCRIPT',
    },
    texture:
      'radial-gradient(circle at 15% 18%, rgba(139,96,64,.09), transparent 24%), linear-gradient(rgba(80,55,30,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(80,55,30,.022) 1px, transparent 1px)',
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Empire',
    tagline: 'Dusty rose war chronicle',
    palette: {
      page: '#21191b',
      pageAlt: '#2b2023',
      panel: '#33262a',
      panelSoft: '#3d2b30',
      text: '#f4e8e2',
      muted: '#d6b9b1',
      faint: '#9d7d78',
      accent: '#d16f73',
      accent2: '#a9535b',
      border: '#87565a',
      shadow: 'rgba(26,16,18,.3)',
    },
    typography: {
      display: serifStack,
      body: serifStack,
      ui: sansStack,
    },
    cover: {
      overlay: 'linear-gradient(130deg, rgba(33,25,27,.22), rgba(209,111,115,.16) 48%, rgba(33,25,27,.58))',
      marker: 'EMPIRE',
    },
    texture:
      'radial-gradient(circle at 80% 18%, rgba(209,111,115,.14), transparent 24%), linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.014) 1px, transparent 1px)',
  },
}

export const DEFAULT_EXPORT_PDF_THEME_ID = 'obsidian'

export const EXPORT_PDF_THEME_OPTIONS = Object.values(EXPORT_PDF_THEMES).map(theme => ({
  id: theme.id,
  name: theme.name,
  tagline: theme.tagline,
}))

export const getExportPdfTheme = (themeId = DEFAULT_EXPORT_PDF_THEME_ID) =>
  EXPORT_PDF_THEMES[themeId] ?? EXPORT_PDF_THEMES[DEFAULT_EXPORT_PDF_THEME_ID]
