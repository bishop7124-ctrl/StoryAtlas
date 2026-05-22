const serifStack = 'Georgia, "Times New Roman", serif'
const sansStack = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export const EXPORT_PDF_THEMES = {
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Codex',
    tagline: 'Premium fantasy encyclopedia',
    palette: {
      page: '#121211',
      pageAlt: '#191815',
      panel: '#211f1a',
      panelSoft: '#2a251c',
      text: '#f3ead4',
      muted: '#c4b692',
      faint: '#82745b',
      accent: '#d6ad54',
      accent2: '#8f6e35',
      border: '#6e5a34',
      shadow: 'rgba(0,0,0,.42)',
    },
    typography: {
      display: serifStack,
      body: serifStack,
      ui: sansStack,
    },
    cover: {
      overlay: 'linear-gradient(125deg, rgba(0,0,0,.25), rgba(214,173,84,.15) 48%, rgba(0,0,0,.7))',
      marker: 'CODEX',
    },
    texture:
      'radial-gradient(circle at 18% 12%, rgba(214,173,84,.13), transparent 25%), linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)',
  },
  royal: {
    id: 'royal',
    name: 'Royal Archive',
    tagline: 'Elegant historical manuscript',
    palette: {
      page: '#071426',
      pageAlt: '#0c1d35',
      panel: '#10243e',
      panelSoft: '#142d4b',
      text: '#edf3f7',
      muted: '#bac9d7',
      faint: '#7d8fa2',
      accent: '#c8d2dc',
      accent2: '#7d93a9',
      border: '#5e748c',
      shadow: 'rgba(0,0,0,.38)',
    },
    typography: {
      display: serifStack,
      body: serifStack,
      ui: sansStack,
    },
    cover: {
      overlay: 'linear-gradient(130deg, rgba(3,12,28,.25), rgba(200,210,220,.14) 50%, rgba(0,0,0,.64))',
      marker: 'ARCHIVE',
    },
    texture:
      'radial-gradient(circle at 80% 20%, rgba(200,210,220,.12), transparent 27%), linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)',
  },
  verdant: {
    id: 'verdant',
    name: 'Verdant Chronicle',
    tagline: 'Ancient druidic world lore',
    palette: {
      page: '#102018',
      pageAlt: '#15291e',
      panel: '#1b3024',
      panelSoft: '#243b2b',
      text: '#ecf0df',
      muted: '#bdc8a0',
      faint: '#798665',
      accent: '#b88a4d',
      accent2: '#6f8b55',
      border: '#6e774a',
      shadow: 'rgba(0,0,0,.36)',
    },
    typography: {
      display: serifStack,
      body: serifStack,
      ui: sansStack,
    },
    cover: {
      overlay: 'linear-gradient(135deg, rgba(4,18,10,.18), rgba(184,138,77,.16) 45%, rgba(0,0,0,.65))',
      marker: 'CHRONICLE',
    },
    texture:
      'radial-gradient(circle at 25% 25%, rgba(111,139,85,.2), transparent 24%), radial-gradient(circle at 78% 72%, rgba(184,138,77,.12), transparent 24%), linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px)',
  },
  ivory: {
    id: 'ivory',
    name: 'Ivory Manuscript',
    tagline: 'Clean printed encyclopedia',
    palette: {
      page: '#f3ead8',
      pageAlt: '#fbf6ea',
      panel: '#fffaf0',
      panelSoft: '#efe2ca',
      text: '#231d17',
      muted: '#6d5c48',
      faint: '#9f8b6e',
      accent: '#7b5330',
      accent2: '#b38b55',
      border: '#c9b38e',
      shadow: 'rgba(91,66,39,.2)',
    },
    typography: {
      display: serifStack,
      body: serifStack,
      ui: sansStack,
    },
    cover: {
      overlay: 'linear-gradient(130deg, rgba(255,250,240,.35), rgba(179,139,85,.2) 52%, rgba(92,65,35,.18))',
      marker: 'MANUSCRIPT',
    },
    texture:
      'radial-gradient(circle at 15% 18%, rgba(123,83,48,.11), transparent 24%), linear-gradient(rgba(80,55,30,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(80,55,30,.025) 1px, transparent 1px)',
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Empire',
    tagline: 'Political and war chronicle',
    palette: {
      page: '#0d0b0d',
      pageAlt: '#170d10',
      panel: '#211015',
      panelSoft: '#2b1219',
      text: '#f4e7df',
      muted: '#d0aaa2',
      faint: '#926f6b',
      accent: '#c03842',
      accent2: '#7e1e2b',
      border: '#6f2b31',
      shadow: 'rgba(0,0,0,.46)',
    },
    typography: {
      display: serifStack,
      body: serifStack,
      ui: sansStack,
    },
    cover: {
      overlay: 'linear-gradient(130deg, rgba(0,0,0,.22), rgba(192,56,66,.18) 48%, rgba(0,0,0,.72))',
      marker: 'EMPIRE',
    },
    texture:
      'radial-gradient(circle at 80% 18%, rgba(192,56,66,.18), transparent 24%), linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.014) 1px, transparent 1px)',
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

