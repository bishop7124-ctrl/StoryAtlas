import { useEffect, useRef, useState, useCallback } from 'react'
import { loadMapPixels, saveMapPixels, deleteMapPixels } from '../../store/mapStorage'

const MAP_W = 2560
const MAP_H = 1920
const LEGACY_MAP_W = 640
const LEGACY_MAP_H = 480
const LEGACY2_MAP_W = 1280
const LEGACY2_MAP_H = 960
const LEGACY3_MAP_W = 1920
const LEGACY3_MAP_H = 1440
const MAX_UNDO = 15

// Pixel type -> render blend
const OVERLAY_TYPES = {
  1: { name: 'Rock',      color: [104, 103,  99], alpha: 0.54 },
  2: { name: 'Sand',      color: [224, 185, 118], alpha: 0.46 },
  3: { name: 'Grassland', color: [ 83, 132,  61], alpha: 0.40 },
  4: { name: 'Farmland',  color: [154, 137,  76], alpha: 0.46 },
  5: { name: 'Swampland', color: [101, 115,  61], alpha: 0.54 },
  6: { name: 'Wall',     color: [ 35,  35,  35], alpha: 0.92 },
  7: { name: 'Path',     color: [139, 103,  67], alpha: 0.88 },
  8: { name: 'Room',     color: [232, 221, 191], alpha: 0.85 },
}

const YOW_REGION = {
  fill: '#d6b45f',
  stroke: '#f6d986',
}

const YOW_PIN = {
  shell: '#f6d986',
  core: '#d6b45f',
}

const STAMP_TYPES = {
  // World map stamps
  mountain:   { label: 'Mountain',    glyph: '△', color: '#686763', stroke: '#2a241c', category: 'world' },
  town:       { label: 'Town',        glyph: '⌂', color: '#d6b45f', stroke: '#3a2f20', category: 'world' },
  city:       { label: 'City',        glyph: '▦', color: '#c79b5d', stroke: '#312719', category: 'world' },
  forest:     { label: 'Forest',      glyph: '♠', color: '#244b2f', stroke: '#162a1c', category: 'world' },
  ruins:      { label: 'Ruins',       glyph: '◫', color: '#8a867b', stroke: '#2f2d29', category: 'world' },
  port:       { label: 'Port',        glyph: '⚓', color: '#5e9fbd', stroke: '#183241', category: 'world' },
  // Town / city building stamps
  house:      { label: 'House',       glyph: '⌂', color: '#c8a06e', stroke: '#5a3a20', category: 'town' },
  shop:       { label: 'Shop',        glyph: '◈', color: '#d4aa6a', stroke: '#5a3a10', category: 'town' },
  inn:        { label: 'Inn',         glyph: '◩', color: '#d4956f', stroke: '#5a3020', category: 'town' },
  tavern:     { label: 'Tavern',      glyph: '⌾', color: '#c07a40', stroke: '#5a2a10', category: 'town' },
  blacksmith: { label: 'Blacksmith',  glyph: '⚒', color: '#8a8a8a', stroke: '#2a2a2a', category: 'town' },
  temple:     { label: 'Temple',      glyph: '☩', color: '#d6c080', stroke: '#3a2a10', category: 'town' },
  market:     { label: 'Market',      glyph: '⊞', color: '#d4c56a', stroke: '#5a4820', category: 'town' },
  well:       { label: 'Well',        glyph: '◎', color: '#6aadcd', stroke: '#1a4060', category: 'town' },
  gate:       { label: 'Gate',        glyph: '⊓', color: '#888878', stroke: '#2a2a1a', category: 'town' },
  watchtower: { label: 'Watchtower',  glyph: '⊤', color: '#9a9080', stroke: '#2a2520', category: 'town' },
  stable:     { label: 'Stable',      glyph: '⊡', color: '#b08060', stroke: '#4a2a10', category: 'town' },
  fountain:   { label: 'Fountain',    glyph: '❖', color: '#6aadcd', stroke: '#1a4060', category: 'town' },
  // Interior / dungeon stamps
  door:       { label: 'Door',        glyph: '▯', color: '#c8a06e', stroke: '#5a3a20', category: 'interior' },
  stairs:     { label: 'Stairs',      glyph: '≡', color: '#aaa090', stroke: '#3a3a2a', category: 'interior' },
  pillar:     { label: 'Pillar',      glyph: '◉', color: '#c0b090', stroke: '#4a4030', category: 'interior' },
  shrine:     { label: 'Shrine',      glyph: '✦', color: '#d6b45f', stroke: '#3a2a10', category: 'interior' },
  chest:      { label: 'Chest',       glyph: '⊟', color: '#c8a06e', stroke: '#5a3a20', category: 'interior' },
  fireplace:  { label: 'Fireplace',   glyph: '♨', color: '#e06030', stroke: '#5a1800', category: 'interior' },
  pit:        { label: 'Pit',         glyph: '⊖', color: '#2a2a2a', stroke: '#0a0a0a', category: 'interior' },
  table:      { label: 'Table',       glyph: '▬', color: '#b08060', stroke: '#4a2a10', category: 'interior' },
}

const WORLD_STAMPS    = ['mountain','town','city','forest','ruins','port']
const TOWN_STAMPS     = ['house','shop','inn','tavern','blacksmith','temple','market','well','gate','watchtower','stable','fountain']
const INTERIOR_STAMPS = ['door','stairs','pillar','shrine','chest','fireplace','pit','table']

const DEFAULT_GENERATION_SETTINGS = {
  seed: '',
  landScale: 1,
  continentCount: 0,
  islandDensity: 0.45,
  mountainIntensity: 0.75,
  coastRoughness: 0.65,
  erosion: 0.32,
}

const GENERATION_PRESETS = [
  {
    id: 'continents',
    label: 'Continents',
    settings: { landScale: 1, continentCount: 0, islandDensity: 0.35, coastRoughness: 0.65, mountainIntensity: 0.75, erosion: 0.32 },
  },
  {
    id: 'archipelago',
    label: 'Archipelago',
    settings: { landScale: 0.72, continentCount: 5, islandDensity: 1, coastRoughness: 1.05, mountainIntensity: 0.45, erosion: 0.22 },
  },
  {
    id: 'rugged',
    label: 'Rugged',
    settings: { landScale: 1.08, continentCount: 0, islandDensity: 0.42, coastRoughness: 0.95, mountainIntensity: 1.25, erosion: 0.12 },
  },
  {
    id: 'broadlands',
    label: 'Broadlands',
    settings: { landScale: 1.28, continentCount: 2, islandDensity: 0.16, coastRoughness: 0.35, mountainIntensity: 0.55, erosion: 0.52 },
  },
]

const DEFAULT_OCEAN_HEIGHT = 0.10

function mix(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function blend(from, to, t) {
  return [mix(from[0], to[0], t), mix(from[1], to[1], t), mix(from[2], to[2], t)]
}

function heightToColor(h) {
  if (h < 0.10) return blend([18,  52,  86],  [47,  111, 143], h / 0.10)                // abyssal → deep ocean
  if (h < 0.22) return blend([47,  111, 143], [92,  155, 178], (h - 0.10) / 0.12)       // deep → continental shelf
  if (h < 0.33) return blend([92,  155, 178], [199, 155,  93], (h - 0.22) / 0.11)       // shelf → beach
  if (h < 0.38) return blend([199, 155,  93], [224, 185, 118], (h - 0.33) / 0.05)       // beach → pale shoreline
  if (h < 0.50) return blend([224, 185, 118], [24,   62,  34], (h - 0.38) / 0.12)       // shoreline → dark green
  if (h < 0.72) return blend([24,   62,  34], [132, 168,  89], (h - 0.50) / 0.22)       // dark green → light green (gradual)
  if (h < 0.85) return blend([132, 168,  89], [120,  85,  48], (h - 0.72) / 0.13)       // light green → brown
  return blend([120, 85, 48], [188, 188, 182], Math.min(1, (h - 0.85) / 0.15))          // brown → light grey (peak)
}

function noise2d(x, y, seed) {
  const X = Math.floor(x), Y = Math.floor(y)
  const fx = x - X, fy = y - Y
  const h00 = fhash(X, Y, seed), h10 = fhash(X+1, Y, seed)
  const h01 = fhash(X, Y+1, seed), h11 = fhash(X+1, Y+1, seed)
  const ux = fx*fx*(3-2*fx), uy = fy*fy*(3-2*fy)
  return h00 + (h10-h00)*ux + (h01-h00)*uy + (h00-h10-h01+h11)*ux*uy
}
function fhash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 100) | 0
  h = (h ^ (h >>> 13)) * 1274126177 | 0
  return ((h ^ (h >>> 16)) & 0x7fffffff) / 0x7fffffff
}

const WALL_BRICK_COLORS = [
  { id: 'red',    label: 'Red',    base: [165, 60, 45],   mortar: [200, 190, 180] },
  { id: 'brown',  label: 'Brown',  base: [115, 72, 45],   mortar: [190, 180, 165] },
  { id: 'tan',    label: 'Tan',    base: [190, 158, 115],  mortar: [215, 208, 195] },
  { id: 'grey',   label: 'Grey',   base: [130, 126, 122],  mortar: [200, 196, 192] },
  { id: 'black',  label: 'Black',  base: [45, 40, 36],    mortar: [85, 80, 75] },
]

function renderBrickPixel(px, py, baseR, baseG, baseB, mortarR, mortarG, mortarB) {
  const BRICK_W = 12, BRICK_H = 7, MORTAR = 2, MORTAR_H = 1
  const row = Math.floor(py / BRICK_H)
  const offsetX = (row % 2) * Math.floor(BRICK_W / 2)
  const bx = (px + offsetX) % BRICK_W
  const by = py % BRICK_H
  if (bx < MORTAR || by < MORTAR_H) {
    return [mortarR, mortarG, mortarB]
  }
  const variation = fhash(Math.floor((px + offsetX) / BRICK_W), Math.floor(py / BRICK_H), 77)
  const v = 1 + (variation - 0.5) * 0.18
  return [
    Math.min(255, Math.max(0, Math.round(baseR * v))),
    Math.min(255, Math.max(0, Math.round(baseG * v))),
    Math.min(255, Math.max(0, Math.round(baseB * v))),
  ]
}

function createHeightmap() {
  const hm = new Float32Array(MAP_W * MAP_H)
  hm.fill(DEFAULT_OCEAN_HEIGHT)
  return hm
}
function createOverlay()      { return new Uint8Array(MAP_W * MAP_H) }
function createColorOverlay() { return new Uint8Array(MAP_W * MAP_H * 4) }

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0]
}

function resizePixels(src, oldW, oldH, createDest) {
  const dest = createDest()
  for (let y = 0; y < MAP_H; y++) {
    const sy = Math.min(oldH - 1, Math.floor(y * oldH / MAP_H))
    for (let x = 0; x < MAP_W; x++) {
      const sx = Math.min(oldW - 1, Math.floor(x * oldW / MAP_W))
      dest[y * MAP_W + x] = src[sy * oldW + sx]
    }
  }
  return dest
}

function normalizeMapPixels(hmSource, ovSource) {
  let hm = hmSource ? new Float32Array(hmSource) : createHeightmap()
  let ov = ovSource ? new Uint8Array(ovSource) : createOverlay()
  let scale = 1

  if (hm.length === LEGACY_MAP_W * LEGACY_MAP_H) {
    hm = resizePixels(hm, LEGACY_MAP_W, LEGACY_MAP_H, createHeightmap)
    ov = ov.length === LEGACY_MAP_W * LEGACY_MAP_H
      ? resizePixels(ov, LEGACY_MAP_W, LEGACY_MAP_H, createOverlay)
      : createOverlay()
    scale = MAP_W / LEGACY_MAP_W
  } else if (hm.length === LEGACY3_MAP_W * LEGACY3_MAP_H) {
    hm = resizePixels(hm, LEGACY3_MAP_W, LEGACY3_MAP_H, createHeightmap)
    ov = ov.length === LEGACY3_MAP_W * LEGACY3_MAP_H
      ? resizePixels(ov, LEGACY3_MAP_W, LEGACY3_MAP_H, createOverlay)
      : createOverlay()
    scale = MAP_W / LEGACY3_MAP_W
  } else if (hm.length === LEGACY2_MAP_W * LEGACY2_MAP_H) {
    hm = resizePixels(hm, LEGACY2_MAP_W, LEGACY2_MAP_H, createHeightmap)
    ov = ov.length === LEGACY2_MAP_W * LEGACY2_MAP_H
      ? resizePixels(ov, LEGACY2_MAP_W, LEGACY2_MAP_H, createOverlay)
      : createOverlay()
    scale = MAP_W / LEGACY2_MAP_W
  } else if (hm.length !== MAP_W * MAP_H) {
    hm = createHeightmap()
    ov = createOverlay()
  } else if (ov.length !== MAP_W * MAP_H) {
    ov = createOverlay()
  }

  return { hm, ov, scale }
}

function setMapPreset(hm, type, seed) {
  const s = seed || Math.random() * 9999
  switch (type) {
    case 'world':
      hm.fill(DEFAULT_OCEAN_HEIGHT)
      break
    case 'town':
    case 'city':    hm.fill(0.52); break
    case 'interior':
    case 'dungeon': hm.fill(0.88); break
    case 'underwater': hm.fill(DEFAULT_OCEAN_HEIGHT); break
    case 'other': hm.fill(DEFAULT_OCEAN_HEIGHT); break
    default: // region / regional
      hm.fill(DEFAULT_OCEAN_HEIGHT)
      addNoiseLandmass(hm, 0.5, 0.5, MAP_W * 0.42, MAP_H * 0.42, 0.88, s)
      addMountainRange(hm, 0.3, 0.2, 0.7, 0.5, s)
  }
}

function clearMapHeight(hm, type) {
  switch (type) {
    case 'world':
    case 'underwater':
    case 'other':
    case 'region':
    case 'regional':
      hm.fill(DEFAULT_OCEAN_HEIGHT)
      break
    case 'interior':
    case 'dungeon':
      hm.fill(0.88)
      break
    case 'town':
    case 'city':
      hm.fill(0.52)
      break
    default:
      hm.fill(0.46)
  }
}

function addNoiseLandmass(hm, cx, cy, rx, ry, maxH, seed) {
  // Warp amplitude scales with landmass size so small islands stay on-screen
  const rNorm = rx / MAP_W          // landmass radius as fraction of map
  const a1 = rNorm * 0.55           // large bays / peninsulas
  const a2 = rNorm * 0.22           // medium inlets
  const a3 = rNorm * 0.08           // fine jagged edge

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const nx = x / MAP_W
      const ny = y / MAP_H

      // Pass 1 — large coastal features
      const wx1 = (noise2d(nx * 2.2,       ny * 2.2,       seed + 10) * 2 - 1) * a1
      const wy1 = (noise2d(nx * 2.2 + 5.3, ny * 2.2 + 2.9, seed + 11) * 2 - 1) * a1

      // Pass 2 — medium inlets, iterated from pass-1 warped coords
      const wx2 = (noise2d((nx + wx1) * 6,       (ny + wy1) * 6,       seed + 20) * 2 - 1) * a2
      const wy2 = (noise2d((nx + wx1) * 6 + 4.1, (ny + wy1) * 6 + 3.7, seed + 21) * 2 - 1) * a2

      // Pass 3 — fine edge detail, fixed frequency regardless of size
      const wx3 = (noise2d(nx * 18,       ny * 18,       seed + 30) * 2 - 1) * a3
      const wy3 = (noise2d(nx * 18 + 6.8, ny * 18 + 3.2, seed + 31) * 2 - 1) * a3

      const dx = (nx + wx1 + wx2 + wx3 - cx) / (rx / MAP_W)
      const dy = (ny + wy1 + wy2 + wy3 - cy) / (ry / MAP_H)
      const d  = Math.sqrt(dx * dx + dy * dy)

      if (d < 1.0) {
        const n = noise2d(x / 55, y / 55, seed)     * 0.10
                + noise2d(x / 22, y / 22, seed + 5) * 0.05
                + noise2d(x / 10, y / 10, seed + 6) * 0.02
        const v = maxH * (1 - d * d) + n
        hm[y * MAP_W + x] = Math.max(hm[y * MAP_W + x], Math.min(1, v))
      }
    }
  }
}

function addMountainRange(hm, x1, y1, x2, y2) {
  const steps = 80
  for (let s = 0; s < steps; s++) {
    const t = s / steps
    const cx = Math.round((x1 + (x2-x1)*t) * MAP_W)
    const cy = Math.round((y1 + (y2-y1)*t) * MAP_H)
    if (cx < 0 || cx >= MAP_W || cy < 0 || cy >= MAP_H) continue
    const br = 10 + Math.random() * 8
    paintBrush(hm, cx, cy, br, 0.10, 'raise')
  }
}

// Per-pixel cloud warp: smooth multi-scale noise → soft cloud-blob shaped edges
function cloudWarp(px, py, bs) {
  const f = 1 / Math.max(12, bs)
  const n1 = (noise2d(px * f * 1.2 + 0.3,  py * f * 0.95 + 0.7, 17) * 2 - 1)
  const n2 = (noise2d(px * f * 0.45 + 0.1,  py * f * 0.40 + 0.5, 53) * 2 - 1)
  const n3 = (noise2d(px * f * 0.18,         py * f * 0.15 + 0.3, 91) * 2 - 1)
  return (n1 * 0.10 + n2 * 0.22 + n3 * 0.32) * bs
}

function paintBrush(hm, cx, cy, bs, str, tool) {
  const warpMax = bs * 0.45
  const outer = Math.ceil(bs + warpMax)
  const flattenTarget = tool === 'flatten' ? hm[Math.max(0, Math.min(MAP_H - 1, cy)) * MAP_W + Math.max(0, Math.min(MAP_W - 1, cx))] : 0.52
  const smoothPad = 3
  const smoothBounds = tool === 'smooth'
    ? {
        x1: Math.max(0, cx - outer - smoothPad),
        y1: Math.max(0, cy - outer - smoothPad),
        x2: Math.min(MAP_W - 1, cx + outer + smoothPad),
        y2: Math.min(MAP_H - 1, cy + outer + smoothPad),
      }
    : null
  const smoothW = smoothBounds ? smoothBounds.x2 - smoothBounds.x1 + 1 : 0
  const smoothSource = smoothBounds ? new Float32Array(smoothW * (smoothBounds.y2 - smoothBounds.y1 + 1)) : null
  if (smoothBounds) {
    for (let sy = smoothBounds.y1; sy <= smoothBounds.y2; sy++) {
      const srcStart = sy * MAP_W + smoothBounds.x1
      smoothSource.set(hm.subarray(srcStart, srcStart + smoothW), (sy - smoothBounds.y1) * smoothW)
    }
  }
  const smoothValueAt = (x, y) => smoothSource[(y - smoothBounds.y1) * smoothW + (x - smoothBounds.x1)]

  for (let dy = -outer; dy <= outer; dy++) {
    for (let dx = -outer; dx <= outer; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > outer) continue

      const x = cx + dx, y = cy + dy
      if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) continue

      // Cloud-like splotchy edge: warp the effective radius per pixel
      const warp = cloudWarp(x, y, bs)
      const r = Math.max(1, bs + warp)
      if (dist > r) continue

      const idx = y * MAP_W + x
      const falloff = Math.max(0, 1 - dist / r)
      const amount  = str * falloff

      switch (tool) {
        case 'raise': {
          // Smooth multi-scale noise → cloud-like mottled color blobs
          const m1 = noise2d(x * 0.050, y * 0.050, 41)
          const m2 = noise2d(x * 0.022, y * 0.022, 71)
          const m3 = noise2d(x * 0.010, y * 0.010, 113)
          const mottle = m1 * 0.35 + m2 * 0.35 + m3 * 0.30
          const mottleScaled = mottle * 0.55 + 0.45
          hm[idx] = Math.min(1, hm[idx] + amount * mottleScaled * (1 - hm[idx]) * 2.5)
          break
        }
        case 'lower':   hm[idx] = Math.max(0, hm[idx] - amount * hm[idx] * 2.5); break
        case 'water': {
          const target = 0.13 + (0.35 - 0.13) * (1 - falloff)
          if (hm[idx] > target) hm[idx] = target
          break
        }
        case 'flatten': hm[idx] += (flattenTarget - hm[idx]) * amount * 2; break
        case 'smooth': {
          let sum = 0, count = 0
          for (let sy = -3; sy <= 3; sy++) {
            for (let sx = -3; sx <= 3; sx++) {
              const nx = x + sx, ny = y + sy
              if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H) { sum += smoothValueAt(nx, ny); count++ }
            }
          }
          hm[idx] += (sum / count - hm[idx]) * Math.min(1, amount * 5)
          break
        }
      }
    }
  }
}

const TEXTURE_TOOLS = new Set(['rock', 'sand', 'grassland', 'farmland', 'swampland'])

function textureRgba(toolName, x, y) {
  switch (toolName) {
    case 'grassland': {
      const n = fhash(x * 3, y * 3, 42) * 0.55 + fhash(x * 8, y * 11, 71) * 0.30 + fhash(x * 19, y * 17, 113) * 0.15
      return [Math.round((0.28 + n * 0.14) * 255), Math.round((0.50 + n * 0.28) * 255), Math.round((0.20 + n * 0.10) * 255), 195]
    }
    case 'sand': {
      const n = fhash(x * 5, y, 13) * 0.45 + fhash(x * 2, y * 5, 97) * 0.30 + fhash(x * 11, y * 7, 53) * 0.25
      return [Math.round((0.84 + n * 0.14) * 255), Math.round((0.68 + n * 0.14) * 255), Math.round((0.40 + n * 0.10) * 255), 195]
    }
    case 'rock': {
      const n = fhash(x * 2, y * 2, 31) * 0.35 + fhash(x * 9, y * 7, 59) * 0.40 + fhash(x * 21, y * 17, 83) * 0.25
      const v = 0.33 + n * 0.32
      return [Math.round(v * 255), Math.round((v - 0.01) * 255), Math.round((v - 0.04) * 255), 200]
    }
    case 'farmland': {
      const row = Math.sin(y * 0.45 + x * 0.025) * 0.5 + 0.5
      const n   = fhash(x, y, 55) * 0.20
      return [Math.round(clamp01(0.55 + row * 0.14 + n) * 255), Math.round(clamp01(0.50 + row * 0.14 + n) * 255), Math.round(clamp01(0.24 + row * 0.06 + n) * 255), 195]
    }
    case 'swampland': {
      const n = fhash(x * 2, y * 2, 23) * 0.45 + fhash(x * 6, y * 5, 89) * 0.35 + fhash(x * 14, y * 11, 137) * 0.20
      return [Math.round(clamp01(0.30 + n * 0.08) * 255), Math.round(clamp01(0.38 + n * 0.12) * 255), Math.round(clamp01(0.18 + n * 0.06) * 255), 210]
    }
    default: return null
  }
}

function paintOverlay(ov, cx, cy, bs, value, colorOv, customColor, hm, toolName, brickColorId) {
  const isTexture = TEXTURE_TOOLS.has(toolName)
  const rgb = (customColor && colorOv) ? hexToRgb(customColor) : null
  const warpMax = bs * 0.38
  const outer = Math.ceil(bs + warpMax)
  for (let dy = -outer; dy <= outer; dy++) {
    for (let dx = -outer; dx <= outer; dx++) {
      if (Math.sqrt(dx*dx + dy*dy) > outer) continue
      const x = cx + dx, y = cy + dy
      if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) continue
      const warp = cloudWarp(x, y, bs)
      const r = Math.max(1, bs + warp)
      if (Math.sqrt(dx*dx + dy*dy) > r) continue
      const idx = y * MAP_W + x
      // Texture brushes only apply to land, never water
      if (isTexture && hm && hm[idx] < 0.36) continue
      if (toolName === 'wall') {
        const brickDef = WALL_BRICK_COLORS.find(c => c.id === brickColorId) || WALL_BRICK_COLORS[0]
        ov[idx] = 6
        if (colorOv) {
          colorOv[idx * 4]     = brickDef.base[0]
          colorOv[idx * 4 + 1] = brickDef.base[1]
          colorOv[idx * 4 + 2] = brickDef.base[2]
          colorOv[idx * 4 + 3] = 254  // 254 = wall marker
        }
      } else if (rgb) {
        ov[idx] = 9
        colorOv[idx * 4]     = rgb[0]
        colorOv[idx * 4 + 1] = rgb[1]
        colorOv[idx * 4 + 2] = rgb[2]
        colorOv[idx * 4 + 3] = 230
      } else if (isTexture && colorOv) {
        const tex = textureRgba(toolName, x, y)
        if (tex) {
          ov[idx] = 9
          colorOv[idx * 4]     = tex[0]
          colorOv[idx * 4 + 1] = tex[1]
          colorOv[idx * 4 + 2] = tex[2]
          colorOv[idx * 4 + 3] = tex[3]
        }
      } else {
        ov[idx] = value
        if (colorOv && value === 0) colorOv[idx * 4 + 3] = 0
      }
    }
  }
}

function clamp01(v) { return Math.max(0, Math.min(1, v)) }
function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}
function seeded(seed, salt) {
  return fhash(Math.floor(seed + salt * 101), Math.floor(seed * 0.37 + salt * 977), seed + salt)
}
function fbm(x, y, seed, octaves = 5) {
  let total = 0
  let amplitude = 0.5
  let frequency = 1
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    total += (noise2d(x * frequency, y * frequency, seed + i * 31) * 2 - 1) * amplitude
    norm += amplitude
    amplitude *= 0.52
    frequency *= 2.08
  }
  return total / norm
}
// Ridged multifractal: returns sharp ridgelines (near 1) with broad valleys (near 0)
function ridgedFbm(x, y, seed, octaves = 5) {
  let total = 0, amplitude = 0.5, frequency = 1, norm = 0
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(noise2d(x * frequency, y * frequency, seed + i * 31) * 2 - 1)
    total += n * n * amplitude
    norm += amplitude
    amplitude *= 0.5
    frequency *= 2.12
  }
  return total / norm
}
function distanceToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay
  const wx = px - ax, wy = py - ay
  const lenSq = vx * vx + vy * vy || 1
  const t = clamp01((wx * vx + wy * vy) / lenSq)
  const dx = px - (ax + vx * t)
  const dy = py - (ay + vy * t)
  return Math.sqrt(dx * dx + dy * dy)
}

function drawStampIndicator(ctx, stamp) {
  const stampType = STAMP_TYPES[stamp.stampType] || STAMP_TYPES.mountain
  const size = stamp.size || 44
  const half = size / 2
  const px = stamp.mapX
  const py = stamp.mapY

  ctx.save()
  ctx.translate(px, py)
  ctx.globalAlpha = stamp.opacity ?? 0.95
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.strokeStyle = stampType.stroke
  ctx.fillStyle = stampType.color
  ctx.lineWidth = Math.max(2, size * 0.08)

  if (stamp.stampType === 'mountain') {
    ctx.beginPath()
    ctx.moveTo(0, -half)
    ctx.lineTo(-half * 0.78, half * 0.72)
    ctx.lineTo(half * 0.82, half * 0.72)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#eee6d6'
    ctx.beginPath()
    ctx.moveTo(0, -half)
    ctx.lineTo(-half * 0.20, -half * 0.18)
    ctx.lineTo(half * 0.22, -half * 0.16)
    ctx.closePath()
    ctx.fill()
  } else if (stamp.stampType === 'town' || stamp.stampType === 'city') {
    const count = stamp.stampType === 'city' ? 5 : 3
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * (size * 0.18)
      const h = size * (0.42 + (i % 2) * 0.18)
      ctx.fillRect(x - size * 0.07, half * 0.55 - h, size * 0.14, h)
      ctx.strokeRect(x - size * 0.07, half * 0.55 - h, size * 0.14, h)
    }
  } else if (stamp.stampType === 'house') {
    ctx.beginPath(); ctx.moveTo(0, -half * 0.48); ctx.lineTo(-half * 0.56, half * 0.02); ctx.lineTo(half * 0.56, half * 0.02); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.fillRect(-half * 0.38, half * 0.02, half * 0.76, half * 0.58); ctx.strokeRect(-half * 0.38, half * 0.02, half * 0.76, half * 0.58)
    ctx.fillStyle = stampType.stroke; ctx.fillRect(-half * 0.14, half * 0.25, half * 0.28, half * 0.35)
  } else if (stamp.stampType === 'temple') {
    ctx.beginPath(); ctx.moveTo(0, -half * 0.58); ctx.lineTo(-half * 0.72, -half * 0.1); ctx.lineTo(half * 0.72, -half * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke()
    for (let i = 0; i < 3; i++) { const cx2 = -half * 0.48 + i * half * 0.48; ctx.fillRect(cx2 - half * 0.09, -half * 0.1, half * 0.18, half * 0.7); ctx.strokeRect(cx2 - half * 0.09, -half * 0.1, half * 0.18, half * 0.7) }
    ctx.fillRect(-half * 0.72, half * 0.58, half * 1.44, half * 0.1); ctx.strokeRect(-half * 0.72, half * 0.58, half * 1.44, half * 0.1)
  } else if (stamp.stampType === 'well') {
    ctx.beginPath(); ctx.arc(0, half * 0.12, half * 0.52, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(-half * 0.52, -half * 0.18); ctx.lineTo(half * 0.52, -half * 0.18); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(-half * 0.52, half * 0.12); ctx.lineTo(-half * 0.52, -half * 0.42); ctx.moveTo(half * 0.52, half * 0.12); ctx.lineTo(half * 0.52, -half * 0.42); ctx.stroke()
  } else if (stamp.stampType === 'gate') {
    const pw = half * 0.18, ph = half * 0.75, gap = half * 0.38
    ctx.fillRect(-gap - pw, -ph + half * 0.5, pw * 2, ph); ctx.strokeRect(-gap - pw, -ph + half * 0.5, pw * 2, ph)
    ctx.fillRect(gap - pw, -ph + half * 0.5, pw * 2, ph); ctx.strokeRect(gap - pw, -ph + half * 0.5, pw * 2, ph)
    ctx.beginPath(); ctx.arc(0, -ph + half * 0.5 + gap * 0.72, gap + pw * 0.8, Math.PI, 0); ctx.stroke()
  } else if (stamp.stampType === 'watchtower') {
    const tw = half * 0.36
    ctx.fillRect(-tw, -half * 0.25, tw * 2, half * 0.95); ctx.strokeRect(-tw, -half * 0.25, tw * 2, half * 0.95)
    const cw = tw * 0.55, ch = half * 0.22
    for (let i = 0; i < 3; i++) { const cx2 = -tw + i * tw - cw / 2; ctx.fillRect(cx2, -half * 0.25 - ch, cw, ch); ctx.strokeRect(cx2, -half * 0.25 - ch, cw, ch) }
  } else if (stamp.stampType === 'fountain') {
    ctx.beginPath(); ctx.arc(0, 0, half * 0.72, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#9acfe8'; ctx.beginPath(); ctx.arc(0, 0, half * 0.48, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    ctx.fillStyle = stampType.color; ctx.beginPath(); ctx.arc(0, 0, half * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  } else if (stamp.stampType === 'door') {
    ctx.fillRect(-half * 0.3, -half * 0.62, half * 0.6, half * 1.08); ctx.strokeRect(-half * 0.3, -half * 0.62, half * 0.6, half * 1.08)
    ctx.beginPath(); ctx.arc(0, -half * 0.62, half * 0.3, Math.PI, 0); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#d6b45f'; ctx.beginPath(); ctx.arc(half * 0.18, 0, half * 0.08, 0, Math.PI * 2); ctx.fill()
  } else if (stamp.stampType === 'stairs') {
    const steps = 4, sh = (half * 0.9) / steps
    for (let i = 0; i < steps; i++) { const w = half * (0.8 - i * 0.12); ctx.fillRect(-w, -half * 0.45 + i * sh, w * 2, sh); ctx.strokeRect(-w, -half * 0.45 + i * sh, w * 2, sh) }
  } else if (stamp.stampType === 'pillar') {
    ctx.fillRect(-half * 0.42, half * 0.48, half * 0.84, half * 0.22); ctx.strokeRect(-half * 0.42, half * 0.48, half * 0.84, half * 0.22)
    ctx.fillRect(-half * 0.27, -half * 0.48, half * 0.54, half * 0.96); ctx.strokeRect(-half * 0.27, -half * 0.48, half * 0.54, half * 0.96)
    ctx.fillRect(-half * 0.42, -half * 0.62, half * 0.84, half * 0.2); ctx.strokeRect(-half * 0.42, -half * 0.62, half * 0.84, half * 0.2)
  } else if (stamp.stampType === 'chest') {
    ctx.fillRect(-half * 0.52, -half * 0.1, half * 1.04, half * 0.6); ctx.strokeRect(-half * 0.52, -half * 0.1, half * 1.04, half * 0.6)
    ctx.beginPath(); ctx.ellipse(0, -half * 0.1, half * 0.52, half * 0.28, 0, Math.PI, 0); ctx.fill(); ctx.stroke()
    ctx.fillStyle = '#d6b45f'; ctx.beginPath(); ctx.arc(0, -half * 0.04, half * 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(0, 0, half * 0.78, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#fff4d0'
    ctx.font = `bold ${Math.round(size * 0.58)}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(stampType.glyph, 0, 1)
  }

  ctx.restore()
}

function randomGenerate(hm, mapType, seed, options = {}) {
  const settings = { ...DEFAULT_GENERATION_SETTINGS, ...options }
  const s = seed || Math.random() * 99999
  hm.fill(mapType === 'underwater' ? 0.08 : DEFAULT_OCEAN_HEIGHT)
  if (mapType !== 'world' && mapType !== 'regional' && mapType !== 'region') {
    clearMapHeight(hm, mapType)
    return
  }

  const isWorld = mapType === 'world'
  const continentCount = settings.continentCount || (isWorld ? 4 : 2)
  const landScale = settings.landScale
  const coastRoughness = settings.coastRoughness
  const islandDensity = settings.islandDensity
  const mountainIntensity = settings.mountainIntensity
  const erosion = settings.erosion
  const continents = Array.from({ length: continentCount }, (_, i) => {
    const angle = seeded(s, i + 1) * Math.PI * 2
    const centerRadius = isWorld ? 0.30 * seeded(s, i + 2) : 0.12 * seeded(s, i + 2)
    const cx = (isWorld ? 0.5 : 0.48) + Math.cos(angle) * centerRadius
    const cy = (isWorld ? 0.5 : 0.52) + Math.sin(angle) * centerRadius * 0.72
    return {
      cx,
      cy,
      rx: ((isWorld ? 0.17 : 0.38) + seeded(s, i + 3) * (isWorld ? 0.13 : 0.16)) * landScale,
      ry: ((isWorld ? 0.13 : 0.30) + seeded(s, i + 4) * (isWorld ? 0.12 : 0.15)) * landScale,
      rot: (seeded(s, i + 5) - 0.5) * Math.PI,
    }
  })
  const ranges = Array.from({ length: Math.max(1, Math.round((isWorld ? 5 : 3) * mountainIntensity)) }, (_, i) => {
    const c = continents[i % continents.length]
    const angle = c.rot + (seeded(s, i + 20) - 0.5) * 1.1
    const len = (isWorld ? 0.22 : 0.36) + seeded(s, i + 21) * 0.22
    const ox = Math.cos(angle) * len * 0.5
    const oy = Math.sin(angle) * len * 0.5
    const side = seeded(s, i + 22) - 0.5
    return {
      ax: c.cx - ox - Math.sin(angle) * side * 0.12,
      ay: c.cy - oy + Math.cos(angle) * side * 0.12,
      bx: c.cx + ox - Math.sin(angle) * side * 0.12,
      by: c.cy + oy + Math.cos(angle) * side * 0.12,
      width: (0.020 + seeded(s, i + 23) * 0.035) * (0.85 + mountainIntensity * 0.35),
      height: (0.20 + seeded(s, i + 24) * 0.24) * mountainIntensity,
    }
  })

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const nx = x / MAP_W
      const ny = y / MAP_H
      const wx = fbm(nx * 1.6 + 17.1, ny * 1.6, s + 100, 4) * 0.10 * coastRoughness + fbm(nx * 5.5, ny * 5.5, s + 101, 3) * 0.025 * coastRoughness
      const wy = fbm(nx * 1.6, ny * 1.6 + 11.8, s + 102, 4) * 0.10 * coastRoughness + fbm(nx * 5.5 + 3.3, ny * 5.5, s + 103, 3) * 0.025 * coastRoughness
      const px = nx + wx
      const py = ny + wy

      let landField = -1
      for (const c of continents) {
        const cos = Math.cos(c.rot), sin = Math.sin(c.rot)
        const dx = px - c.cx, dy = py - c.cy
        const ex = (dx * cos + dy * sin) / c.rx
        const ey = (-dx * sin + dy * cos) / c.ry
        const d = Math.sqrt(ex * ex + ey * ey)
        const coastNoise = fbm(px * 9.0 + c.cx * 17, py * 9.0 + c.cy * 17, s + 140, 5) * 0.23 * coastRoughness
        const broadNoise = fbm(px * 2.4, py * 2.4, s + 150, 4) * 0.12 * coastRoughness
        landField = Math.max(landField, 1 - d + coastNoise + broadNoise)
      }

      const islandNoise = fbm(px * 6.5 + 30, py * 6.5 - 10, s + 180, 5)
      const land = smoothstep(-0.08, 0.14, landField) + smoothstep(0.50, 0.72, islandNoise) * (isWorld ? 0.28 : 0.12) * islandDensity
      const coastalShelf = smoothstep(-0.22, 0.08, landField)
      let height = 0.10 + coastalShelf * 0.20 + land * 0.23
      height += fbm(px * 3.2, py * 3.2, s + 200, 5) * 0.060 * land
      height += fbm(px * 14, py * 14, s + 210, 4) * 0.025 * land

      for (const r of ranges) {
        const d = distanceToSegment(px, py, r.ax, r.ay, r.bx, r.by)
        const ridgeFalloff = Math.max(0, 1 - d / r.width)
        if (ridgeFalloff <= 0) continue
        const slope = ridgeFalloff * ridgeFalloff
        // Foothills: smooth dome. Crest: sharp ridged peaks via ridged FBM.
        const ridgeDetail = ridgedFbm(px * 11 + r.ax * 9, py * 11 + r.ay * 9, s + 260, 5)
        const foothills = slope * 0.42
        const peaks = slope * slope * ridgeDetail * 0.58
        height += (foothills + peaks) * r.height * land
      }

      // Continental interior sits higher than coasts — low-frequency bulge on strongly-land pixels
      const continentalRise = fbm(px * 1.1 + 7.3, py * 1.1 + 2.9, s + 330, 3) * 0.055 * land * land

      const rainShadow = fbm(px * 1.8 + 9, py * 1.8 - 4, s + 280, 3) * 0.035 * land
      hm[y * MAP_W + x] = clamp01(height + continentalRise + rainShadow)
    }
  }

  // Thermal erosion: material slides off slopes steeper than the talus angle,
  // carving valleys and smoothing plains while preserving sharp ridgelines.
  const passes = Math.round(2 + erosion * 5)
  const talus = 0.016
  for (let pass = 0; pass < passes; pass++) {
    const src = new Float32Array(hm)
    for (let y = 1; y < MAP_H - 1; y++) {
      for (let x = 1; x < MAP_W - 1; x++) {
        const idx = y * MAP_W + x
        const h = src[idx]
        if (h < 0.32 || h > 0.95) continue
        const offsets = [-1, 1, -MAP_W, MAP_W]
        const diffs = offsets.map(o => Math.max(0, h - src[idx + o] - talus))
        const totalDiff = diffs[0] + diffs[1] + diffs[2] + diffs[3]
        if (totalDiff === 0) continue
        const erode = Math.min(h - 0.32, totalDiff * 0.10 * erosion)
        hm[idx] -= erode
        for (let i = 0; i < 4; i++) {
          if (diffs[i] > 0) hm[idx + offsets[i]] += erode * (diffs[i] / totalDiff)
        }
      }
    }
  }

  // Final smoothing pass: soften flat interior plains only
  const copy = new Float32Array(hm)
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      const idx = y * MAP_W + x
      const h = copy[idx]
      if (h < 0.38 || h > 0.68) continue
      const avg = (copy[idx-1] + copy[idx+1] + copy[idx-MAP_W] + copy[idx+MAP_W]) / 4
      hm[idx] = h * (1 - erosion * 0.4) + avg * erosion * 0.4
    }
  }
}

const REGION_COLORS = ['#d6b45f','#f6d986','#5e9fbd','#8b6743','#47763c','#244b2f','#c79b5d','#dce8ec','#686763','#4c5f38']

const MAP_TYPE_LABELS = {
  world:    '🌍 World',
  region:   '🗺️ Region',
  regional: '🗺️ Region',
  town:     '🏙️ Town / City',
  city:     '🏙️ Town / City',
  interior: '🏰 Interior',
  dungeon:  '🏰 Interior',
  other:    '⬜ Other',
  underwater: '🌊 Underwater',
}

const NEW_MAP_TYPES = [
  { id: 'world',    label: 'World',       icon: '🌍', desc: 'Continents, oceans and global terrain' },
]

const TERRAIN_LAYER_ID = 'terrain'
const DEFAULT_OBJECT_LAYER_ID = 'layer-1'

function defaultMapLayers() {
  return [
    { id: TERRAIN_LAYER_ID, name: 'Terrain', visible: true, locked: true },
    { id: DEFAULT_OBJECT_LAYER_ID, name: 'Layer 1', visible: true },
  ]
}

function normaliseMapLayers(map) {
  const raw = Array.isArray(map?.mapLayers) ? map.mapLayers : []
  const terrain = { id: TERRAIN_LAYER_ID, name: 'Terrain', visible: true, locked: true }
  const objectLayers = raw
    .filter(layer => layer?.id && layer.id !== TERRAIN_LAYER_ID)
    .map((layer, index) => ({
      id: layer.id,
      name: layer.name || `Layer ${index + 1}`,
      visible: layer.visible !== false,
      locked: false,
    }))
  return [terrain, ...(objectLayers.length ? objectLayers : defaultMapLayers().slice(1))]
}

function objectLayerId(item) {
  return item?.layerId || DEFAULT_OBJECT_LAYER_ID
}

function objectOrder(item, fallback = 0) {
  return Number.isFinite(item?.objectOrder) ? item.objectOrder : fallback
}

function clampMapPoint(point) {
  return {
    x: Math.max(0, Math.min(MAP_W - 1, point.x)),
    y: Math.max(0, Math.min(MAP_H - 1, point.y)),
  }
}

export default function MapBuilder({ store }) {
  const {
    mapProject: project,
    updateMapProject: updateProject,
    addLocation,
    deleteLocation,
    addMap,
    selectMap,
    deleteMap,
    renameMap,
    updateActiveMapData,
  } = store
  const activeMap = project?.maps?.find(m => m.id === project?.activeMapId)
  const atlasLocationName = useCallback((locationId, fallback) => {
    return project?.locations?.find(loc => loc.id === locationId)?.name || fallback
  }, [project?.locations])
  const canvasRef  = useRef(null)
  const viewportRef = useRef(null)
  const hmRef      = useRef(createHeightmap())
  const ovRef      = useRef(createOverlay())
  const colorOvRef = useRef(null)
  const bgImageRef = useRef(null)
  const undoStack  = useRef([])
  const paintingRef = useRef(false)
  const lastStrokePosRef = useRef(null)
  const panDragRef = useRef(null)
  const touchPointersRef = useRef(new Map())
  const touchGestureRef = useRef(null)
  const panRef = useRef({ x: 0, y: 0 })
  const zoomRef = useRef(0.75)
  const regionDragRef = useRef(null)
  const pathWaypointsRef = useRef([])
  const draggingStampRef = useRef(null)
  const draggingPinRef = useRef(null)
  const draggingObjectRef = useRef(null)
  const resizingObjectRef = useRef(null)
  const objectDraftRef = useRef(null)
  const roomDraftRef = useRef(null)
  const selectedStampIdRef = useRef(null)
  const selectedObjectRef = useRef(null)
  // Refs so renderMap always reads current values regardless of closure age
  const pathModeRef        = useRef('freehand')
  const toolRef            = useRef('raise')
  const brushSizeRef       = useRef(18)
  const brushStrRef        = useRef(0.04)
  const brushCustomColorRef = useRef(null)
  const cursorPosRef       = useRef(null)
  const lastPaintTimeRef   = useRef(0)
  const paintLoopRef       = useRef(null)
  const renderFrameRef     = useRef(null)
  const mapLayersRef       = useRef(defaultMapLayers())
  const wallBrickColorRef  = useRef('red')

  const [tool, setTool]           = useState('raise')
  const [brushSize, setBrushSize] = useState(18)
  const [brushStr, setBrushStr]   = useState(0.04)
  const [zoom, setZoom]           = useState(0.75)
  const [pan, setPan]             = useState({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [pinModal, setPinModal]   = useState(null)
  const [regionModal, setRegionModal] = useState(null)
  const [regionDraft, setRegionDraft] = useState(null)
  const [labelModal, setLabelModal] = useState(null)
  const [selectedStamp, setSelectedStamp] = useState('mountain')
  const [generateModal, setGenerateModal] = useState(false)
  const [generationSettings, setGenerationSettings] = useState(() => {
    try { return { ...DEFAULT_GENERATION_SETTINGS, ...JSON.parse(localStorage.getItem('nf_map_generation_settings') || '{}') } }
    catch { return DEFAULT_GENERATION_SETTINGS }
  })
  const [newMapModal, setNewMapModal] = useState(false)
  const [renamingId, setRenamingId] = useState(null)
  const [renameVal, setRenameVal]   = useState('')
  const [brushCustomColor, setBrushCustomColor] = useState(null)
  const [pathMode, setPathMode] = useState('freehand')
  const [pathWaypoints, setPathWaypoints] = useState([])
  const [stampSize, setStampSize] = useState(28)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [selectedStampId, setSelectedStampId] = useState(null)
  const [mode, setMode] = useState('edit')
  const [hoveredPreview, setHoveredPreview] = useState(null)
  const [pinnedPreview, setPinnedPreview] = useState(null)
  const [activeLayerId, setActiveLayerId] = useState(DEFAULT_OBJECT_LAYER_ID)
  const [selectedObject, setSelectedObject] = useState(null)
  const [wallBrickColor, setWallBrickColor] = useState('red')
  const [downloadMenu, setDownloadMenu] = useState(false)
  const [roomDraft, setRoomDraft] = useState(null)
  const [isMobileView, setIsMobileView] = useState(false)

  // Grid overlay (tabletop projects only)
  const [gridVisible, setGridVisible] = useState(false)
  const [gridSize, setGridSize]       = useState(32)
  const [gridOpacity, setGridOpacity] = useState(0.3)

  const mapType   = 'world'
  const isSmallMap = mapType === 'city' || mapType === 'dungeon' || mapType === 'town' || mapType === 'interior'
  const isImported = !!activeMap?.imported
  const isTabletop = project?.type === 'tabletop' || project?.type === 'dnd'
  const effectiveViewMode = mode === 'view' || isMobileView
  const mapLayers = normaliseMapLayers(activeMap)
  const activeLayer = mapLayers.find(layer => layer.id === activeLayerId) || mapLayers.find(layer => !layer.locked) || mapLayers[0]
  const activeObjectLayerId = activeLayer?.locked ? DEFAULT_OBJECT_LAYER_ID : activeLayer?.id || DEFAULT_OBJECT_LAYER_ID

  // Track current mapId for async save callbacks
  const activeMapIdRef = useRef(project?.activeMapId)
  useEffect(() => { activeMapIdRef.current = project?.activeMapId }, [project?.activeMapId])
  useEffect(() => { panRef.current = pan }, [pan])
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { pathModeRef.current = pathMode }, [pathMode])
  useEffect(() => { toolRef.current = tool; brushSizeRef.current = brushSize; brushStrRef.current = brushStr; brushCustomColorRef.current = brushCustomColor }, [tool, brushSize, brushStr, brushCustomColor])
  useEffect(() => { selectedStampIdRef.current = selectedStampId }, [selectedStampId])
  useEffect(() => { selectedObjectRef.current = selectedObject }, [selectedObject])
  useEffect(() => { mapLayersRef.current = mapLayers; setTimeout(renderMap, 0) }, [activeMap?.mapLayers])
  useEffect(() => { wallBrickColorRef.current = wallBrickColor }, [wallBrickColor])
  useEffect(() => {
    if (!activeMap) return
    if (!Array.isArray(activeMap.mapLayers) || activeMap.mapLayers.length === 0) {
      updateActiveMapData(() => ({ mapLayers: defaultMapLayers() }))
      return
    }
  }, [activeMap?.id, activeMap?.mapLayers, activeLayerId])
  useEffect(() => {
    const query = window.matchMedia('(max-width: 860px), (pointer: coarse)')
    const sync = () => setIsMobileView(query.matches)
    sync()
    query.addEventListener?.('change', sync)
    return () => query.removeEventListener?.('change', sync)
  }, [])

  // Keyboard delete for the selected map object.
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedObject) {
        const target = document.activeElement
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return
        deleteSelectedObject()
        setTimeout(renderMap, 0)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedObject])

  // Eagerly migrate any pixel data still in localStorage → IndexedDB, then clear it
  useEffect(() => {
    if (!project) return
    const dirtyMaps = (project.maps || []).filter(m => m.mapData)
    const hasLegacyData = !!project.mapData

    if (!dirtyMaps.length && !hasLegacyData) return

    Promise.all(dirtyMaps.map(m => {
      const { hm, ov } = normalizeMapPixels(m.mapData, m.mapOverlay)
      return saveMapPixels(m.id, hm, ov)
    })).then(() => {
      updateProject(p => ({
        maps: p.maps.map(m => m.mapData ? { ...m, mapData: null, mapOverlay: null } : m),
        // Clear legacy top-level pixel fields
        mapData: null,
        mapOverlay: null,
      }))
    })
  }, [project?.id])

  useEffect(() => {
    if (!project) return

    // Migrate legacy single-map projects into the maps array
    if ((!project.maps || project.maps.length === 0) && (project.mapData || (project.mapType && project.mapType !== null))) {
      const id = Date.now().toString(36)
      const normalized = project.mapData
        ? normalizeMapPixels(project.mapData, project.mapOverlay)
        : (() => { const h = createHeightmap(); setMapPreset(h, project.mapType || 'regional', 42); return { hm: h, ov: createOverlay(), scale: 1 } })()
      saveMapPixels(id, normalized.hm, normalized.ov)
      updateProject(() => ({
        maps: [{
          id,
          name: 'Map 1',
          mapType: project.mapType || 'regional',
          mapData: null,
          mapOverlay: null,
          mapPins: (project.mapPins || []).map(pin => ({ ...pin, mapX: pin.mapX * normalized.scale, mapY: pin.mapY * normalized.scale })),
          mapLabels: (project.mapLabels || []).map(label => ({ ...label, mapX: label.mapX * normalized.scale, mapY: label.mapY * normalized.scale })),
          mapStamps: (project.mapStamps || []).map(stamp => ({ ...stamp, mapX: stamp.mapX * normalized.scale, mapY: stamp.mapY * normalized.scale })),
          mapRegions: project.mapRegions || [],
          mapLayers: defaultMapLayers(),
          created: Date.now(),
        }],
        activeMapId: id,
        mapData: null,
        mapOverlay: null,
      }))
      return
    }

    if (!project.maps || project.maps.length === 0) {
      handleCreateMap('Map 1', 'world')
      return
    }

    // Ensure activeMapId is valid
    const maps = project.maps
    const validId = maps.find(m => m.id === project.activeMapId) ? project.activeMapId : maps[0]?.id
    if (validId !== project.activeMapId) {
      updateProject(() => ({ activeMapId: validId }))
      return
    }

    const map = maps.find(m => m.id === project.activeMapId)
    if (!map) return

    // Migrate pixel data that was previously stored in the Zustand/localStorage store
    if (map.mapData) {
      const { hm, ov, scale } = normalizeMapPixels(map.mapData, map.mapOverlay)
      saveMapPixels(map.id, hm, ov).then(() => {
        updateProject(p => ({
          maps: (p.maps || []).map(m => m.id === map.id ? {
            ...m,
            mapData: null,
            mapOverlay: null,
            mapPins: scale === 1 ? (m.mapPins || []) : (m.mapPins || []).map(pin => ({ ...pin, mapX: pin.mapX * scale, mapY: pin.mapY * scale })),
            mapLabels: scale === 1 ? (m.mapLabels || []) : (m.mapLabels || []).map(label => ({ ...label, mapX: label.mapX * scale, mapY: label.mapY * scale })),
            mapStamps: scale === 1 ? (m.mapStamps || []) : (m.mapStamps || []).map(stamp => ({ ...stamp, mapX: stamp.mapX * scale, mapY: stamp.mapY * scale })),
          } : m),
        }))
      })
      hmRef.current = hm
      ovRef.current = ov
      renderMap()
      fitMapToViewport()
      return
    }

    // Load pixel data from IndexedDB
    loadMapPixels(map.id).then(data => {
      if (data) {
        const { hm, ov, scale } = normalizeMapPixels(data.hm, data.ov)
        hmRef.current = hm
        ovRef.current = ov
        colorOvRef.current = data.colorOv ? new Uint8Array(data.colorOv) : null
        if (scale !== 1) {
          saveMapPixels(map.id, hm, ov, colorOvRef.current)
          updateActiveMapData(m => ({
            mapPins: (m.mapPins || []).map(pin => ({ ...pin, mapX: pin.mapX * scale, mapY: pin.mapY * scale })),
            mapLabels: (m.mapLabels || []).map(label => ({ ...label, mapX: label.mapX * scale, mapY: label.mapY * scale })),
            mapStamps: (m.mapStamps || []).map(stamp => ({ ...stamp, mapX: stamp.mapX * scale, mapY: stamp.mapY * scale })),
          }))
        }
      } else {
        hmRef.current = createHeightmap()
        setMapPreset(hmRef.current, map.mapType || 'regional', 42)
        ovRef.current = createOverlay()
        colorOvRef.current = null
      }
      renderMap()
      fitMapToViewport()
    })
  }, [project?.id, project?.activeMapId])

  useEffect(() => { renderMap() }, [activeMap?.mapPins, activeMap?.mapRegions, activeMap?.mapLabels, activeMap?.mapStamps, project?.locations])
  useEffect(() => { renderMap() }, [gridVisible, gridSize, gridOpacity])

  useEffect(() => {
    bgImageRef.current = null
    if (!activeMap?.backgroundImage) return
    const img = new Image()
    img.onload = () => { bgImageRef.current = img; renderMap() }
    img.src = activeMap.backgroundImage
  }, [activeMap?.backgroundImage])
  useEffect(() => {
    const onResize = () => fitMapToViewport()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  useEffect(() => {
    setTimeout(fitMapToViewport, 0)
  }, [isFullscreen, project?.activeMapId])

  function fitMapToViewport() {
    const viewport = viewportRef.current
    if (!viewport) return
    const rect = viewport.getBoundingClientRect()
    const padding = isFullscreen ? 64 : 44
    const nextZoom = Math.max(0.18, Math.min(2, Math.min((rect.width - padding) / MAP_W, (rect.height - padding) / MAP_H)))
    setZoom(nextZoom)
    setPan({
      x: Math.round((rect.width - MAP_W * nextZoom) / 2),
      y: Math.round((rect.height - MAP_H * nextZoom) / 2),
    })
  }

  function resetView() {
    setZoom(1)
    const viewport = viewportRef.current
    if (!viewport) {
      setPan({ x: 0, y: 0 })
      return
    }
    const rect = viewport.getBoundingClientRect()
    setPan({
      x: Math.round((rect.width - MAP_W) / 2),
      y: Math.round((rect.height - MAP_H) / 2),
    })
  }

  const zoomAt = useCallback((clientX, clientY, factor) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const rect = viewport.getBoundingClientRect()
    const mx = clientX - rect.left
    const my = clientY - rect.top

    setZoom(prevZoom => {
      const nextZoom = Math.max(0.2, Math.min(4, prevZoom * factor))
      const mapX = (mx - pan.x) / prevZoom
      const mapY = (my - pan.y) / prevZoom
      setPan({
        x: mx - mapX * nextZoom,
        y: my - mapY * nextZoom,
      })
      return nextZoom
    })
  }, [pan])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 0.9 : 1.1)
  }, [zoomAt])

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  function renderMap() {
    if (renderFrameRef.current) {
      cancelAnimationFrame(renderFrameRef.current)
      renderFrameRef.current = null
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const hm = hmRef.current
    const ov = ovRef.current
    canvas.width  = MAP_W
    canvas.height = MAP_H
    const ctx = canvas.getContext('2d')

    // Build pixel data: heightmap + overlay blend (or background image for imported maps)
    const colorOv = colorOvRef.current
    if (activeMap?.backgroundImage && bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, 0, 0, MAP_W, MAP_H)
      const imgData = ctx.getImageData(0, 0, MAP_W, MAP_H)
      for (let i = 0; i < MAP_W * MAP_H; i++) {
        const ovType = ov[i]
        if (ovType === 9 && colorOv && colorOv[i * 4 + 3] > 0) {
          const alpha = colorOv[i * 4 + 3] / 255
          imgData.data[i*4]   = Math.round(imgData.data[i*4]   * (1 - alpha) + colorOv[i*4]   * alpha)
          imgData.data[i*4+1] = Math.round(imgData.data[i*4+1] * (1 - alpha) + colorOv[i*4+1] * alpha)
          imgData.data[i*4+2] = Math.round(imgData.data[i*4+2] * (1 - alpha) + colorOv[i*4+2] * alpha)
        } else if (ovType === 6) {
          let baseR = 45, baseG = 42, baseB = 40
          let mortarR = 90, mortarG = 87, mortarB = 84
          if (colorOv && colorOv[i * 4 + 3] === 254) {
            baseR = colorOv[i * 4]; baseG = colorOv[i * 4 + 1]; baseB = colorOv[i * 4 + 2]
            const brickDef = WALL_BRICK_COLORS.find(c => c.base[0] === baseR && c.base[1] === baseG && c.base[2] === baseB)
            if (brickDef) { mortarR = brickDef.mortar[0]; mortarG = brickDef.mortar[1]; mortarB = brickDef.mortar[2] }
            else { mortarR = Math.min(255, baseR + 50); mortarG = Math.min(255, baseG + 50); mortarB = Math.min(255, baseB + 50) }
          }
          const px = i % MAP_W, py = Math.floor(i / MAP_W)
          const [br, bg, bb] = renderBrickPixel(px, py, baseR, baseG, baseB, mortarR, mortarG, mortarB)
          imgData.data[i*4]   = br
          imgData.data[i*4+1] = bg
          imgData.data[i*4+2] = bb
        } else if (ovType > 0 && OVERLAY_TYPES[ovType]) {
          const { color, alpha } = OVERLAY_TYPES[ovType]
          imgData.data[i*4]   = Math.round(imgData.data[i*4]   * (1 - alpha) + color[0] * alpha)
          imgData.data[i*4+1] = Math.round(imgData.data[i*4+1] * (1 - alpha) + color[1] * alpha)
          imgData.data[i*4+2] = Math.round(imgData.data[i*4+2] * (1 - alpha) + color[2] * alpha)
        }
      }
      ctx.putImageData(imgData, 0, 0)
    } else {
      if (activeMap?.backgroundImage) {
        ctx.fillStyle = '#e8e0cc'
        ctx.fillRect(0, 0, MAP_W, MAP_H)
      }
      const imgData = ctx.createImageData(MAP_W, MAP_H)
      for (let i = 0; i < MAP_W * MAP_H; i++) {
        let [r, g, b] = heightToColor(hm[i])
        const ovType = ov[i]
        if (ovType === 9 && colorOv && colorOv[i * 4 + 3] > 0) {
          const alpha = colorOv[i * 4 + 3] / 255
          r = Math.round(r * (1 - alpha) + colorOv[i*4]   * alpha)
          g = Math.round(g * (1 - alpha) + colorOv[i*4+1] * alpha)
          b = Math.round(b * (1 - alpha) + colorOv[i*4+2] * alpha)
        } else if (ovType === 6) {
          // Wall with brick texture
          let baseR = 45, baseG = 42, baseB = 40
          let mortarR = 90, mortarG = 87, mortarB = 84
          if (colorOv && colorOv[i * 4 + 3] === 254) {
            baseR = colorOv[i * 4]; baseG = colorOv[i * 4 + 1]; baseB = colorOv[i * 4 + 2]
            const brickDef = WALL_BRICK_COLORS.find(c => c.base[0] === baseR && c.base[1] === baseG && c.base[2] === baseB)
            if (brickDef) { mortarR = brickDef.mortar[0]; mortarG = brickDef.mortar[1]; mortarB = brickDef.mortar[2] }
            else { mortarR = Math.min(255, baseR + 50); mortarG = Math.min(255, baseG + 50); mortarB = Math.min(255, baseB + 50) }
          }
          const px = i % MAP_W, py = Math.floor(i / MAP_W)
          ;[r, g, b] = renderBrickPixel(px, py, baseR, baseG, baseB, mortarR, mortarG, mortarB)
        } else if (ovType > 0 && OVERLAY_TYPES[ovType]) {
          const { color, alpha } = OVERLAY_TYPES[ovType]
          r = Math.round(r * (1 - alpha) + color[0] * alpha)
          g = Math.round(g * (1 - alpha) + color[1] * alpha)
          b = Math.round(b * (1 - alpha) + color[2] * alpha)
        }
        imgData.data[i*4]   = Math.min(255, Math.max(0, r))
        imgData.data[i*4+1] = Math.min(255, Math.max(0, g))
        imgData.data[i*4+2] = Math.min(255, Math.max(0, b))
        imgData.data[i*4+3] = 255
      }
      ctx.putImageData(imgData, 0, 0)
    }

    const currentSelection = selectedObjectRef.current
    function drawRegion(reg) {
      ctx.save()
      ctx.beginPath()
      let labelX, labelY
      if (reg.points && reg.points.length >= 3) {
        reg.points.forEach((p, i) => i ? ctx.lineTo(p.x * MAP_W, p.y * MAP_H) : ctx.moveTo(p.x * MAP_W, p.y * MAP_H))
        ctx.closePath()
        const sumX = reg.points.reduce((s, p) => s + p.x, 0)
        const sumY = reg.points.reduce((s, p) => s + p.y, 0)
        labelX = (sumX / reg.points.length) * MAP_W
        labelY = (sumY / reg.points.length) * MAP_H
      } else {
        ctx.ellipse(reg.cx * MAP_W, reg.cy * MAP_H, reg.rx * MAP_W, reg.ry * MAP_H, 0, 0, Math.PI * 2)
        labelX = reg.cx * MAP_W
        labelY = reg.cy * MAP_H
      }
      const hex = reg.color || YOW_REGION.stroke
      ctx.fillStyle = reg.fill || `${hex}2a`
      ctx.fill()
      ctx.strokeStyle = hex
      ctx.lineWidth = 5
      ctx.setLineDash([12, 8])
      ctx.stroke()
      if (currentSelection?.type === 'region' && currentSelection.id === reg.id) {
        ctx.strokeStyle = 'rgba(255, 200, 60, 0.95)'
        ctx.lineWidth = 3
        ctx.setLineDash([5, 5])
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.font = 'bold 22px -apple-system, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      const regionLabel = atlasLocationName(reg.locationId, reg.name).slice(0, 18)
      ctx.fillText(regionLabel, labelX + 2, labelY + 2)
      ctx.fillStyle = hex
      ctx.fillText(regionLabel, labelX, labelY)
      ctx.restore()
    }

    function drawPin(pin) {
      ctx.textBaseline = 'bottom'
      const px = pin.mapX, py = pin.mapY
      const pinSize = pin.size || 36
      ctx.beginPath()
      ctx.arc(px, py, pinSize * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(10, 15, 12, 0.72)'
      ctx.fill()
      ctx.strokeStyle = pin.color || YOW_PIN.shell
      ctx.lineWidth = 4
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(px, py, Math.max(5, pinSize * 0.2), 0, Math.PI * 2)
      ctx.fillStyle = pin.coreColor || YOW_PIN.core
      ctx.fill()
      if (currentSelection?.type === 'pin' && currentSelection.id === pin.id) {
        ctx.beginPath()
        ctx.arc(px, py, pinSize * 0.7, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 200, 60, 0.95)'
        ctx.lineWidth = 2.5
        ctx.setLineDash([6, 4])
        ctx.stroke()
        ctx.setLineDash([])
      }
      const label = atlasLocationName(pin.locationId, pin.name).slice(0, 18)
      ctx.font = 'bold 22px -apple-system, Arial, sans-serif'
      const tw = ctx.measureText(label).width
      ctx.fillStyle = 'rgba(10, 15, 12, 0.72)'
      ctx.fillRect(px - tw/2 - 8, py - 49, tw + 16, 30)
      ctx.fillStyle = '#f6d986'
      ctx.textAlign = 'center'
      ctx.fillText(label, px, py - 23)
      ctx.textAlign = 'left'
    }

    function drawLabel(label) {
      const px = label.mapX, py = label.mapY
      const size = label.size || 28
      ctx.save()
      ctx.font = `bold ${size}px Georgia, serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = Math.max(3, size * 0.16)
      ctx.strokeStyle = label.outline || 'rgba(12, 12, 10, 0.78)'
      ctx.fillStyle = label.color || '#f6e3b1'
      ctx.strokeText(label.text, px, py)
      ctx.fillText(label.text, px, py)
      if (currentSelection?.type === 'label' && currentSelection.id === label.id) {
        const w = Math.max(50, ctx.measureText(label.text).width + 18)
        ctx.strokeStyle = 'rgba(255, 200, 60, 0.95)'
        ctx.lineWidth = 2
        ctx.setLineDash([5, 4])
        ctx.strokeRect(px - w / 2, py - size * 0.75, w, size * 1.5)
        ctx.setLineDash([])
      }
      ctx.restore()
    }

    function drawStamp(stamp) {
      const selStampId = selectedStampIdRef.current
      drawStampIndicator(ctx, stamp)
      if (stamp.id === selStampId) {
        const sz = (stamp.size || 44) / 2 + 10
        ctx.save()
        ctx.strokeStyle = 'rgba(255, 200, 60, 0.9)'
        ctx.lineWidth = 2.5
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.arc(stamp.mapX, stamp.mapY, sz, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }
    }

    mapLayersRef.current.filter(layer => !layer.locked && layer.visible !== false).forEach(layer => {
      mapObjectsForLayer(layer.id).forEach(({ type, item }) => {
        if (type === 'region') drawRegion(item)
        else if (type === 'pin') drawPin(item)
        else if (type === 'label') drawLabel(item)
        else if (type === 'stamp') drawStamp(item)
      })
    })

    // Points-mode path preview — drawn with actual brush appearance
    const previewPts = pathWaypointsRef.current
    if (previewPts.length >= 2 && pathModeRef.current === 'points') {
      const t = toolRef.current
      const bs = brushSizeRef.current
      const cc = brushCustomColorRef.current
      const ovVal = OVERLAY_TOOL_MAP[t]
      let [pr, pg, pb] = [180, 140, 80]
      if (cc) { [pr, pg, pb] = hexToRgb(cc) }
      else if (ovVal > 0 && OVERLAY_TYPES[ovVal]) { [pr, pg, pb] = OVERLAY_TYPES[ovVal].color }
      ctx.save()
      ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.78)`
      ctx.lineWidth = bs * 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      previewPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
      ctx.stroke()
      // Waypoint dots
      previewPts.forEach((p, i) => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(4, bs * 0.55), 0, Math.PI * 2)
        ctx.fillStyle = i === 0 ? 'rgba(255,255,255,0.9)' : `rgba(${pr},${pg},${pb},0.9)`
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'
        ctx.lineWidth = 1.5
        ctx.fill()
        ctx.stroke()
      })
      // Close-shape ring around first point when 3+ waypoints placed
      if (previewPts.length >= 3) {
        const threshold = Math.max(18, bs)
        ctx.beginPath()
        ctx.arc(previewPts[0].x, previewPts[0].y, threshold, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([5, 4])
        ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.restore()
    }

    // Tabletop grid overlay
    if (gridVisible) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${gridOpacity})`
      ctx.lineWidth = 1.5
      for (let x = 0; x <= MAP_W; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MAP_H); ctx.stroke()
      }
      for (let y = 0; y <= MAP_H; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MAP_W, y); ctx.stroke()
      }
    }

    const sel = selectedObjectRef.current
    if (sel && !effectiveViewMode) {
      const item = findMapObject(sel.type, sel.id)
      const bounds = item ? objectBounds(sel.type, item) : null
      if (bounds) {
        ctx.save()
        ctx.strokeStyle = 'rgba(255, 200, 60, 0.98)'
        ctx.lineWidth = 3
        ctx.setLineDash([10, 7])
        ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top)
        ctx.setLineDash([])
        ctx.fillStyle = '#f6d986'
        ctx.strokeStyle = 'rgba(10, 15, 12, 0.92)'
        ctx.lineWidth = 3
        const hs = Math.max(14, 18 / zoomRef.current)
        ctx.fillRect(bounds.right - hs / 2, bounds.bottom - hs / 2, hs, hs)
        ctx.strokeRect(bounds.right - hs / 2, bounds.bottom - hs / 2, hs, hs)
        ctx.restore()
      }
    }
  }

  function requestRenderMap() {
    if (renderFrameRef.current) return
    renderFrameRef.current = requestAnimationFrame(() => {
      renderFrameRef.current = null
      renderMap()
    })
  }

  function pushUndo() {
    undoStack.current.push({
      hm: new Float32Array(hmRef.current),
      ov: new Uint8Array(ovRef.current),
      colorOv: colorOvRef.current ? new Uint8Array(colorOvRef.current) : null,
    })
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift()
  }

  function undo() {
    if (!undoStack.current.length) return
    const { hm, ov, colorOv } = undoStack.current.pop()
    hmRef.current = hm
    ovRef.current = ov
    colorOvRef.current = colorOv
    renderMap()
    throttledSave()
  }

  const throttledSave = useCallback(() => {
    clearTimeout(throttledSave._t)
    throttledSave._t = setTimeout(() => {
      const mapId = activeMapIdRef.current
      if (mapId) saveMapPixels(mapId, hmRef.current, ovRef.current, colorOvRef.current)
    }, 800)
  }, [])

  function canvasPos(e) {
    const c = canvasRef.current
    const r = c.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(MAP_W - 1, Math.round((e.clientX - r.left) * MAP_W / r.width))),
      y: Math.max(0, Math.min(MAP_H - 1, Math.round((e.clientY - r.top)  * MAP_H / r.height))),
    }
  }

  function visibleObjectLayerIds() {
    return new Set(mapLayersRef.current.filter(layer => !layer.locked && layer.visible !== false).map(layer => layer.id))
  }

  function selectMapObject(type, id) {
    setSelectedObject({ type, id })
    setSelectedStampId(type === 'stamp' ? id : null)
  }

  function clearObjectSelection() {
    setSelectedObject(null)
    setSelectedStampId(null)
    objectDraftRef.current = null
  }

  function deleteSelectedObject() {
    const sel = selectedObjectRef.current
    if (!sel) return
    updateActiveMapData(m => ({
      mapPins: sel.type === 'pin' ? (m.mapPins || []).filter(p => p.id !== sel.id) : m.mapPins,
      mapRegions: sel.type === 'region' ? (m.mapRegions || []).filter(r => r.id !== sel.id) : m.mapRegions,
      mapLabels: sel.type === 'label' ? (m.mapLabels || []).filter(l => l.id !== sel.id) : m.mapLabels,
      mapStamps: sel.type === 'stamp' ? (m.mapStamps || []).filter(s => s.id !== sel.id) : m.mapStamps,
    }))
    clearObjectSelection()
  }

  function deleteMapObject(type, id) {
    updateActiveMapData(m => ({
      mapPins: type === 'pin' ? (m.mapPins || []).filter(p => p.id !== id) : m.mapPins,
      mapRegions: type === 'region' ? (m.mapRegions || []).filter(r => r.id !== id) : m.mapRegions,
      mapLabels: type === 'label' ? (m.mapLabels || []).filter(l => l.id !== id) : m.mapLabels,
      mapStamps: type === 'stamp' ? (m.mapStamps || []).filter(s => s.id !== id) : m.mapStamps,
    }))
    if (selectedObjectRef.current?.type === type && selectedObjectRef.current?.id === id) clearObjectSelection()
    setTimeout(renderMap, 0)
  }

  function scaleRegion(region, factor) {
    if (region.points?.length) {
      const cx = region.points.reduce((sum, p) => sum + p.x, 0) / region.points.length
      const cy = region.points.reduce((sum, p) => sum + p.y, 0) / region.points.length
      return {
        ...region,
        points: region.points.map(p => ({
          x: Math.max(0, Math.min(1, cx + (p.x - cx) * factor)),
          y: Math.max(0, Math.min(1, cy + (p.y - cy) * factor)),
        })),
      }
    }
    return { ...region, rx: Math.max(0.01, Math.min(0.8, (region.rx || 0.08) * factor)), ry: Math.max(0.01, Math.min(0.8, (region.ry || 0.06) * factor)) }
  }

  function moveObjectItem(type, item, dx, dy) {
    if (type === 'pin' || type === 'label' || type === 'stamp') {
      return { ...item, ...clampMapPoint({ x: item.mapX + dx, y: item.mapY + dy }) }
    }
    if (type === 'region') {
      if (item.points?.length) {
        return { ...item, points: item.points.map(p => ({ x: Math.max(0, Math.min(1, p.x + dx / MAP_W)), y: Math.max(0, Math.min(1, p.y + dy / MAP_H)) })) }
      }
      return { ...item, cx: Math.max(0, Math.min(1, (item.cx || 0.5) + dx / MAP_W)), cy: Math.max(0, Math.min(1, (item.cy || 0.5) + dy / MAP_H)) }
    }
    return item
  }

  function applyObjectDraft(type, item) {
    const draft = objectDraftRef.current
    return draft?.type === type && draft?.id === item.id ? draft.item : item
  }

  function commitObjectDraft() {
    const draft = objectDraftRef.current
    if (!draft) return
    updateObjectInMap(draft.type, draft.id, () => draft.item)
    objectDraftRef.current = null
    setTimeout(renderMap, 0)
  }

  function pointInPolygon(pos, points) {
    let inside = false
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x * MAP_W, yi = points[i].y * MAP_H
      const xj = points[j].x * MAP_W, yj = points[j].y * MAP_H
      const intersect = ((yi > pos.y) !== (yj > pos.y)) && (pos.x < (xj - xi) * (pos.y - yi) / Math.max(0.0001, yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  function hitTestObject(pos, includeRegions = true) {
    const visibleLayers = visibleObjectLayerIds()
    const inVisibleLayer = item => visibleLayers.has(objectLayerId(item))
    const stamps = (activeMap?.mapStamps || []).filter(inVisibleLayer)
    for (let i = stamps.length - 1; i >= 0; i--) {
      const s = stamps[i]
      const sz = (s.size || 44) / 2 + 10
      if (Math.hypot(pos.x - s.mapX, pos.y - s.mapY) <= sz) return { type: 'stamp', item: s }
    }
    const labels = (activeMap?.mapLabels || []).filter(inVisibleLayer)
    for (let i = labels.length - 1; i >= 0; i--) {
      const l = labels[i]
      const size = l.size || 28
      const halfW = Math.max(36, String(l.text || '').length * size * 0.34)
      if (Math.abs(pos.x - l.mapX) <= halfW && Math.abs(pos.y - l.mapY) <= size * 0.75) return { type: 'label', item: l }
    }
    const pins = (activeMap?.mapPins || []).filter(inVisibleLayer)
    for (let i = pins.length - 1; i >= 0; i--) {
      const p = pins[i]
      if (Math.hypot(pos.x - p.mapX, pos.y - p.mapY) <= Math.max(24, (p.size || 36) * 0.75)) return { type: 'pin', item: p }
    }
    if (includeRegions) {
      const regions = (activeMap?.mapRegions || []).filter(inVisibleLayer)
      for (let i = regions.length - 1; i >= 0; i--) {
        const r = regions[i]
        if (r.points?.length >= 3 && pointInPolygon(pos, r.points)) return { type: 'region', item: r }
        if (!r.points) {
          const dx = (pos.x - (r.cx || 0) * MAP_W) / Math.max(1, (r.rx || 0.08) * MAP_W)
          const dy = (pos.y - (r.cy || 0) * MAP_H) / Math.max(1, (r.ry || 0.06) * MAP_H)
          if (dx * dx + dy * dy <= 1) return { type: 'region', item: r }
        }
      }
    }
    return null
  }


  // Overlay tool value: 0=erase, 1-5=terrain, 6-8=small map
  const OVERLAY_TOOL_MAP = {
    'rock': 1, 'sand': 2, 'grassland': 3, 'farmland': 4, 'swampland': 5,
    'wall': 6, 'path': 7, 'room': 8,
    'erase-texture': 0,
  }

  const isTerrainTool  = ['raise','lower','smooth','flatten','water'].includes(tool)
  const isOverlayTool  = tool in OVERLAY_TOOL_MAP
  const isPanTool = tool === 'pan'
  const selectTool = useCallback((nextTool) => {
    setTool(nextTool)
    if (['raise','lower','smooth','flatten','water','rock','sand','grassland','farmland','swampland','erase-texture'].includes(nextTool)) {
      setActiveLayerId(TERRAIN_LAYER_ID)
    } else if (['pin', 'region', 'label', 'stamp'].includes(nextTool) && activeLayerId === TERRAIN_LAYER_ID) {
      setActiveLayerId(mapLayers.find(layer => !layer.locked)?.id || DEFAULT_OBJECT_LAYER_ID)
    }
    if (nextTool === 'water') setBrushSize(size => Math.min(size, 8))
    if (tool === 'water' && nextTool !== 'water') setBrushSize(size => Math.max(size, 18))
    if (nextTool === 'stamp') {
      const defaults = { town: 'house', city: 'house', interior: 'door', dungeon: 'door' }
      setSelectedStamp(prev => {
        const wanted = defaults[mapType]
        if (!wanted) return prev
        const list = mapType === 'interior' || mapType === 'dungeon' ? INTERIOR_STAMPS : TOWN_STAMPS
        return list.includes(prev) ? prev : wanted
      })
    }
    if (pathWaypointsRef.current.length > 0) {
      pathWaypointsRef.current = []
      setPathWaypoints([])
    }
  }, [tool, mapType, activeLayerId, mapLayers])

  function startPaintLoop() {
    const SCULPT_SET = new Set(['raise','lower','smooth','flatten','water'])
    const OVERLAY_MAP_LOCAL = { 'rock': 1, 'sand': 2, 'grassland': 3, 'farmland': 4, 'swampland': 5, 'wall': 6, 'path': 7, 'room': 8, 'erase-texture': 0 }
    function loop() {
      if (!paintingRef.current) return
      const now = Date.now()
      if (now - lastPaintTimeRef.current >= 80) {
        const pos = cursorPosRef.current
        const t = toolRef.current
        if (pos) {
          if (SCULPT_SET.has(t)) {
            paintBrush(hmRef.current, pos.x, pos.y, brushSizeRef.current, brushStrRef.current, t)
            renderMap()
            throttledSave()
          } else if (t in OVERLAY_MAP_LOCAL && t !== 'room') {
            const needsColorOv = brushCustomColorRef.current || TEXTURE_TOOLS.has(t) || t === 'wall'
            if (needsColorOv && !colorOvRef.current) colorOvRef.current = createColorOverlay()
            paintOverlay(ovRef.current, pos.x, pos.y, brushSizeRef.current, OVERLAY_MAP_LOCAL[t], colorOvRef.current, brushCustomColorRef.current, hmRef.current, t, wallBrickColorRef.current)
            renderMap()
            throttledSave()
          }
          lastPaintTimeRef.current = now
        }
      }
      paintLoopRef.current = requestAnimationFrame(loop)
    }
    paintLoopRef.current = requestAnimationFrame(loop)
  }

  function handleMouseDown(e) {
    if (e.button === 1 || e.button === 2 || e.shiftKey || isPanTool) {
      e.preventDefault()
      panDragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
      return
    }
    if (e.button !== 0) return
    const pos = canvasPos(e)

    // View mode: only allow pin interaction
    if (effectiveViewMode) {
      const hit = hitTestObject(pos, true)
      if (hit && (hit.type === 'pin' || hit.type === 'region')) {
        setPinnedPreview(prev => prev?.id === hit.item.id && prev?.type === hit.type ? null : { type: hit.type, id: hit.item.id })
        return
      }
      setPinnedPreview(null)
      return
    }

    const selectedBounds = selectedObjectBounds()
    if (selectedBounds && selectedObject) {
      const handleRadius = Math.max(12, 14 / zoomRef.current)
      if (Math.hypot(pos.x - selectedBounds.right, pos.y - selectedBounds.bottom) <= handleRadius) {
        const item = findMapObject(selectedObject.type, selectedObject.id)
        if (item) {
          resizingObjectRef.current = {
            type: selectedObject.type,
            id: selectedObject.id,
            centerX: selectedBounds.centerX,
            centerY: selectedBounds.centerY,
            startDist: Math.hypot(selectedBounds.right - selectedBounds.centerX, selectedBounds.bottom - selectedBounds.centerY),
            startSize: objectResizeStartSize(selectedObject.type, item),
            startItem: item,
          }
          return
        }
      }
    }

    const existing = hitTestObject(pos, tool !== 'region')
    if (existing && ['pin', 'region', 'label', 'stamp'].includes(existing.type)) {
      selectMapObject(existing.type, existing.item.id)
      draggingObjectRef.current = { type: existing.type, id: existing.item.id, startX: pos.x, startY: pos.y, startItem: existing.item }
      return
    } else if (selectedObject) {
      clearObjectSelection()
    }

    if (tool === 'room') {
      roomDraftRef.current = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
      setRoomDraft({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y })
      return
    }
    if (tool === 'pin')    {
      // Hit-test existing pins for dragging
      const pins = activeMap?.mapPins || []
      let hit = null
      for (let i = pins.length - 1; i >= 0; i--) {
        const p = pins[i]
        if (Math.hypot(pos.x - p.mapX, pos.y - p.mapY) <= 24) { hit = p; break }
      }
      if (hit) {
        selectMapObject('pin', hit.id)
        draggingPinRef.current = { id: hit.id, lastX: pos.x, lastY: pos.y }
        return
      }
      setPinModal(pos)
      return
    }
    if (tool === 'label')  { setLabelModal(pos);  return }
    if (tool === 'stamp')  {
      const stamps = activeMap?.mapStamps || []
      // Hit-test existing stamps (reverse order so topmost is checked first)
      let hit = null
      for (let i = stamps.length - 1; i >= 0; i--) {
        const s = stamps[i]
        const sz = (s.size || 44) / 2 + 10
        if (Math.hypot(pos.x - s.mapX, pos.y - s.mapY) <= sz) { hit = s; break }
      }
      if (hit) {
        selectMapObject('stamp', hit.id)
        draggingStampRef.current = { id: hit.id, lastX: pos.x, lastY: pos.y }
      } else {
        const stamp = { id: Date.now().toString(36), stampType: selectedStamp, mapX: pos.x, mapY: pos.y, size: stampSize, layerId: activeObjectLayerId, objectOrder: nextObjectOrderForLayer(activeObjectLayerId) }
        updateActiveMapData(m => ({ mapStamps: [...(m.mapStamps || []), stamp] }))
        selectMapObject('stamp', stamp.id)
        draggingObjectRef.current = { type: 'stamp', id: stamp.id, startX: pos.x, startY: pos.y, startItem: stamp }
        setTimeout(renderMap, 0)
      }
      return
    }
    if (tool === 'region') {
      regionDragRef.current = { points: [pos] }
      setRegionDraft({ points: [pos] })
      return
    }
    if (pathMode === 'points' && (isTerrainTool || isOverlayTool)) {
      const pts = pathWaypointsRef.current
      // Close shape when clicking near the first waypoint (3+ points placed)
      if (pts.length >= 3) {
        const threshold = Math.max(18, brushSize)
        if (Math.hypot(pos.x - pts[0].x, pos.y - pts[0].y) <= threshold) {
          pathWaypointsRef.current = [...pts, pts[0]]
          setPathWaypoints([...pts, pts[0]])
          commitPathWaypoints()
          return
        }
      }
      const newPts = [...pts, pos]
      pathWaypointsRef.current = newPts
      setPathWaypoints([...newPts])
      renderMap()
      return
    }
    pushUndo()
    paintingRef.current = true
    cursorPosRef.current = pos
    lastStrokePosRef.current = pos
    lastPaintTimeRef.current = Date.now()
    doStroke(pos)
    startPaintLoop()
  }

  function handleMouseMove(e) {
    const panDrag = panDragRef.current
    if (panDrag) {
      setPan({
        x: panDrag.panX + e.clientX - panDrag.x,
        y: panDrag.panY + e.clientY - panDrag.y,
      })
      return
    }

    // View mode: only hover detection for pins
    if (effectiveViewMode) {
      const pos = canvasPos(e)
      const hit = hitTestObject(pos, true)
      setHoveredPreview(hit && (hit.type === 'pin' || hit.type === 'region') ? { type: hit.type, id: hit.item.id } : null)
      return
    }
    if (resizingObjectRef.current) {
      const pos = canvasPos(e)
      resizeObjectFromDrag(resizingObjectRef.current, pos)
      return
    }
    if (draggingObjectRef.current) {
      const pos = canvasPos(e)
      const drag = draggingObjectRef.current
      const dx = pos.x - drag.startX
      const dy = pos.y - drag.startY
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        objectDraftRef.current = { type: drag.type, id: drag.id, item: moveObjectItem(drag.type, drag.startItem, dx, dy) }
        requestRenderMap()
      }
      return
    }
    if (roomDraftRef.current) {
      const pos = canvasPos(e)
      const draft = { ...roomDraftRef.current, x2: pos.x, y2: pos.y }
      roomDraftRef.current = draft
      setRoomDraft({ ...draft })
      return
    }
    if (draggingPinRef.current) {
      const pos = canvasPos(e)
      const drag = draggingPinRef.current
      const dx = pos.x - drag.lastX
      const dy = pos.y - drag.lastY
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        draggingPinRef.current = { ...drag, lastX: pos.x, lastY: pos.y }
        updateActiveMapData(m => ({
          mapPins: (m.mapPins || []).map(p => p.id === drag.id ? { ...p, mapX: p.mapX + dx, mapY: p.mapY + dy } : p)
        }))
        setTimeout(renderMap, 0)
      }
      return
    }
    if (draggingStampRef.current) {
      const pos = canvasPos(e)
      const drag = draggingStampRef.current
      const dx = pos.x - drag.lastX
      const dy = pos.y - drag.lastY
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        draggingStampRef.current = { ...drag, lastX: pos.x, lastY: pos.y }
        updateActiveMapData(m => ({
          mapStamps: (m.mapStamps || []).map(s => s.id === drag.id ? { ...s, mapX: s.mapX + dx, mapY: s.mapY + dy } : s)
        }))
        setTimeout(renderMap, 0)
      }
      return
    }
    if (regionDragRef.current) {
      const pos = canvasPos(e)
      const pts = regionDragRef.current.points
      const last = pts[pts.length - 1]
      if (Math.hypot(pos.x - last.x, pos.y - last.y) < 8) return
      const next = { points: [...pts, pos] }
      regionDragRef.current = next
      setRegionDraft(next)
      return
    }
    if (!paintingRef.current) return
    const pos = canvasPos(e)
    cursorPosRef.current = pos
    const last = lastStrokePosRef.current
    if (last) {
      const dist = Math.hypot(pos.x - last.x, pos.y - last.y)
      const step = Math.max(1, brushSizeRef.current * 0.28)
      if (dist > step) {
        const steps = Math.ceil(dist / step)
        for (let i = 1; i <= steps; i++) {
          const t = i / steps
          rawStroke({ x: Math.round(last.x + (pos.x - last.x) * t), y: Math.round(last.y + (pos.y - last.y) * t) })
        }
        renderMap()
        throttledSave()
        lastStrokePosRef.current = pos
        lastPaintTimeRef.current = Date.now()
      }
    } else {
      rawStroke(pos)
      renderMap()
      throttledSave()
      lastStrokePosRef.current = pos
      lastPaintTimeRef.current = Date.now()
    }
  }

  function hitTestPin(pos) {
    const hit = hitTestObject(pos, true)
    return hit && (hit.type === 'pin' || hit.type === 'region') ? hit : null
  }

  function screenToMapPoint(clientX, clientY) {
    const viewport = viewportRef.current
    if (!viewport) return { x: 0, y: 0 }
    const rect = viewport.getBoundingClientRect()
    return {
      x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (clientY - rect.top - panRef.current.y) / zoomRef.current,
    }
  }

  function handleTouchPointerDown(e) {
    if (e.pointerType === 'mouse') return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (touchPointersRef.current.size === 1) {
      touchGestureRef.current = {
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
        mapPos: screenToMapPoint(e.clientX, e.clientY),
        moved: false,
      }
      return
    }

    if (touchPointersRef.current.size === 2) {
      const pts = [...touchPointersRef.current.values()]
      const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
      const viewport = viewportRef.current
      const rect = viewport?.getBoundingClientRect()
      const screenCenter = rect ? { x: center.x - rect.left, y: center.y - rect.top } : center
      touchGestureRef.current = {
        type: 'pinch',
        startDistance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        startZoom: zoomRef.current,
        startPan: panRef.current,
        screenCenter,
        mapCenter: {
          x: (screenCenter.x - panRef.current.x) / zoomRef.current,
          y: (screenCenter.y - panRef.current.y) / zoomRef.current,
        },
      }
    }
  }

  function handleTouchPointerMove(e) {
    if (e.pointerType === 'mouse') return
    if (!touchPointersRef.current.has(e.pointerId)) return
    e.preventDefault()
    touchPointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const gesture = touchGestureRef.current
    if (!gesture) return

    if (gesture.type === 'pinch' && touchPointersRef.current.size >= 2) {
      const pts = [...touchPointersRef.current.values()]
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const nextZoom = Math.max(0.2, Math.min(4, gesture.startZoom * (distance / Math.max(1, gesture.startDistance))))
      setZoom(nextZoom)
      setPan({
        x: gesture.screenCenter.x - gesture.mapCenter.x * nextZoom,
        y: gesture.screenCenter.y - gesture.mapCenter.y * nextZoom,
      })
      return
    }

    if (gesture.type === 'pan') {
      const dx = e.clientX - gesture.startX
      const dy = e.clientY - gesture.startY
      if (Math.hypot(dx, dy) > 8) gesture.moved = true
      setPan({ x: gesture.panX + dx, y: gesture.panY + dy })
    }
  }

  function handleTouchPointerUp(e) {
    if (e.pointerType === 'mouse') return
    e.preventDefault()
    const gesture = touchGestureRef.current
    touchPointersRef.current.delete(e.pointerId)

    if (gesture?.type === 'pan' && !gesture.moved) {
      const hit = hitTestPin(gesture.mapPos)
      if (hit) setPinnedPreview(prev => prev?.id === hit.item.id && prev?.type === hit.type ? null : { type: hit.type, id: hit.item.id })
      else setPinnedPreview(null)
    }

    if (touchPointersRef.current.size === 0) {
      touchGestureRef.current = null
      panDragRef.current = null
    }
  }

  function handleMouseUp() {
    if (roomDraftRef.current) {
      const draft = roomDraftRef.current
      roomDraftRef.current = null
      setRoomDraft(null)
      if (Math.abs(draft.x2 - draft.x1) > 10 && Math.abs(draft.y2 - draft.y1) > 10) {
        commitRoom(draft)
      }
      return
    }
    draggingPinRef.current = null
    commitObjectDraft()
    draggingObjectRef.current = null
    resizingObjectRef.current = null
    if (regionDragRef.current) {
      const pts = regionDragRef.current.points
      regionDragRef.current = null
      if (pts.length < 5) {
        setRegionDraft(null)
      } else {
        setRegionModal({ points: pts })
      }
    }
    if (paintLoopRef.current) {
      cancelAnimationFrame(paintLoopRef.current)
      paintLoopRef.current = null
    }
    paintingRef.current = false
    cursorPosRef.current = null
    lastStrokePosRef.current = null
    panDragRef.current = null
    draggingStampRef.current = null
  }

  function rawStroke(pos) {
    if (isTerrainTool) {
      paintBrush(hmRef.current, pos.x, pos.y, brushSize, brushStr, tool)
    } else if (isOverlayTool && tool !== 'room') {
      const needsColorOv = brushCustomColor || TEXTURE_TOOLS.has(tool) || tool === 'wall'
      if (needsColorOv && !colorOvRef.current) colorOvRef.current = createColorOverlay()
      paintOverlay(ovRef.current, pos.x, pos.y, brushSize, OVERLAY_TOOL_MAP[tool], colorOvRef.current, brushCustomColor, hmRef.current, tool, wallBrickColorRef.current)
    }
  }

  function doStroke(pos) {
    rawStroke(pos)
    renderMap()
    throttledSave()
  }

  function strokeBetween(from, to) {
    const dist = Math.hypot(to.x - from.x, to.y - from.y)
    const step = Math.max(1, brushSize * 0.35)
    const steps = Math.ceil(dist / step)
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 1 : i / steps
      rawStroke({ x: Math.round(from.x + (to.x - from.x) * t), y: Math.round(from.y + (to.y - from.y) * t) })
    }
  }

  function commitPathWaypoints() {
    const pts = pathWaypointsRef.current
    if (pts.length >= 2) {
      pushUndo()
      for (let i = 1; i < pts.length; i++) strokeBetween(pts[i - 1], pts[i])
      renderMap()
      throttledSave()
    }
    pathWaypointsRef.current = []
    setPathWaypoints([])
  }

  function handleGenerate(settings = generationSettings) {
    pushUndo()
    const seed = Number(settings.seed) || Math.random() * 99999
    const normalized = { ...DEFAULT_GENERATION_SETTINGS, ...settings, seed: String(Math.round(seed)) }
    setGenerationSettings(normalized)
    localStorage.setItem('nf_map_generation_settings', JSON.stringify(normalized))
    randomGenerate(hmRef.current, mapType, seed, normalized)
    ovRef.current.fill(0)
    if (colorOvRef.current) colorOvRef.current.fill(0)
    renderMap()
    throttledSave()
  }

  function handleClear() {
    pushUndo()
    clearMapHeight(hmRef.current, mapType)
    ovRef.current.fill(0)
    if (colorOvRef.current) colorOvRef.current.fill(0)
    renderMap()
    throttledSave()
  }

  function saveCurrentMap() {
    const mapId = activeMapIdRef.current
    if (mapId) saveMapPixels(mapId, hmRef.current, ovRef.current, colorOvRef.current)
  }

  function handleCreateMap(name, type, backgroundImage) {
    saveCurrentMap()
    const hm = createHeightmap()
    setMapPreset(hm, type, Math.random() * 9999)
    const newMapId = addMap(name, type)
    saveMapPixels(newMapId, hm, createOverlay())
    setNewMapModal(false)
    setTimeout(() => updateActiveMapData(() => ({
      mapLayers: defaultMapLayers(),
      ...(backgroundImage ? { backgroundImage, imported: true } : {}),
    })), 0)
    if (type === 'town' || type === 'city' || type === 'interior' || type === 'dungeon') setTool('room')
    else setTool('raise')
  }

  function handleSelectMap(mapId) {
    if (mapId === project?.activeMapId) return
    saveCurrentMap()
    selectMap(mapId)
  }

  function handleDeleteMap(mapId) {
    if ((project?.maps || []).length <= 1) return
    if (mapId === project?.activeMapId) saveCurrentMap()
    deleteMap(mapId)
    deleteMapPixels(mapId)
  }

  function handleFinishRename() {
    if (renamingId && renameVal.trim()) renameMap(renamingId, renameVal.trim())
    setRenamingId(null)
  }

  function updateMapLayers(updater) {
    updateActiveMapData(m => ({ mapLayers: updater(normaliseMapLayers(m)) }))
    setTimeout(renderMap, 0)
  }

  function addObjectLayer() {
    const nextId = `layer-${Date.now().toString(36)}`
    updateMapLayers(current => {
      const count = current.filter(layer => !layer.locked).length + 1
      return [...current, { id: nextId, name: `Layer ${count}`, visible: true }]
    })
    setActiveLayerId(nextId)
  }

  function toggleObjectLayer(layerId) {
    if (layerId === TERRAIN_LAYER_ID) return
    updateMapLayers(current => current.map(layer => layer.id === layerId ? { ...layer, visible: layer.visible === false } : layer))
  }

  function reorderObjectLayer(layerId, direction) {
    if (layerId === TERRAIN_LAYER_ID) return
    updateMapLayers(current => {
      const terrain = current.find(layer => layer.locked) || defaultMapLayers()[0]
      const objectLayers = current.filter(layer => !layer.locked)
      const index = objectLayers.findIndex(layer => layer.id === layerId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= objectLayers.length) return current
      const reordered = [...objectLayers]
      const [moved] = reordered.splice(index, 1)
      reordered.splice(nextIndex, 0, moved)
      return [terrain, ...reordered]
    })
  }

  function deleteObjectLayer(layerId) {
    if (layerId === TERRAIN_LAYER_ID) return
    const objectLayers = mapLayers.filter(layer => !layer.locked)
    if (objectLayers.length <= 1) return
    const fallbackId = objectLayers.find(layer => layer.id !== layerId)?.id || DEFAULT_OBJECT_LAYER_ID
    updateActiveMapData(m => ({
      mapLayers: normaliseMapLayers(m).filter(layer => layer.id !== layerId),
      mapPins: (m.mapPins || []).map(item => objectLayerId(item) === layerId ? { ...item, layerId: fallbackId } : item),
      mapRegions: (m.mapRegions || []).map(item => objectLayerId(item) === layerId ? { ...item, layerId: fallbackId } : item),
      mapLabels: (m.mapLabels || []).map(item => objectLayerId(item) === layerId ? { ...item, layerId: fallbackId } : item),
      mapStamps: (m.mapStamps || []).map(item => objectLayerId(item) === layerId ? { ...item, layerId: fallbackId } : item),
    }))
    if (activeLayerId === layerId) setActiveLayerId(fallbackId)
    setTimeout(renderMap, 0)
  }

  function objectDisplayName(type, item) {
    if (type === 'pin' || type === 'region') return atlasLocationName(item.locationId, item.name) || (type === 'pin' ? 'Location' : 'Region')
    if (type === 'label') return item.text || 'Label'
    if (type === 'stamp') return STAMP_TYPES[item.stampType]?.label || 'Stamp'
    return 'Object'
  }

  function objectIcon(type, item) {
    if (type === 'pin') return '📍'
    if (type === 'region') return '⭕'
    if (type === 'label') return 'T'
    if (type === 'stamp') return STAMP_TYPES[item.stampType]?.glyph || '◆'
    return '•'
  }

  function mapObjectsForLayer(layerId) {
    return [
      ...(activeMap?.mapRegions || []).map((item, fallback) => ({ type: 'region', item, fallback })),
      ...(activeMap?.mapPins || []).map((item, fallback) => ({ type: 'pin', item, fallback: fallback + 1000 })),
      ...(activeMap?.mapLabels || []).map((item, fallback) => ({ type: 'label', item, fallback: fallback + 2000 })),
      ...(activeMap?.mapStamps || []).map((item, fallback) => ({ type: 'stamp', item, fallback: fallback + 3000 })),
    ]
      .filter(entry => objectLayerId(entry.item) === layerId)
      .map(entry => ({ ...entry, item: applyObjectDraft(entry.type, entry.item) }))
      .sort((a, b) => objectOrder(a.item, a.fallback) - objectOrder(b.item, b.fallback))
  }

  function nextObjectOrderForLayer(layerId) {
    const entries = mapObjectsForLayer(layerId)
    if (!entries.length) return 0
    return Math.max(...entries.map(entry => objectOrder(entry.item, entry.fallback))) + 1
  }

  function selectObjectFromList(type, item) {
    setActiveLayerId(objectLayerId(item))
    selectMapObject(type, item.id)
    setTimeout(renderMap, 0)
  }

  function updateObjectInMap(type, id, updater) {
    const key = type === 'pin' ? 'mapPins'
      : type === 'region' ? 'mapRegions'
        : type === 'label' ? 'mapLabels'
          : 'mapStamps'
    updateActiveMapData(m => {
      const items = m[key] || []
      let found = false
      const nextItems = items.map(item => {
        if (item.id !== id) return item
        found = true
        return updater(item)
      })
      return { [key]: found ? nextItems : [...nextItems, updater({ id })] }
    })
  }

  function reorderLayerObject(layerId, type, id, direction) {
    const entries = mapObjectsForLayer(layerId)
    const index = entries.findIndex(entry => entry.type === type && entry.item.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= entries.length) return
    const current = entries[index]
    const target = entries[nextIndex]
    const currentOrder = objectOrder(current.item, current.fallback)
    const targetOrder = objectOrder(target.item, target.fallback)
    updateActiveMapData(m => ({
      mapPins: (m.mapPins || []).map(item => item.id === current.item.id && current.type === 'pin' ? { ...item, objectOrder: targetOrder } : item.id === target.item.id && target.type === 'pin' ? { ...item, objectOrder: currentOrder } : item),
      mapRegions: (m.mapRegions || []).map(item => item.id === current.item.id && current.type === 'region' ? { ...item, objectOrder: targetOrder } : item.id === target.item.id && target.type === 'region' ? { ...item, objectOrder: currentOrder } : item),
      mapLabels: (m.mapLabels || []).map(item => item.id === current.item.id && current.type === 'label' ? { ...item, objectOrder: targetOrder } : item.id === target.item.id && target.type === 'label' ? { ...item, objectOrder: currentOrder } : item),
      mapStamps: (m.mapStamps || []).map(item => item.id === current.item.id && current.type === 'stamp' ? { ...item, objectOrder: targetOrder } : item.id === target.item.id && target.type === 'stamp' ? { ...item, objectOrder: currentOrder } : item),
    }))
    selectMapObject(type, id)
    setTimeout(renderMap, 0)
  }

  function selectedObjectBounds() {
    const sel = selectedObject
    if (!sel || !activeMap) return null
    const item = findMapObject(sel.type, sel.id)
    if (!item) return null
    return objectBounds(sel.type, item)
  }

  function findMapObject(type, id) {
    if (!activeMap) return null
    const collections = {
      pin: activeMap.mapPins || [],
      region: activeMap.mapRegions || [],
      label: activeMap.mapLabels || [],
      stamp: activeMap.mapStamps || [],
    }
    const item = collections[type]?.find(entry => entry.id === id) || null
    return item ? applyObjectDraft(type, item) : null
  }

  function objectBounds(type, item) {
    if (type === 'pin') {
      const r = Math.max(18, item.size || 36) * 0.75
      return { type, id: item.id, left: item.mapX - r, top: item.mapY - r, right: item.mapX + r, bottom: item.mapY + r, centerX: item.mapX, centerY: item.mapY }
    }
    if (type === 'stamp') {
      const r = (item.size || 44) / 2 + 10
      return { type, id: item.id, left: item.mapX - r, top: item.mapY - r, right: item.mapX + r, bottom: item.mapY + r, centerX: item.mapX, centerY: item.mapY }
    }
    if (type === 'label') {
      const size = item.size || 28
      const halfW = Math.max(36, String(item.text || '').length * size * 0.34)
      return { type, id: item.id, left: item.mapX - halfW, top: item.mapY - size * 0.75, right: item.mapX + halfW, bottom: item.mapY + size * 0.75, centerX: item.mapX, centerY: item.mapY }
    }
    if (type === 'region') {
      if (item.points?.length) {
        const xs = item.points.map(p => p.x * MAP_W)
        const ys = item.points.map(p => p.y * MAP_H)
        const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys)
        return { type, id: item.id, left, top, right, bottom, centerX: (left + right) / 2, centerY: (top + bottom) / 2 }
      }
      const cx = (item.cx || 0.5) * MAP_W
      const cy = (item.cy || 0.5) * MAP_H
      const rx = (item.rx || 0.08) * MAP_W
      const ry = (item.ry || 0.06) * MAP_H
      return { type, id: item.id, left: cx - rx, top: cy - ry, right: cx + rx, bottom: cy + ry, centerX: cx, centerY: cy }
    }
    return null
  }

  function objectResizeStartSize(type, item) {
    if (type === 'pin') return item.size || 36
    if (type === 'stamp') return item.size || 44
    if (type === 'label') return item.size || 28
    return 1
  }

  function resizeObjectFromDrag(drag, pos) {
    const nextDist = Math.max(8, Math.hypot(pos.x - drag.centerX, pos.y - drag.centerY))
    const factor = Math.max(0.25, Math.min(4, nextDist / Math.max(8, drag.startDist)))
    if (drag.type === 'pin') {
      objectDraftRef.current = { type: 'pin', id: drag.id, item: { ...drag.startItem, size: Math.max(18, Math.min(90, drag.startSize * factor)) } }
    } else if (drag.type === 'stamp') {
      objectDraftRef.current = { type: 'stamp', id: drag.id, item: { ...drag.startItem, size: Math.max(8, Math.min(160, drag.startSize * factor)) } }
    } else if (drag.type === 'label') {
      objectDraftRef.current = { type: 'label', id: drag.id, item: { ...drag.startItem, size: Math.max(10, Math.min(120, drag.startSize * factor)) } }
    } else if (drag.type === 'region') {
      objectDraftRef.current = { type: 'region', id: drag.id, item: scaleRegion(drag.startItem, factor) }
    }
    requestRenderMap()
  }

  function downloadMap(format) {
    const canvas = canvasRef.current
    if (!canvas) return
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
    const dataUrl = canvas.toDataURL(mimeType, 0.92)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${activeMap?.name || 'map'}.${format}`
    a.click()
  }

  function commitRoom(draft) {
    const x1 = Math.min(draft.x1, draft.x2)
    const y1 = Math.min(draft.y1, draft.y2)
    const x2 = Math.max(draft.x1, draft.x2)
    const y2 = Math.max(draft.y1, draft.y2)
    const wallThick = Math.max(4, Math.round(brushSize * 0.5))
    pushUndo()
    if (!colorOvRef.current) colorOvRef.current = createColorOverlay()
    const ov = ovRef.current
    const cov = colorOvRef.current
    const brickDef = WALL_BRICK_COLORS.find(c => c.id === wallBrickColor) || WALL_BRICK_COLORS[0]
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) continue
        const idx = y * MAP_W + x
        const onTopEdge = y < y1 + wallThick
        const onBottomEdge = y > y2 - wallThick
        const onLeftEdge = x < x1 + wallThick
        const onRightEdge = x > x2 - wallThick
        if (onTopEdge || onBottomEdge || onLeftEdge || onRightEdge) {
          ov[idx] = 6
          if (cov) {
            cov[idx * 4]     = brickDef.base[0]
            cov[idx * 4 + 1] = brickDef.base[1]
            cov[idx * 4 + 2] = brickDef.base[2]
            cov[idx * 4 + 3] = 254
          }
        } else {
          ov[idx] = 8  // room fill
          if (cov) cov[idx * 4 + 3] = 0
        }
      }
    }
    renderMap()
    throttledSave()
  }

  const TERRAIN_TOOLS = [
    { id: 'raise',   label: '▲ Raise'   },
    { id: 'lower',   label: '▼ Lower'   },
    { id: 'smooth',  label: '≈ Smooth'  },
    { id: 'flatten', label: '═ Flatten' },
    { id: 'water',   label: '💧 Water'  },
  ]
  const TEXTURE_TOOL_LIST = [
    { id: 'rock',         label: '▧ Rock'      },
    { id: 'sand',         label: '▫ Sand'      },
    { id: 'grassland',    label: '▥ Grassland' },
    { id: 'farmland',     label: '▤ Farmland'  },
    { id: 'swampland',    label: '▩ Swampland' },
    { id: 'erase-texture',label: '⌫ Erase'    },
  ]
  const SMALL_MAP_TOOLS = [
    { id: 'wall', label: '⬛ Wall' },
    { id: 'path', label: '🟫 Path' },
    { id: 'room', label: '⬜ Room' },
    { id: 'erase-texture', label: '⌫ Erase' },
  ]
  const PLACE_TOOLS = [
    { id: 'pin',    label: '📍 Location' },
    { id: 'region', label: '⭕ Region'   },
    { id: 'label',  label: 'T Label'    },
    { id: 'stamp',  label: '◆ Stamp'   },
  ]

  const activeStampList = (mapType === 'town' || mapType === 'city') ? TOWN_STAMPS
    : (mapType === 'interior' || mapType === 'dungeon') ? INTERIOR_STAMPS
    : WORLD_STAMPS
  const VIEW_TOOLS = [
    { id: 'pan', label: '✥ Pan' },
  ]

  if (!project) return null

  const regions = activeMap?.mapRegions || []
  const maps = project.maps || []
  const brushMin = tool === 'water' ? 2 : 6
  const brushMax = tool === 'water' ? 32 : 120

  // No maps yet — show creation prompt
  if (maps.length === 0) {
    return (
      <div className="workspace-page" style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <div className="empty-state">
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}>No maps yet</div>
        <div style={{ fontSize: 14, color: 'var(--muted)' }}>{isMobileView ? 'Maps are view only on mobile.' : 'Create your first map to start building your world'}</div>
        {!isMobileView && <button className="btn btn-primary" onClick={() => setNewMapModal(true)}>New Map</button>}
        </div>
        {!isMobileView && newMapModal && <NewMapModal onClose={() => setNewMapModal(false)} onCreate={handleCreateMap} />}
      </div>
    )
  }

  return (
    <div style={{ flex:1, height:'100%', minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column', ...(isFullscreen ? { position:'fixed', inset:12, zIndex:80, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, boxShadow:'var(--shadow-modal)' } : {}) }}>

      {/* Slim top bar */}
      <div className="studio-topbar map-builder-topbar" style={{ padding:'6px 10px', flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
          <span style={{ fontFamily:'var(--font-serif)', fontSize:18, fontWeight:700 }}>Map Builder</span>
          {mapType && (
            <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)' }}>
              {MAP_TYPE_LABELS[mapType] || mapType}
            </span>
          )}
          {isMobileView && (
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10, background:'var(--accent-fade)', border:'1px solid color-mix(in srgb, var(--accent) 42%, var(--border))', color:'var(--accent)' }}>
              View only
            </span>
          )}
        </div>
        <div className="map-builder-actions" style={{ display:'flex', gap:4, alignItems:'center', flexShrink:0 }}>
          {!effectiveViewMode && (mapType === 'world' || mapType === 'regional' || mapType === 'region') && (
            <button className="btn btn-secondary btn-sm" onClick={() => setGenerateModal(true)}>Generate</button>
          )}
          {!effectiveViewMode && <button className="btn btn-secondary btn-sm" onClick={handleClear}>Clear</button>}
          {!effectiveViewMode && <button className="btn btn-secondary btn-sm" onClick={undo} title="Undo">↩ Undo</button>}
          {!isMobileView && (
            <>
              <div style={{ width:1, height:20, background:'var(--border)', margin:'0 2px' }} />
              <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:7, overflow:'hidden' }}>
                {['view', 'edit'].map(nextMode => (
                  <button
                    key={nextMode}
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setMode(nextMode); clearObjectSelection(); setPinnedPreview(null); setHoveredPreview(null) }}
                    style={{
                      border:'none',
                      borderRadius:0,
                      background: mode === nextMode ? 'var(--accent)' : 'var(--surface2)',
                      color: mode === nextMode ? '#fff' : 'var(--muted)',
                    }}
                  >
                    {nextMode === 'view' ? 'View' : 'Edit'}
                  </button>
                ))}
              </div>
            </>
          )}
          <div style={{ width:1, height:20, background:'var(--border)', margin:'0 2px' }} />
          <button className="btn btn-secondary btn-sm" onClick={() => zoomAt((viewportRef.current?.getBoundingClientRect().left || 0) + (viewportRef.current?.clientWidth || 0) / 2, (viewportRef.current?.getBoundingClientRect().top || 0) + (viewportRef.current?.clientHeight || 0) / 2, 0.85)} title="Zoom out">−</button>
          <span style={{ fontSize:12, color:'var(--muted)', minWidth:40, textAlign:'center' }}>{Math.round(zoom * 100)}%</span>
          <button className="btn btn-secondary btn-sm" onClick={() => zoomAt((viewportRef.current?.getBoundingClientRect().left || 0) + (viewportRef.current?.clientWidth || 0) / 2, (viewportRef.current?.getBoundingClientRect().top || 0) + (viewportRef.current?.clientHeight || 0) / 2, 1.15)} title="Zoom in">+</button>
          <button className="btn btn-secondary btn-sm" onClick={fitMapToViewport} title="Fit map to view">Fit</button>
          <button className="btn btn-secondary btn-sm" onClick={resetView} title="Show map at full resolution">100%</button>
          {!isMobileView && (
            <button className="btn btn-secondary btn-sm" onClick={() => setRightPanelOpen(v => !v)} title={rightPanelOpen ? 'Hide layers panel' : 'Show layers panel'}>
              Layers
            </button>
          )}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setDownloadMenu(v => !v)}>⬇ Export</button>
            {downloadMenu && (
              <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden', zIndex:20, minWidth:120, boxShadow:'0 8px 24px rgba(0,0,0,.4)' }}
                onMouseLeave={() => setDownloadMenu(false)}
              >
                {['PNG', 'JPEG'].map(fmt => (
                  <button key={fmt} onClick={() => { downloadMap(fmt.toLowerCase()); setDownloadMenu(false) }}
                    style={{ display:'block', width:'100%', padding:'8px 14px', fontSize:12, cursor:'pointer', fontFamily:'inherit', textAlign:'left', background:'none', border:'none', color:'var(--text)' }}>
                    Download as {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsFullscreen(v => !v)} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      {/* Body: left panel + canvas + right panel */}
      <div className="map-builder-body" style={{ flex:1, minHeight:0, display:'flex', overflow:'hidden' }}>

        {/* LEFT PANEL — tools + settings */}
        <div className="map-builder-tools" style={{ width:164, flexShrink:0, borderRight:'1px solid var(--border)', background:'color-mix(in srgb, var(--surface) 94%, #000)', display: effectiveViewMode ? 'none' : 'flex', flexDirection:'column', overflowY:'auto' }}>
          <div style={{ padding:'8px 6px', display:'flex', flexDirection:'column', gap:8 }}>

            {/* Tool groups */}
            {!isSmallMap && !isImported && (
              <>
                <ToolGroup label="Terrain" tools={TERRAIN_TOOLS} active={tool} onSelect={selectTool} wrap />
                <ToolGroup label="Texture" tools={TEXTURE_TOOL_LIST} active={tool} onSelect={selectTool} wrap />
              </>
            )}
            {(isSmallMap || isImported) && (
              <ToolGroup label="Draw" tools={SMALL_MAP_TOOLS} active={tool} onSelect={selectTool} wrap />
            )}
            <ToolGroup label="Place" tools={isSmallMap ? PLACE_TOOLS.filter(t => t.id === 'stamp') : PLACE_TOOLS} active={tool} onSelect={selectTool} wrap />
            <ToolGroup label="View" tools={VIEW_TOOLS} active={tool} onSelect={selectTool} wrap />

            {/* Tabletop grid toggle */}
            {isTabletop && (
              <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--faint)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:1 }}>Grid</div>
                <button onClick={() => setGridVisible(v => !v)} style={{ padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'inherit', textAlign:'left', background:gridVisible ? 'var(--accent)' : 'var(--surface2)', border:`1px solid ${gridVisible ? 'var(--accent)' : 'var(--border)'}`, color:gridVisible ? '#fff' : 'var(--muted)' }}>
                  {gridVisible ? '⊞ Grid On' : '⊟ Grid Off'}
                </button>
              </div>
            )}

            {/* Tool-specific settings */}
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, display:'flex', flexDirection:'column', gap:8 }}>

              {/* Brush size */}
              {!isPanTool && (
                <label style={{ display:'flex', flexDirection:'column', gap:3, fontSize:11, color:'var(--muted)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span>Brush</span><span>{Math.min(brushSize, brushMax)}</span>
                  </div>
                  <input type="range" min={brushMin} max={brushMax} value={Math.min(brushSize, brushMax)} onChange={e => setBrushSize(+e.target.value)} style={{ accentColor:'var(--accent)', width:'100%' }} />
                </label>
              )}

              {/* Strength */}
              {isTerrainTool && (
                <label style={{ display:'flex', flexDirection:'column', gap:3, fontSize:11, color:'var(--muted)' }}>
                  <span>Strength</span>
                  <input type="range" min="1" max="20" value={Math.round(brushStr * 250)} onChange={e => setBrushStr(e.target.value / 250)} style={{ accentColor:'var(--accent)', width:'100%' }} />
                </label>
              )}

              {/* Path mode */}
              {(isTerrainTool || isOverlayTool) && mapType !== 'world' && mapType !== 'regional' && (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>Mode</div>
                  <div style={{ display:'flex', gap:4 }}>
                    {['freehand', 'points'].map(m => (
                      <button key={m} onClick={() => { setPathMode(m); pathWaypointsRef.current = []; setPathWaypoints([]) }}
                        style={{ flex:1, padding:'3px 4px', borderRadius:5, fontSize:10, cursor:'pointer', fontFamily:'inherit', background:pathMode === m ? 'var(--accent)' : 'var(--surface2)', border:`1px solid ${pathMode === m ? 'var(--accent)' : 'var(--border)'}`, color:pathMode === m ? '#fff' : 'var(--muted)' }}>
                        {m === 'freehand' ? '✏ Free' : '⬡ Points'}
                      </button>
                    ))}
                  </div>
                  {pathMode === 'points' && pathWaypoints.length >= 2 && (
                    <button onClick={commitPathWaypoints} style={{ padding:'4px 10px', borderRadius:5, fontSize:11, cursor:'pointer', fontFamily:'inherit', background:'var(--accent)', border:'1px solid var(--accent)', color:'#fff', fontWeight:600 }}>
                      ✓ Finish ({pathWaypoints.length})
                    </button>
                  )}
                  {pathMode === 'points' && pathWaypoints.length > 0 && (
                    <button onClick={() => { pathWaypointsRef.current = []; setPathWaypoints([]) }} style={{ padding:'3px 7px', borderRadius:5, fontSize:11, cursor:'pointer', fontFamily:'inherit', background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--muted)' }}>✕ Clear</button>
                  )}
                </div>
              )}

              {/* Brick color for wall tool */}
              {tool === 'wall' && (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'var(--faint)', textTransform:'uppercase', letterSpacing:'.06em' }}>Brick Color</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {WALL_BRICK_COLORS.map(bc => (
                      <button key={bc.id}
                        onClick={() => setWallBrickColor(bc.id)}
                        title={bc.label}
                        style={{
                          width:22, height:22, borderRadius:4, cursor:'pointer',
                          background: `rgb(${bc.base[0]},${bc.base[1]},${bc.base[2]})`,
                          border: wallBrickColor === bc.id ? '2px solid #f6d986' : '1.5px solid rgba(255,255,255,0.2)',
                          padding: 0,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Custom colour */}
              {isOverlayTool && tool !== 'wall' && (
                <div style={{ display:'flex', flexDirection:'column', gap:4, fontSize:11, color:'var(--muted)' }}>
                  <label style={{ display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}>
                    <input type="checkbox" checked={!!brushCustomColor} onChange={e => setBrushCustomColor(e.target.checked ? '#c07040' : null)} style={{ accentColor:'var(--accent)' }} />
                    Custom colour
                  </label>
                  {brushCustomColor && (
                    <input type="color" value={brushCustomColor} onChange={e => setBrushCustomColor(e.target.value)} style={{ width:'100%', height:28, padding:2, borderRadius:5, border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer' }} />
                  )}
                </div>
              )}

              {/* Stamp settings */}
              {tool === 'stamp' && (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'var(--faint)', textTransform:'uppercase', letterSpacing:'.06em' }}>New Stamp</div>
                  <select
                    value={activeStampList.includes(selectedStamp) ? selectedStamp : activeStampList[0]}
                    onChange={e => setSelectedStamp(e.target.value)}
                    style={{ background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:6, padding:'4px 7px', fontSize:11, fontFamily:'inherit', width:'100%' }}
                  >
                    {activeStampList.map(id => <option key={id} value={id}>{STAMP_TYPES[id].glyph} {STAMP_TYPES[id].label}</option>)}
                  </select>
                  <label style={{ display:'flex', flexDirection:'column', gap:3, fontSize:11, color:'var(--muted)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span>Size</span><span>{stampSize}</span>
                    </div>
                    <input type="range" min={12} max={80} value={stampSize} onChange={e => setStampSize(+e.target.value)} style={{ accentColor:'var(--accent)', width:'100%' }} />
                  </label>
                </div>
              )}

              {/* Tabletop grid settings */}
              {isTabletop && gridVisible && (
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={{ display:'flex', flexDirection:'column', gap:3, fontSize:11, color:'var(--muted)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span>Grid Size</span><span>{gridSize}px</span>
                    </div>
                    <input type="range" min="8" max="80" step="4" value={gridSize} onChange={e => setGridSize(+e.target.value)} style={{ accentColor:'var(--accent)', width:'100%' }} />
                  </label>
                  <label style={{ display:'flex', flexDirection:'column', gap:3, fontSize:11, color:'var(--muted)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span>Grid Opacity</span><span>{Math.round(gridOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="5" max="100" value={Math.round(gridOpacity * 100)} onChange={e => setGridOpacity(+e.target.value / 100)} style={{ accentColor:'var(--accent)', width:'100%' }} />
                  </label>
                </div>
              )}

              {/* Regions list */}
              {regions.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:'var(--faint)', textTransform:'uppercase', letterSpacing:'.06em' }}>Regions</div>
                  {regions.map(reg => (
                    <span key={reg.id} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, background:'var(--surface2)', border:`1px solid ${reg.color}`, borderRadius:8, padding:'3px 8px', color:reg.color }}>
                      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{atlasLocationName(reg.locationId, reg.name)}</span>
                      <button
                        onClick={() => { if (reg.locationId) deleteLocation?.(reg.locationId); updateActiveMapData(m => ({ mapRegions: (m.mapRegions || []).filter(r => r.id !== reg.id) })) }}
                        style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:0, fontSize:11, fontFamily:'inherit', flexShrink:0 }}
                      >✕</button>
                    </span>
                  ))}
                </div>
              )}

              {/* Hint text */}
              <div style={{ fontSize:10, color:'var(--faint)', lineHeight:1.4, paddingTop:2 }}>
                {tool === 'region' ? 'Draw freehand to outline a region' : tool === 'label' ? 'Click map to add a label' : tool === 'stamp' ? 'Click to place · drag to move' : tool === 'water' ? 'Tiny brush for rivers & waterways' : pathMode === 'points' ? 'Click waypoints · Finish to draw' : 'Scroll to zoom · Shift-drag to pan'}
              </div>
            </div>
          </div>
        </div>

        {/* CANVAS */}
        <div
          ref={viewportRef}
          onContextMenu={e => e.preventDefault()}
          className="map-builder-viewport"
          style={{ flex:1, minWidth:0, minHeight:0, overflow:'hidden', position:'relative', touchAction:'none', background:'radial-gradient(circle at center, color-mix(in srgb, var(--surface2) 82%, var(--accent) 8%) 0, var(--surface3) 72%)' }}
        >
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize:`${Math.max(16, 32 * zoom)}px ${Math.max(16, 32 * zoom)}px`, backgroundPosition:`${pan.x}px ${pan.y}px`, opacity:0.16 }} />
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onPointerDown={handleTouchPointerDown}
            onPointerMove={handleTouchPointerMove}
            onPointerUp={handleTouchPointerUp}
            onPointerCancel={handleTouchPointerUp}
            style={{ position:'absolute', left:pan.x, top:pan.y, cursor:effectiveViewMode || isPanTool ? 'grab' : tool === 'stamp' ? 'crosshair' : 'crosshair', display:'block', width:MAP_W * zoom, height:MAP_H * zoom, imageRendering:'auto', borderRadius:10, boxShadow:'0 22px 54px rgba(0,0,0,.42), 0 0 0 1px rgba(255,255,255,.08)', background:'#07111d', touchAction:'none' }}
          />
          {regionDraft && regionDraft.points && regionDraft.points.length >= 2 && (
            <svg style={{ position:'absolute', left:pan.x, top:pan.y, width:MAP_W * zoom, height:MAP_H * zoom, pointerEvents:'none', borderRadius:10 }} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
              <polygon points={regionDraft.points.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(56, 189, 248, 0.18)" stroke="rgba(255,255,255,0.85)" strokeWidth={3 / zoom} strokeDasharray={`${12 / zoom} ${8 / zoom}`} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          )}
          {roomDraft && Math.abs(roomDraft.x2 - roomDraft.x1) > 4 && (
            <svg style={{ position:'absolute', left:pan.x, top:pan.y, width:MAP_W * zoom, height:MAP_H * zoom, pointerEvents:'none', borderRadius:10 }} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
              <rect
                x={Math.min(roomDraft.x1, roomDraft.x2)}
                y={Math.min(roomDraft.y1, roomDraft.y2)}
                width={Math.abs(roomDraft.x2 - roomDraft.x1)}
                height={Math.abs(roomDraft.y2 - roomDraft.y1)}
                fill="rgba(232, 221, 191, 0.18)"
                stroke="rgba(255, 220, 140, 0.85)"
                strokeWidth={3 / zoom}
                strokeDasharray={`${10 / zoom} ${6 / zoom}`}
              />
            </svg>
          )}
          {effectiveViewMode && (hoveredPreview || pinnedPreview) && (() => {
            const preview = pinnedPreview || hoveredPreview
            const item = preview.type === 'region'
              ? (activeMap?.mapRegions || []).find(r => r.id === preview.id)
              : (activeMap?.mapPins || []).find(p => p.id === preview.id)
            if (!item) return null
            const locName = atlasLocationName(item.locationId, item.name)
            const loc = project?.locations?.find(l => l.id === item.locationId)
            const viewport = viewportRef.current
            const vRect = viewport ? viewport.getBoundingClientRect() : { width: 800, height: 600 }
            const regionCenter = item.points?.length
              ? {
                  x: item.points.reduce((sum, p) => sum + p.x, 0) / item.points.length * MAP_W,
                  y: item.points.reduce((sum, p) => sum + p.y, 0) / item.points.length * MAP_H,
                }
              : { x: (item.cx || 0.5) * MAP_W, y: (item.cy || 0.5) * MAP_H }
            const mapPoint = preview.type === 'region' ? regionCenter : { x: item.mapX, y: item.mapY }
            const rawScreenX = pan.x + mapPoint.x * zoom
            const rawScreenY = pan.y + mapPoint.y * zoom
            const boxW = 260
            const screenX = Math.min(rawScreenX + 12, vRect.width - boxW - 12)
            const screenY = Math.max(8, rawScreenY - 110)
            const desc = loc?.description || item.description
            return (
              <div style={{
                position: 'absolute',
                left: screenX,
                top: screenY,
                background: 'rgba(15,20,15,0.94)',
                border: '1px solid rgba(246,217,134,0.5)',
                borderRadius: 10,
                padding: '10px 14px',
                minWidth: 180,
                maxWidth: boxW,
                pointerEvents: pinnedPreview ? 'all' : 'none',
                zIndex: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}>
                <div style={{ fontWeight: 700, color: '#f6d986', fontSize: 14, marginBottom: 4 }}>{locName}</div>
                {item.type && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{item.type}</div>}
                {desc && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: 6 }}>
                    {desc.slice(0, 120)}{desc.length > 120 ? '…' : ''}
                  </div>
                )}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('yow:navigate', { detail: { section: 'locations', locationId: item.locationId } }))}
                  style={{ fontSize: 11, color: '#f6d986', background: 'none', border: '1px solid rgba(246,217,134,0.3)', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                >→ View in Locations</button>
                {pinnedPreview && (
                  <button onClick={() => setPinnedPreview(null)} style={{ marginLeft: 6, fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                )}
              </div>
            )
          })()}
          <div style={{ position:'absolute', left:14, bottom:14, display:'flex', gap:8, alignItems:'center', padding:'6px 10px', borderRadius:8, background:'rgba(0,0,0,.42)', border:'1px solid rgba(255,255,255,.12)', color:'#fff', fontSize:12, pointerEvents:'none' }}>
            <span>{MAP_W} × {MAP_H}</span>
            <span style={{ color:'rgba(255,255,255,.5)' }}>•</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* RIGHT PANEL — layers, objects, and maps */}
        <div className="map-builder-map-list" style={{ display:'flex', flexDirection:'column', borderLeft:'1px solid var(--border)', background:'color-mix(in srgb, var(--surface) 94%, #000)', flexShrink:0, width:rightPanelOpen ? 220 : 30, transition:'width 0.15s ease', overflow:'hidden' }}>
          <button
            onClick={() => setRightPanelOpen(v => !v)}
            title={rightPanelOpen ? 'Collapse right panel' : 'Expand right panel'}
            style={{ display:'flex', alignItems:'center', justifyContent:rightPanelOpen ? 'space-between' : 'center', gap:6, padding:'8px 10px', flexShrink:0, background:'none', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', fontFamily:'inherit', color:'var(--muted)', fontSize:12, fontWeight:600, whiteSpace:'nowrap', width:'100%' }}
          >
            {rightPanelOpen && <span>Layers & Objects</span>}
            <span style={{ fontSize:13 }}>{rightPanelOpen ? '›' : '‹'}</span>
          </button>
          {rightPanelOpen && (
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:10, padding:'8px 7px' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {mapLayers.map(layer => {
                  const layerObjects = layer.locked ? [] : mapObjectsForLayer(layer.id)
                  const layerActive = activeLayerId === layer.id
                  const objectLayerIds = mapLayers.filter(item => !item.locked).map(item => item.id)
                  const objectLayerIndex = objectLayerIds.indexOf(layer.id)
                  return (
                    <div key={layer.id} style={{ border:'1px solid var(--border)', borderRadius:7, overflow:'hidden', background:layerActive ? 'color-mix(in srgb, var(--accent) 10%, var(--surface2))' : 'var(--surface2)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 6px', borderBottom:layer.locked || layerObjects.length ? '1px solid var(--border)' : 'none' }}>
                        <button
                          onClick={() => setActiveLayerId(layer.id)}
                          title={layer.locked ? 'Locked terrain base layer' : 'Select layer'}
                          style={{ flex:1, minWidth:0, background:'none', border:'none', color:layerActive ? 'var(--text)' : 'var(--muted)', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', padding:0 }}
                        >
                          {layer.locked ? '▣' : '▢'} {layer.name}
                        </button>
                        {!layer.locked && (
                          <>
                            <span style={{ fontSize:10, color:'var(--faint)', flexShrink:0 }}>{layerObjects.length}</span>
                            <button onClick={() => reorderObjectLayer(layer.id, -1)} disabled={objectLayerIndex <= 0} title="Move layer up" style={{ width:22, height:22, borderRadius:5, cursor:objectLayerIndex <= 0 ? 'default' : 'pointer', background:'var(--surface)', border:'1px solid var(--border)', color:objectLayerIndex <= 0 ? 'var(--faint)' : 'var(--muted)', opacity:objectLayerIndex <= 0 ? 0.45 : 1, fontFamily:'inherit', flexShrink:0 }}>
                              ↑
                            </button>
                            <button onClick={() => reorderObjectLayer(layer.id, 1)} disabled={objectLayerIndex === objectLayerIds.length - 1} title="Move layer down" style={{ width:22, height:22, borderRadius:5, cursor:objectLayerIndex === objectLayerIds.length - 1 ? 'default' : 'pointer', background:'var(--surface)', border:'1px solid var(--border)', color:objectLayerIndex === objectLayerIds.length - 1 ? 'var(--faint)' : 'var(--muted)', opacity:objectLayerIndex === objectLayerIds.length - 1 ? 0.45 : 1, fontFamily:'inherit', flexShrink:0 }}>
                              ↓
                            </button>
                            <button onClick={() => toggleObjectLayer(layer.id)} title={layer.visible === false ? 'Show layer' : 'Hide layer'} style={{ width:24, height:22, borderRadius:5, cursor:'pointer', background:'var(--surface)', border:'1px solid var(--border)', color:layer.visible === false ? 'var(--faint)' : 'var(--muted)', fontFamily:'inherit', flexShrink:0 }}>
                              {layer.visible === false ? '○' : '◉'}
                            </button>
                            {!effectiveViewMode && (
                              <button onClick={() => deleteObjectLayer(layer.id)} title="Delete layer" style={{ width:22, height:22, borderRadius:5, cursor:'pointer', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--faint)', fontFamily:'inherit', flexShrink:0 }}>
                                ×
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      {layer.locked ? (
                        <div style={{ padding:'5px 8px', fontSize:11, color:'var(--faint)' }}>Base terrain</div>
                      ) : layerObjects.length ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:2, padding:'4px' }}>
                          {layerObjects.map(({ type, item }, objectIndex) => {
                            const selected = selectedObject?.type === type && selectedObject?.id === item.id
                            return (
                              <div
                                key={`${type}-${item.id}`}
                                style={{ display:'flex', alignItems:'center', gap:3, width:'100%', padding:'3px', borderRadius:5, border:`1px solid ${selected ? 'var(--accent)' : 'transparent'}`, background:selected ? 'var(--accent)' : 'transparent', color:selected ? '#fff' : 'var(--muted)', minWidth:0 }}
                              >
                                <button
                                  onClick={() => selectObjectFromList(type, item)}
                                  style={{ display:'flex', alignItems:'center', gap:6, flex:1, minWidth:0, background:'none', border:'none', color:'inherit', cursor:'pointer', fontFamily:'inherit', fontSize:11, textAlign:'left', padding:'2px 3px' }}
                                >
                                  <span style={{ width:16, textAlign:'center', flexShrink:0 }}>{objectIcon(type, item)}</span>
                                  <span style={{ flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{objectDisplayName(type, item)}</span>
                                  <span style={{ color:selected ? 'rgba(255,255,255,0.72)' : 'var(--faint)', fontSize:10, textTransform:'capitalize', flexShrink:0 }}>{type}</span>
                                </button>
                                <button onClick={() => reorderLayerObject(layer.id, type, item.id, -1)} disabled={objectIndex <= 0} title="Move object up" style={{ width:20, height:20, borderRadius:4, cursor:objectIndex <= 0 ? 'default' : 'pointer', background:selected ? 'rgba(255,255,255,0.12)' : 'var(--surface)', border:'1px solid var(--border)', color:objectIndex <= 0 ? 'var(--faint)' : 'var(--muted)', opacity:objectIndex <= 0 ? 0.45 : 1, fontFamily:'inherit', flexShrink:0 }}>↑</button>
                                <button onClick={() => reorderLayerObject(layer.id, type, item.id, 1)} disabled={objectIndex === layerObjects.length - 1} title="Move object down" style={{ width:20, height:20, borderRadius:4, cursor:objectIndex === layerObjects.length - 1 ? 'default' : 'pointer', background:selected ? 'rgba(255,255,255,0.12)' : 'var(--surface)', border:'1px solid var(--border)', color:objectIndex === layerObjects.length - 1 ? 'var(--faint)' : 'var(--muted)', opacity:objectIndex === layerObjects.length - 1 ? 0.45 : 1, fontFamily:'inherit', flexShrink:0 }}>↓</button>
                                {!effectiveViewMode && (
                                  <button onClick={() => deleteMapObject(type, item.id)} title="Delete object" style={{ width:20, height:20, borderRadius:4, cursor:'pointer', background:selected ? 'rgba(255,255,255,0.12)' : 'var(--surface)', border:'1px solid var(--border)', color:selected ? 'rgba(255,255,255,0.78)' : 'var(--faint)', fontFamily:'inherit', flexShrink:0 }}>×</button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div style={{ padding:'5px 8px', fontSize:11, color:'var(--faint)' }}>No objects</div>
                      )}
                    </div>
                  )
                })}
                {!effectiveViewMode && (
                  <button onClick={addObjectLayer} style={{ padding:'5px 8px', borderRadius:5, fontSize:12, cursor:'pointer', fontFamily:'inherit', background:'transparent', border:'1px dashed var(--border)', color:'var(--faint)', textAlign:'left' }}>
                    + Add layer
                  </button>
                )}
              </div>

              <div style={{ height:1, background:'var(--border)' }} />

              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                <div style={{ fontSize:9, fontWeight:700, color:'var(--faint)', textTransform:'uppercase', letterSpacing:'.06em', padding:'0 2px' }}>Maps ({maps.length})</div>
              {maps.map(map => {
                const isActive = map.id === project.activeMapId
                return (
                  <div key={map.id} style={{ display:'flex', alignItems:'stretch', gap:2, flexShrink:0 }}>
                    {renamingId === map.id ? (
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={e => setRenameVal(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyDown={e => { if (e.key === 'Enter') handleFinishRename(); if (e.key === 'Escape') setRenamingId(null) }}
                        style={{ fontSize:12, padding:'4px 8px', borderRadius:5, border:'1px solid var(--accent)', background:'var(--surface2)', color:'var(--text)', width:'100%', fontFamily:'inherit' }}
                      />
                    ) : (
                      <>
                        <button
                          onClick={() => handleSelectMap(map.id)}
                          onDoubleClick={() => { setRenamingId(map.id); setRenameVal(map.name) }}
                          style={{ flex:1, padding:'5px 10px', borderRadius:maps.length > 1 ? '5px 0 0 5px' : 5, fontSize:12, cursor:'pointer', fontFamily:'inherit', textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', background:isActive ? 'var(--accent)' : 'var(--surface2)', border:`1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`, borderRight:maps.length > 1 ? 'none' : undefined, color:isActive ? '#fff' : 'var(--muted)' }}
                        >{map.name}</button>
                        {maps.length > 1 && !effectiveViewMode && (
                          <button onClick={() => handleDeleteMap(map.id)} title="Delete map" style={{ padding:'5px 7px', borderRadius:'0 5px 5px 0', fontSize:13, cursor:'pointer', fontFamily:'inherit', background:isActive ? 'var(--accent)' : 'var(--surface2)', border:`1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`, color:isActive ? 'rgba(255,255,255,0.65)' : 'var(--faint)' }}>×</button>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
              {!effectiveViewMode && (
                <button onClick={() => setNewMapModal(true)} style={{ padding:'5px 10px', borderRadius:5, fontSize:12, cursor:'pointer', fontFamily:'inherit', flexShrink:0, background:'transparent', border:'1px dashed var(--border)', color:'var(--faint)', textAlign:'left', marginTop:4 }}>
                  + New Map
                </button>
              )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {pinModal && (
        <PinModal
          pos={pinModal}
          onClose={() => setPinModal(null)}
          onSave={(name, type, desc) => {
            const loc = addLocation({ name, category: type, type, description: desc, tags: ['map'], mapX: pinModal.x, mapY: pinModal.y })
            const pin = { id: Date.now().toString(36), name, type, description: desc, locationId: loc?.id, color: YOW_PIN.shell, coreColor: YOW_PIN.core, mapX: pinModal.x, mapY: pinModal.y, layerId: activeObjectLayerId, objectOrder: nextObjectOrderForLayer(activeObjectLayerId) }
            updateActiveMapData(m => ({ mapPins: [...(m.mapPins || []), pin] }))
            selectMapObject('pin', pin.id)
            setPinModal(null)
            renderMap()
          }}
        />
      )}

      {labelModal && (
        <LabelModal
          onClose={() => setLabelModal(null)}
          onSave={(text, size, color) => {
            const label = { id: Date.now().toString(36), text, size, color, outline: 'rgba(12, 12, 10, 0.82)', mapX: labelModal.x, mapY: labelModal.y, layerId: activeObjectLayerId, objectOrder: nextObjectOrderForLayer(activeObjectLayerId) }
            updateActiveMapData(m => ({ mapLabels: [...(m.mapLabels || []), label] }))
            selectMapObject('label', label.id)
            setLabelModal(null)
            setTimeout(renderMap, 0)
          }}
        />
      )}

      {regionModal && (
        <RegionModal
          onClose={() => { setRegionModal(null); setRegionDraft(null) }}
          onSave={(name, color, desc) => {
            const loc = addLocation({ name, category: 'Kingdom/Region', type: 'Region', description: desc, tags: ['map', 'region'] })
            const region = { id: Date.now().toString(36), name, color, fill: `${color}38`, locationId: loc?.id, description: desc, points: regionModal.points.map(p => ({ x: p.x / MAP_W, y: p.y / MAP_H })), layerId: activeObjectLayerId, objectOrder: nextObjectOrderForLayer(activeObjectLayerId) }
            updateActiveMapData(m => ({ mapRegions: [...(m.mapRegions || []), region] }))
            selectMapObject('region', region.id)
            setRegionModal(null)
            setRegionDraft(null)
          }}
        />
      )}

      {generateModal && (
        <GenerateMapModal
          mapType={mapType}
          settings={generationSettings}
          onClose={() => setGenerateModal(false)}
          onGenerate={(settings) => { handleGenerate(settings); setGenerateModal(false) }}
        />
      )}

      {newMapModal && (
        <NewMapModal onClose={() => setNewMapModal(false)} onCreate={handleCreateMap} />
      )}
    </div>
  )
}

// ---- New Map modal ----
function NewMapModal({ onClose, onCreate }) {
  const [selectedType, setSelectedType] = useState('world')
  const [name, setName] = useState('')
  const [importFile, setImportFile] = useState(null)
  const fileInputRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!selectedType) return
    const mapName = name.trim() || (NEW_MAP_TYPES.find(t => t.id === selectedType)?.label) || 'Map'
    if (importFile) {
      const reader = new FileReader()
      reader.onload = ev => onCreate(mapName, selectedType, ev.target.result)
      reader.readAsDataURL(importFile)
    } else {
      onCreate(mapName, selectedType)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-title">🗺️ New Map</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Map Name <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <input
              className="form-input"
              placeholder={selectedType ? (NEW_MAP_TYPES.find(t => t.id === selectedType)?.label || 'My Map') : 'e.g. The Known World'}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Map Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 4 }}>
              {NEW_MAP_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  style={{
                    padding: '12px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 10,
                    background: selectedType === t.id ? 'var(--accent)' : 'var(--surface2)',
                    border: `1.5px solid ${selectedType === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    color: selectedType === t.id ? '#fff' : 'var(--text)',
                  }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.3 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.72, marginTop: 2 }}>{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Import Image <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none' }}>(optional — use an existing map as background)</span></label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                style={{ flexShrink: 0 }}
              >
                {importFile ? '✓ Image selected' : '📂 Choose image…'}
              </button>
              {importFile && (
                <>
                  <span style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{importFile.name}</span>
                  <button type="button" onClick={() => setImportFile(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0 4px', fontSize: 14, flexShrink: 0 }}>✕</button>
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setImportFile(e.target.files?.[0] || null)} />
            </div>
            {importFile && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Terrain sculpting tools will be disabled. You can still draw walls, paths and place labels.
              </div>
            )}
          </div>

          {selectedType === 'world' && !importFile && (
            <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--surface2)', borderRadius: 6, padding: '8px 12px', border: '1px solid var(--border)' }}>
              ✨ World maps support procedural generation — use <strong>🎲 Generate</strong> to create a randomised continent layout.
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!selectedType}>
              {importFile ? 'Import Map' : 'Create Map'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Shared tool group component ----
function ToolGroup({ label, tools, active, onSelect, wrap }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 1, paddingLeft: 2 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, ...(wrap ? { flexWrap: 'wrap' } : {}) }}>
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: '3px 7px', borderRadius: 6, fontSize: 10.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              background: active === t.id ? 'var(--accent)' : 'var(--surface2)',
              border: `1px solid ${active === t.id ? 'var(--accent)' : 'var(--border)'}`,
              color: active === t.id ? '#fff' : 'var(--muted)',
              whiteSpace: 'nowrap',
            }}
          >{t.label}</button>
        ))}
      </div>
    </div>
  )
}


function GenerateMapModal({ mapType, settings, onClose, onGenerate }) {
  const [draft, setDraft] = useState(settings)
  const setValue = (key, value) => setDraft(current => ({ ...current, [key]: value }))
  const randomSeed = () => setValue('seed', String(Math.floor(Math.random() * 999999)))
  const applyPreset = (preset) => setDraft(current => ({ ...current, ...preset.settings }))
  const reset = () => setDraft({ ...DEFAULT_GENERATION_SETTINGS, seed: draft.seed })
  const isWorld = mapType === 'world'
  const continentMax = isWorld ? 8 : 4

  function submit(e) {
    e.preventDefault()
    onGenerate({
      ...draft,
      landScale: Number(draft.landScale),
      continentCount: Number(draft.continentCount),
      islandDensity: Number(draft.islandDensity),
      mountainIntensity: Number(draft.mountainIntensity),
      coastRoughness: Number(draft.coastRoughness),
      erosion: Number(draft.erosion),
    })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-title">🎲 Generate Terrain</div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Shape</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {GENERATION_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => applyPreset(preset)}
                  style={{ justifyContent: 'center' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Seed</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-input" value={draft.seed} onChange={e => setValue('seed', e.target.value.replace(/[^\d]/g, ''))} placeholder="Random" />
              <button type="button" className="btn btn-secondary" onClick={randomSeed}>Random</button>
            </div>
          </div>

          <GeneratorSlider label="Land Coverage" value={draft.landScale} min="0.65" max="1.45" step="0.05" suffix="x" onChange={v => setValue('landScale', v)} />
          <GeneratorSlider label="Continents" value={draft.continentCount} min="0" max={continentMax} step="1" display={Number(draft.continentCount) === 0 ? 'Auto' : draft.continentCount} onChange={v => setValue('continentCount', v)} />
          <GeneratorSlider label="Island Density" value={draft.islandDensity} min="0" max="1" step="0.05" onChange={v => setValue('islandDensity', v)} />
          <GeneratorSlider label="Coastal Roughness" value={draft.coastRoughness} min="0.1" max="1.2" step="0.05" onChange={v => setValue('coastRoughness', v)} />
          <GeneratorSlider label="Mountain Intensity" value={draft.mountainIntensity} min="0" max="1.5" step="0.05" onChange={v => setValue('mountainIntensity', v)} />
          <GeneratorSlider label="Erosion Smoothing" value={draft.erosion} min="0" max="0.65" step="0.05" onChange={v => setValue('erosion', v)} />

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={reset}>Reset</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Generate Now</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GeneratorSlider({ label, value, min, max, step, suffix = '', display, onChange }) {
  return (
    <label className="form-group">
      <span className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span>{display ?? value}{suffix}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ accentColor: 'var(--accent)', width: '100%' }}
      />
    </label>
  )
}

// ---- Pin modal ----
const LOC_TYPES = ['City','Town','Village','Castle','Dungeon','Ruin','Port','Forest','Mountain','Cave','Temple','Other']

function PinModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('City')
  const [desc, setDesc] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), type, desc)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">📍 Place Location Pin</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Location Name *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g. Ironhold Keep" />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
              {LOC_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Place Pin</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Label modal ----
function LabelModal({ onClose, onSave }) {
  const [text, setText] = useState('')
  const [size, setSize] = useState(30)
  const [color, setColor] = useState('#f6e3b1')

  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSave(text.trim(), size, color)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-title">T Add Label</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Label Text *</label>
            <input className="form-input" value={text} onChange={e => setText(e.target.value)} autoFocus placeholder="e.g. The Salt Road" />
          </div>
          <label className="form-group">
            <span className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Size</span>
              <span>{size}px</span>
            </span>
            <input type="range" min="18" max="72" value={size} onChange={e => setSize(+e.target.value)} style={{ accentColor: 'var(--accent)', width: '100%' }} />
          </label>
          <div className="form-group">
            <label className="form-label">Color</label>
            <input className="form-input" type="color" value={color} onChange={e => setColor(e.target.value)} style={{ height: 42, padding: 4 }} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!text.trim()}>Place Label</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Region modal ----
function RegionModal({ onClose, onSave }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(REGION_COLORS[0])
  const [desc, setDesc] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), color, desc)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-title">⭕ Add Region</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Region Name *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g. The Northern Reaches" />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 4 }}>
              {REGION_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', outline: color === c ? '2px solid #fff' : 'none', outlineOffset: 2 }}
                />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>Place Region</button>
          </div>
        </form>
      </div>
    </div>
  )
}
