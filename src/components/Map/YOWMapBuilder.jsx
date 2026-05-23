import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const MAP_W = 2560
const MAP_H = 1920
const SCHEMA_VERSION = 1
const MIN_SIZE = 18
const DEFAULT_ZOOM = 0.42
const DEFAULT_OBJECT_LAYER_ID = 'objects'
const LAND_FILL = '#244b2f'
const LAND_STROKE = '#162a1c'

const OBJECT_TYPES = {
  marker: { label: 'Marker', icon: '•', fill: '#d6b45f', stroke: '#6f5524' },
  label: { label: 'Label', icon: 'T', fill: '#f7e7ba', stroke: '#262118' },
  region: { label: 'Region', icon: '□', fill: LAND_FILL, stroke: LAND_STROKE },
  river: { label: 'River', icon: '~', fill: 'transparent', stroke: '#3c93b8' },
  road: { label: 'Road', icon: '—', fill: 'transparent', stroke: '#8b6743' },
  border: { label: 'Border', icon: '⋯', fill: 'transparent', stroke: '#9b5ab8' },
  shape: { label: 'Shape', icon: '○', fill: LAND_FILL, stroke: LAND_STROKE },
}

const TOOLBAR_MODES = [
  { id: 'select', label: 'Select', icon: '↖' },
  { id: 'pan', label: 'Pan', icon: '✥' },
  { id: 'zoom', label: 'Zoom', icon: '+' },
  { id: 'region', label: 'Region', icon: '□' },
  { id: 'river', label: 'River', icon: '~' },
  { id: 'road', label: 'Road', icon: '—' },
  { id: 'border', label: 'Border', icon: '⋯' },
  { id: 'shape', label: 'Shape', icon: '○' },
]

const POINT_DRAW_TOOLS = new Set(['region', 'river', 'road', 'border'])
const LINE_OBJECT_TYPES = new Set(['river', 'road', 'border'])

function uid(prefix = 'obj') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36)}`
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function round(value, precision = 1) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function hashString(value) {
  let hash = 2166136261
  const input = String(value || 'map')
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededNoise(seed, salt = 0) {
  let value = (seed + salt * 374761393) >>> 0
  value ^= value << 13
  value ^= value >>> 17
  value ^= value << 5
  return ((value >>> 0) / 4294967295)
}

function colorWithAlpha(color, alpha) {
  if (!color || color === 'transparent') return `rgba(0,0,0,${alpha})`
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(color)
  if (!match) return color
  const baseAlpha = match[4] ? parseInt(match[4], 16) / 255 : 1
  return `rgba(${parseInt(match[1], 16)},${parseInt(match[2], 16)},${parseInt(match[3], 16)},${round(baseAlpha * alpha, 3)})`
}

function drawSmoothPath(ctx, points, closed = false) {
  if (!points.length) return
  if (points.length < 3) {
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach(point => ctx.lineTo(point.x, point.y))
    if (closed) ctx.closePath()
    return
  }

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2)
  }
  const last = points[points.length - 1]
  if (closed) {
    const first = points[0]
    ctx.quadraticCurveTo(last.x, last.y, (last.x + first.x) / 2, (last.y + first.y) / 2)
    ctx.quadraticCurveTo(first.x, first.y, first.x, first.y)
    ctx.closePath()
  } else {
    ctx.lineTo(last.x, last.y)
  }
}

function resampleSegment(a, b, spacing) {
  const distance = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y))
  const steps = Math.max(1, Math.ceil(distance / spacing))
  return Array.from({ length: steps }, (_, index) => {
    const t = index / steps
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  })
}

function organicPoints(points, seed, options = {}) {
  if (points.length < 2) return points
  const closed = Boolean(options.closed)
  const amplitude = options.amplitude ?? 14
  const spacing = options.spacing ?? 34
  const source = closed ? [...points, points[0]] : points
  const resampled = []

  for (let index = 1; index < source.length; index += 1) {
    const a = source[index - 1]
    const b = source[index]
    resampled.push(...resampleSegment(a, b, spacing))
  }
  if (!closed) resampled.push(points[points.length - 1])

  return resampled.map((point, index) => {
    const prev = resampled[Math.max(0, index - 1)] || point
    const next = resampled[Math.min(resampled.length - 1, index + 1)] || point
    const dx = next.x - prev.x
    const dy = next.y - prev.y
    const len = Math.hypot(dx, dy) || 1
    const normal = { x: -dy / len, y: dx / len }
    const broad = (seededNoise(seed, index) - 0.5) * amplitude
    const fine = (seededNoise(seed, index + 900) - 0.5) * amplitude * 0.42
    const taper = closed ? 1 : Math.sin(Math.PI * (index / Math.max(1, resampled.length - 1)))
    return {
      x: point.x + normal.x * (broad + fine) * Math.max(0.18, taper),
      y: point.y + normal.y * (broad + fine) * Math.max(0.18, taper),
    }
  })
}

function objectLocalPoints(object) {
  const points = object.metadata?.points
  return Array.isArray(points) ? points.map(point => normalizedToLocal(point, object)) : []
}

function objectLocalFaces(object) {
  const faces = Array.isArray(object.metadata?.faces) ? object.metadata.faces : []
  const validFaces = faces
    .filter(face => Array.isArray(face) && face.length >= 3)
    .map(face => face.map(point => normalizedToLocal(point, object)))
  const base = objectLocalPoints(object)
  if (base.length >= 3) validFaces.unshift(base)
  return validFaces
}

function defaultLayers() {
  return [{ id: DEFAULT_OBJECT_LAYER_ID, name: 'Objects', visible: true, locked: false, zIndex: 0 }]
}

function createObject(type, index = 0) {
  const base = OBJECT_TYPES[type] || OBJECT_TYPES.region
  const stagger = index * 28
  const isLine = LINE_OBJECT_TYPES.has(type)
  return {
    id: uid(type),
    type,
    x: 420 + stagger,
    y: 320 + stagger,
    width: isLine ? 360 : type === 'marker' ? 82 : type === 'label' ? 260 : type === 'shape' ? 220 : 420,
    height: isLine ? 90 : type === 'marker' ? 82 : type === 'label' ? 88 : type === 'shape' ? 160 : 260,
    rotation: 0,
    zIndex: index + 1,
    locked: false,
    visible: true,
    metadata: {
      name: base.label,
      text: type === 'label' ? 'New Label' : base.label,
      fill: base.fill,
      stroke: base.stroke,
      opacity: 1,
      lineThickness: type === 'river' ? 12 : type === 'road' ? 7 : type === 'border' ? 5 : 2,
      dashed: type === 'road' || type === 'border',
      shapeKind: 'rectangle',
      points: isLine ? [{ x: -0.5, y: 0 }, { x: 0.5, y: 0 }] : null,
      layerId: DEFAULT_OBJECT_LAYER_ID,
    },
  }
}

function normalizeObject(raw, index) {
  const fallback = createObject(raw?.type || 'region', index)
  return {
    ...fallback,
    ...raw,
    id: raw?.id || fallback.id,
    type: raw?.type || fallback.type,
    x: Number.isFinite(raw?.x) ? raw.x : fallback.x,
    y: Number.isFinite(raw?.y) ? raw.y : fallback.y,
    width: Math.max(MIN_SIZE, Number.isFinite(raw?.width) ? raw.width : fallback.width),
    height: Math.max(MIN_SIZE, Number.isFinite(raw?.height) ? raw.height : fallback.height),
    rotation: Number.isFinite(raw?.rotation) ? raw.rotation : 0,
    zIndex: Number.isFinite(raw?.zIndex) ? raw.zIndex : index,
    locked: Boolean(raw?.locked),
    visible: raw?.visible !== false,
    metadata: normalizeMetadata({ ...fallback.metadata, ...(raw?.metadata || {}) }, raw?.type || fallback.type),
  }
}

function normalizeMetadata(metadata, type) {
  const points = Array.isArray(metadata.points)
    ? metadata.points
        .filter(point => Number.isFinite(point?.x) && Number.isFinite(point?.y))
        .map(point => ({ x: clamp(point.x, -1.5, 1.5), y: clamp(point.y, -1.5, 1.5) }))
    : metadata.points
  const faces = Array.isArray(metadata.faces)
    ? metadata.faces
        .filter(face => Array.isArray(face) && face.length >= 3)
        .map(face => face
          .filter(point => Number.isFinite(point?.x) && Number.isFinite(point?.y))
          .map(point => ({ x: clamp(point.x, -1.5, 1.5), y: clamp(point.y, -1.5, 1.5) }))
        )
        .filter(face => face.length >= 3)
    : []
  return {
    ...metadata,
    points,
    faces,
    opacity: Number.isFinite(metadata.opacity) ? clamp(metadata.opacity, 0, 1) : 1,
    lineThickness: Math.max(1, Number.isFinite(metadata.lineThickness) ? metadata.lineThickness : LINE_OBJECT_TYPES.has(type) ? 8 : 2),
    dashed: Boolean(metadata.dashed),
    shapeKind: metadata.shapeKind || 'rectangle',
  }
}

function migrateLegacyObjects(map) {
  const migrated = []
  ;(map?.mapPins || []).forEach((pin, index) => {
    migrated.push(normalizeObject({
      id: pin.id,
      type: 'marker',
      x: pin.mapX || MAP_W / 2,
      y: pin.mapY || MAP_H / 2,
      width: pin.size || 82,
      height: pin.size || 82,
      zIndex: pin.objectOrder ?? index,
      metadata: {
        name: pin.name || 'Marker',
        text: pin.name || '',
        fill: pin.coreColor || '#d6b45f',
        stroke: pin.color || '#f6d986',
        locationId: pin.locationId,
        layerId: pin.layerId || DEFAULT_OBJECT_LAYER_ID,
      },
    }, migrated.length))
  })
  ;(map?.mapLabels || []).forEach((label, index) => {
    migrated.push(normalizeObject({
      id: label.id,
      type: 'label',
      x: label.mapX || MAP_W / 2,
      y: label.mapY || MAP_H / 2,
      width: Math.max(160, String(label.text || '').length * (label.size || 28) * 0.62),
      height: Math.max(64, (label.size || 28) * 2.1),
      zIndex: label.objectOrder ?? index + 100,
      metadata: {
        name: label.text || 'Label',
        text: label.text || 'Label',
        fill: label.color || '#f7e7ba',
        stroke: label.outline || '#262118',
        layerId: label.layerId || DEFAULT_OBJECT_LAYER_ID,
      },
    }, migrated.length))
  })
  ;(map?.mapRegions || []).forEach((region, index) => {
    const points = Array.isArray(region.points) ? region.points : []
    const xs = points.map(point => point.x * MAP_W)
    const ys = points.map(point => point.y * MAP_H)
    const left = xs.length ? Math.min(...xs) : (region.cx || 0.5) * MAP_W - 180
    const right = xs.length ? Math.max(...xs) : (region.cx || 0.5) * MAP_W + 180
    const top = ys.length ? Math.min(...ys) : (region.cy || 0.5) * MAP_H - 120
    const bottom = ys.length ? Math.max(...ys) : (region.cy || 0.5) * MAP_H + 120
    migrated.push(normalizeObject({
      id: region.id,
      type: 'region',
      x: (left + right) / 2,
      y: (top + bottom) / 2,
      width: Math.max(80, right - left),
      height: Math.max(60, bottom - top),
      zIndex: region.objectOrder ?? index + 200,
      metadata: {
        name: region.name || 'Region',
        text: region.name || '',
        fill: region.fill || LAND_FILL,
        stroke: region.color || LAND_STROKE,
        locationId: region.locationId,
        layerId: region.layerId || DEFAULT_OBJECT_LAYER_ID,
      },
    }, migrated.length))
  })
  ;(map?.mapStamps || []).forEach((stamp, index) => {
    migrated.push(normalizeObject({
      id: stamp.id,
      type: 'marker',
      x: stamp.mapX || MAP_W / 2,
      y: stamp.mapY || MAP_H / 2,
      width: stamp.size || 72,
      height: stamp.size || 72,
      zIndex: stamp.objectOrder ?? index + 300,
      metadata: {
        name: stamp.stampType || 'Stamp',
        text: stamp.stampType || '',
        fill: '#c79b5d',
        stroke: '#312719',
        stampType: stamp.stampType,
        layerId: stamp.layerId || DEFAULT_OBJECT_LAYER_ID,
      },
    }, migrated.length))
  })
  return migrated
}

function normalizeMapSchema(map) {
  const rawObjects = Array.isArray(map?.objects)
    ? map.objects
    : Array.isArray(map?.mapObjects)
      ? map.mapObjects
      : migrateLegacyObjects(map)
  const objects = rawObjects.map(normalizeObject).sort((a, b) => a.zIndex - b.zIndex)
  const rawLayers = Array.isArray(map?.layers) && map.layers.length
    ? map.layers
    : Array.isArray(map?.mapLayers) && map.mapLayers.length
      ? map.mapLayers
      : []
  const layers = rawLayers.length
    ? rawLayers.map((layer, index) => ({
        id: layer.id || uid('layer'),
        name: layer.name || `Layer ${index + 1}`,
        visible: layer.visible !== false,
        locked: Boolean(layer.locked),
        zIndex: Number.isFinite(layer.zIndex) ? layer.zIndex : index,
      }))
    : defaultLayers()
  return {
    version: SCHEMA_VERSION,
    width: Number.isFinite(map?.width) ? map.width : MAP_W,
    height: Number.isFinite(map?.height) ? map.height : MAP_H,
    objects,
    layers,
    metadata: { ...(map?.metadata || {}), migratedFromTerrain: Boolean(rawObjects.length && !map?.objects && !map?.mapObjects) },
  }
}

function exportPayload(map, schema) {
  return {
    schema: 'yow.object-map',
    version: SCHEMA_VERSION,
    id: map?.id,
    name: map?.name || 'Untitled Map',
    width: schema.width,
    height: schema.height,
    objects: schema.objects,
    layers: schema.layers,
    metadata: schema.metadata || {},
  }
}

function screenToMap(clientX, clientY, viewport, view) {
  const rect = viewport.getBoundingClientRect()
  return {
    x: (clientX - rect.left - view.pan.x) / view.zoom,
    y: (clientY - rect.top - view.pan.y) / view.zoom,
  }
}

function toLocal(point, object) {
  const angle = -(object.rotation || 0) * Math.PI / 180
  const dx = point.x - object.x
  const dy = point.y - object.y
  return {
    x: dx * Math.cos(angle) - dy * Math.sin(angle),
    y: dx * Math.sin(angle) + dy * Math.cos(angle),
  }
}

function localToMap(point, object) {
  const angle = (object.rotation || 0) * Math.PI / 180
  return {
    x: object.x + point.x * Math.cos(angle) - point.y * Math.sin(angle),
    y: object.y + point.x * Math.sin(angle) + point.y * Math.cos(angle),
  }
}

function normalizedToLocal(point, object) {
  return {
    x: point.x * object.width,
    y: point.y * object.height,
  }
}

function localToNormalized(point, object) {
  return {
    x: clamp(point.x / Math.max(1, object.width), -1.5, 1.5),
    y: clamp(point.y / Math.max(1, object.height), -1.5, 1.5),
  }
}

function objectPointToMap(point, object) {
  return localToMap(normalizedToLocal(point, object), object)
}

function pointsToObject(points, type, index, options = {}) {
  const xs = points.map(point => point.x)
  const ys = points.map(point => point.y)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const top = Math.min(...ys)
  const bottom = Math.max(...ys)
  const width = Math.max(MIN_SIZE, right - left)
  const height = Math.max(MIN_SIZE, bottom - top)
  const x = (left + right) / 2
  const y = (top + bottom) / 2
  const base = createObject(type, index)
  return normalizeObject({
    ...base,
    x,
    y,
    width,
    height,
    metadata: {
      ...base.metadata,
      ...options,
      points: points.map(point => ({
        x: clamp((point.x - x) / width, -1.5, 1.5),
        y: clamp((point.y - y) / height, -1.5, 1.5),
      })),
    },
  }, index)
}

function shapeFromRect(start, end, shapeKind, index) {
  const left = Math.min(start.x, end.x)
  const right = Math.max(start.x, end.x)
  const top = Math.min(start.y, end.y)
  const bottom = Math.max(start.y, end.y)
  const base = createObject('shape', index)
  return normalizeObject({
    ...base,
    x: (left + right) / 2,
    y: (top + bottom) / 2,
    width: Math.max(MIN_SIZE, right - left),
    height: Math.max(MIN_SIZE, bottom - top),
    metadata: {
      ...base.metadata,
      name: shapeKind === 'circle' ? 'Circle' : 'Rectangle',
      text: '',
      fill: LAND_FILL,
      stroke: LAND_STROKE,
      shapeKind,
    },
  }, index)
}

function objectContainsPoint(object, point) {
  if (object.visible === false) return false
  const local = toLocal(point, object)
  const meta = object.metadata || {}
  if (LINE_OBJECT_TYPES.has(object.type) && Array.isArray(meta.points)) {
    const thickness = Math.max(12, (meta.lineThickness || 6) + 10)
    for (let index = 1; index < meta.points.length; index += 1) {
      const a = normalizedToLocal(meta.points[index - 1], object)
      const b = normalizedToLocal(meta.points[index], object)
      if (distanceToSegment(local, a, b) <= thickness) return true
    }
    return false
  }
  if ((object.type === 'region' || meta.shapeKind === 'polygon') && objectLocalFaces(object).length) {
    return objectLocalFaces(object).some(face => pointInPolygon(local, face))
  }
  if (object.type === 'shape' && meta.shapeKind === 'circle') {
    const rx = object.width / 2
    const ry = object.height / 2
    return (local.x * local.x) / Math.max(1, rx * rx) + (local.y * local.y) / Math.max(1, ry * ry) <= 1
  }
  return Math.abs(local.x) <= object.width / 2 && Math.abs(local.y) <= object.height / 2
}

function distanceToSegment(point, a, b) {
  const vx = b.x - a.x
  const vy = b.y - a.y
  const wx = point.x - a.x
  const wy = point.y - a.y
  const lenSq = vx * vx + vy * vy || 1
  const t = clamp((wx * vx + wy * vy) / lenSq, 0, 1)
  const px = a.x + vx * t
  const py = a.y + vy * t
  return Math.hypot(point.x - px, point.y - py)
}

function pointInPolygon(local, points) {
  let inside = false
  for (let index = 0, prev = points.length - 1; index < points.length; prev = index, index += 1) {
    const a = points[index]
    const b = points[prev]
    const crosses = (a.y > local.y) !== (b.y > local.y)
      && local.x < ((b.x - a.x) * (local.y - a.y)) / Math.max(0.0001, b.y - a.y) + a.x
    if (crosses) inside = !inside
  }
  return inside
}

function objectCorners(object) {
  const angle = (object.rotation || 0) * Math.PI / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [
    { x: -object.width / 2, y: -object.height / 2 },
    { x: object.width / 2, y: -object.height / 2 },
    { x: object.width / 2, y: object.height / 2 },
    { x: -object.width / 2, y: object.height / 2 },
  ].map(point => ({
    x: object.x + point.x * cos - point.y * sin,
    y: object.y + point.x * sin + point.y * cos,
  }))
}

function isLandObject(object) {
  const kind = object?.metadata?.shapeKind
  return object?.type === 'region' || object?.type === 'shape' || kind === 'polygon'
}

function objectWorldFaces(object) {
  const faces = objectLocalFaces(object)
  if (faces.length) {
    return faces.map(face => face.map(point => localToMap(point, object)))
  }
  return [objectCorners(object)]
}

function faceBounds(face) {
  return {
    left: Math.min(...face.map(point => point.x)),
    right: Math.max(...face.map(point => point.x)),
    top: Math.min(...face.map(point => point.y)),
    bottom: Math.max(...face.map(point => point.y)),
  }
}

function boundsOverlap(a, b) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top
}

function objectsOverlap(a, b) {
  const facesA = objectWorldFaces(a)
  const facesB = objectWorldFaces(b)
  return facesA.some(faceA => {
    const boundsA = faceBounds(faceA)
    return facesB.some(faceB => boundsOverlap(boundsA, faceBounds(faceB)))
  })
}

function mergeLandObjectIntoList(current, object) {
  if (!isLandObject(object)) return { objects: [...current, object], selectedId: object.id }
  const overlapping = current.filter(item => isLandObject(item) && !item.locked && objectsOverlap(item, object))
  if (!overlapping.length) return { objects: [...current, object], selectedId: object.id }

  const target = overlapping[0]
  const absorbedIds = new Set(overlapping.slice(1).map(item => item.id))
  const worldFaces = [
    ...objectWorldFaces(target),
    ...objectWorldFaces(object),
    ...overlapping.slice(1).flatMap(item => objectWorldFaces(item)),
  ]
  const bounds = faceBounds(worldFaces.flat())
  const mergedWidth = Math.max(MIN_SIZE, bounds.right - bounds.left)
  const mergedHeight = Math.max(MIN_SIZE, bounds.bottom - bounds.top)
  const mergedBase = {
    ...target,
    x: (bounds.left + bounds.right) / 2,
    y: (bounds.top + bounds.bottom) / 2,
    width: mergedWidth,
    height: mergedHeight,
    rotation: 0,
  }
  const normalizedFaces = worldFaces.map(face => face.map(point => localToNormalized(toLocal(point, mergedBase), mergedBase)))
  const mergedTarget = {
    ...mergedBase,
    metadata: {
      ...target.metadata,
      fill: target.metadata?.fill || LAND_FILL,
      stroke: target.metadata?.stroke || LAND_STROKE,
      points: normalizedFaces[0],
      faces: normalizedFaces.slice(1),
    },
  }

  return {
    objects: current
      .filter(item => !absorbedIds.has(item.id))
      .map(item => item.id === target.id ? mergedTarget : item),
    selectedId: target.id,
  }
}

function selectionBounds(objects) {
  if (!objects.length) return null
  const points = objects.flatMap(objectCorners)
  const left = Math.min(...points.map(point => point.x))
  const right = Math.max(...points.map(point => point.x))
  const top = Math.min(...points.map(point => point.y))
  const bottom = Math.max(...points.map(point => point.y))
  return {
    x: (left + right) / 2,
    y: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
    rotation: objects.length === 1 ? objects[0].rotation : 0,
  }
}

function drawGrid(ctx, width, height) {
  ctx.save()
  const paper = ctx.createLinearGradient(0, 0, width, height)
  paper.addColorStop(0, '#f3e8cc')
  paper.addColorStop(0.46, '#e8d7af')
  paper.addColorStop(1, '#d7bd86')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.24
  for (let index = 0; index < 520; index += 1) {
    const seed = index * 97
    const x = seededNoise(seed, 1) * width
    const y = seededNoise(seed, 2) * height
    const r = 1 + seededNoise(seed, 3) * 5
    ctx.fillStyle = seededNoise(seed, 4) > 0.5 ? '#8b6a36' : '#fff7df'
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
  ctx.strokeStyle = 'rgba(73, 59, 38, 0.08)'
  ctx.lineWidth = 1
  for (let x = 0; x <= width; x += 80) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y <= height; y += 80) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.15, width / 2, height / 2, width * 0.7)
  vignette.addColorStop(0, 'rgba(255,255,255,0)')
  vignette.addColorStop(1, 'rgba(88,58,24,0.22)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)
  ctx.restore()
}

function drawObject(ctx, object, selected) {
  if (object.visible === false) return
  const meta = object.metadata || {}
  const type = OBJECT_TYPES[object.type] || OBJECT_TYPES.region

  ctx.save()
  ctx.translate(object.x, object.y)
  ctx.rotate((object.rotation || 0) * Math.PI / 180)
  ctx.globalAlpha = (object.locked ? 0.64 : 1) * (Number.isFinite(meta.opacity) ? meta.opacity : 1)
  ctx.lineWidth = selected ? Math.max(4, meta.lineThickness || 2) : meta.lineThickness || 2
  ctx.strokeStyle = selected ? '#1677ff' : meta.stroke || type.stroke
  ctx.fillStyle = meta.fill || type.fill
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (meta.dashed) ctx.setLineDash([Math.max(8, (meta.lineThickness || 4) * 2.2), Math.max(6, (meta.lineThickness || 4) * 1.4)])

  if (object.type === 'marker') {
    drawFantasyMarker(ctx, object, selected)
  } else if (object.type === 'label') {
    drawFantasyLabel(ctx, object)
  } else if (LINE_OBJECT_TYPES.has(object.type)) {
    drawStyledLineObject(ctx, object, selected)
  } else if ((object.type === 'region' || meta.shapeKind === 'polygon') && Array.isArray(meta.points) && meta.points.length >= 3) {
    drawOrganicPolygonObject(ctx, object, selected)
  } else if (object.type === 'shape' && meta.shapeKind === 'circle') {
    drawOrganicEllipseObject(ctx, object, selected)
  } else {
    drawOrganicRectObject(ctx, object, selected)
  }
  ctx.restore()
}

function drawOrganicPolygonObject(ctx, object, selected) {
  const meta = object.metadata || {}
  const seed = hashString(object.id)
  const faces = objectLocalFaces(object)
  if (!faces.length) return
  const organicFaces = faces.map((face, faceIndex) => organicPoints(face, seed + faceIndex * 1009, {
    closed: true,
    amplitude: Math.min(34, Math.max(10, Math.min(object.width, object.height) * 0.045)),
    spacing: Math.max(22, Math.min(62, Math.min(object.width, object.height) * 0.08)),
  }))
  const fill = meta.fill || OBJECT_TYPES[object.type]?.fill || LAND_FILL
  const stroke = selected ? '#1677ff' : meta.stroke || '#5e4a28'

  ctx.save()
  organicFaces.forEach(points => drawSmoothPath(ctx, points, true))
  if (fill !== 'transparent') {
    const radius = Math.max(object.width, object.height) * 0.62
    const gradient = ctx.createRadialGradient(0, 0, Math.max(12, radius * 0.08), 0, 0, radius)
    gradient.addColorStop(0, colorWithAlpha(fill, 0.92))
    gradient.addColorStop(0.42, colorWithAlpha(fill, 0.72))
    gradient.addColorStop(0.78, colorWithAlpha('#5d6f3d', 0.36))
    gradient.addColorStop(1, colorWithAlpha('#d5c391', 0.18))
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.save()
    organicFaces.forEach(points => drawSmoothPath(ctx, points, true))
    ctx.clip()
    drawInteriorTexture(ctx, object, seed)
    ctx.restore()
  }

  ctx.strokeStyle = colorWithAlpha(stroke, selected ? 1 : 0.88)
  ctx.lineWidth = selected ? Math.max(4, meta.lineThickness || 2) : Math.max(2, meta.lineThickness || 2)
  ctx.setLineDash([])
  organicFaces.forEach(points => drawSmoothPath(ctx, points, true))
  ctx.stroke()
  ctx.strokeStyle = colorWithAlpha('#3a2b17', selected ? 0.15 : 0.32)
  ctx.lineWidth = Math.max(1, (meta.lineThickness || 2) * 0.65)
  for (let pass = 0; pass < 2; pass += 1) {
    faces.forEach((face, faceIndex) => {
      const sketch = organicPoints(face, seed + faceIndex * 1009 + pass * 77, { closed: true, amplitude: 6 + pass * 3, spacing: 38 })
      drawSmoothPath(ctx, sketch, true)
    })
    ctx.stroke()
  }
  ctx.restore()
}

function drawOrganicEllipseObject(ctx, object, selected) {
  const seed = hashString(object.id)
  const points = Array.from({ length: 34 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 34
    const jitter = 1 + (seededNoise(seed, index) - 0.5) * 0.11
    return { x: Math.cos(angle) * object.width * 0.5 * jitter, y: Math.sin(angle) * object.height * 0.5 * jitter }
  })
  drawOrganicPolygonObject(ctx, { ...object, metadata: { ...object.metadata, points: points.map(point => localToNormalized(point, object)), shapeKind: 'polygon' } }, selected)
}

function drawOrganicRectObject(ctx, object, selected) {
  const points = [
    { x: -object.width / 2, y: -object.height / 2 },
    { x: object.width / 2, y: -object.height / 2 },
    { x: object.width / 2, y: object.height / 2 },
    { x: -object.width / 2, y: object.height / 2 },
  ]
  drawOrganicPolygonObject(ctx, { ...object, metadata: { ...object.metadata, points: points.map(point => localToNormalized(point, object)), shapeKind: 'polygon' } }, selected)
}

function drawInteriorTexture(ctx, object, seed) {
  const count = Math.max(18, Math.min(120, Math.round((object.width * object.height) / 9000)))
  ctx.save()
  for (let index = 0; index < count; index += 1) {
    const x = (seededNoise(seed, index + 11) - 0.5) * object.width
    const y = (seededNoise(seed, index + 31) - 0.5) * object.height
    const len = 12 + seededNoise(seed, index + 51) * 36
    const centerFalloff = clamp(1 - Math.hypot(x / Math.max(1, object.width / 2), y / Math.max(1, object.height / 2)), 0, 1)
    const saturation = 0.04 + centerFalloff * centerFalloff * 0.2
    ctx.strokeStyle = seededNoise(seed, index + 71) > 0.5 ? `rgba(13,55,25,${saturation})` : `rgba(184,196,126,${saturation * 0.65})`
    ctx.lineWidth = 0.8 + centerFalloff * 1.4
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + len, y + (seededNoise(seed, index + 91) - 0.5) * 8)
    ctx.stroke()
  }
  const centerGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, Math.max(object.width, object.height) * 0.56)
  centerGlow.addColorStop(0, 'rgba(20,86,39,0.26)')
  centerGlow.addColorStop(0.55, 'rgba(20,86,39,0.08)')
  centerGlow.addColorStop(1, 'rgba(224,205,154,0.12)')
  ctx.fillStyle = centerGlow
  ctx.fillRect(-object.width, -object.height, object.width * 2, object.height * 2)
  ctx.restore()
}

function drawStyledLineObject(ctx, object, selected) {
  const meta = object.metadata || {}
  const seed = hashString(object.id)
  const basePoints = objectLocalPoints(object)
  if (basePoints.length < 2) return
  const points = organicPoints(basePoints, seed, {
    closed: false,
    amplitude: object.type === 'river' ? 14 : 7,
    spacing: object.type === 'river' ? 42 : 34,
  })
  const stroke = selected ? '#1677ff' : meta.stroke || OBJECT_TYPES[object.type]?.stroke || '#4a2e18'
  const thickness = Math.max(1, meta.lineThickness || 6)

  ctx.save()
  ctx.setLineDash([])
  if (object.type === 'river') {
    drawTaperedPath(ctx, points, thickness, colorWithAlpha('#183d55', 0.22), seed, 2.4)
    drawTaperedPath(ctx, points, thickness, colorWithAlpha(stroke, selected ? 0.95 : 0.72), seed, 1.35)
    drawTaperedPath(ctx, points, thickness * 0.38, colorWithAlpha('#d9f4ff', selected ? 0.5 : 0.32), seed, 0.8)
  } else {
    ctx.strokeStyle = colorWithAlpha('#2c1d11', selected ? 0.42 : 0.22)
    ctx.lineWidth = thickness + 3
    if (meta.dashed || object.type === 'border') ctx.setLineDash([thickness * 2.8, thickness * 1.7])
    drawSmoothPath(ctx, points, false)
    ctx.stroke()
    ctx.strokeStyle = colorWithAlpha(stroke, selected ? 1 : 0.8)
    ctx.lineWidth = thickness
    ctx.setLineDash(meta.dashed || object.type === 'border' ? [thickness * 2.5, thickness * 1.6] : [])
    drawSmoothPath(ctx, points, false)
    ctx.stroke()
    if (object.type === 'road') {
      ctx.strokeStyle = colorWithAlpha('#f3ddb5', 0.35)
      ctx.lineWidth = Math.max(1, thickness * 0.32)
      ctx.setLineDash([])
      drawSmoothPath(ctx, points, false)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawTaperedPath(ctx, points, baseWidth, stroke, seed, scale = 1) {
  ctx.save()
  ctx.strokeStyle = stroke
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (let index = 1; index < points.length; index += 1) {
    const t = index / Math.max(1, points.length - 1)
    const taper = 0.54 + Math.sin(t * Math.PI) * 0.64
    const variation = 0.86 + seededNoise(seed, index + 300) * 0.28
    ctx.lineWidth = Math.max(1, baseWidth * taper * variation * scale)
    ctx.beginPath()
    ctx.moveTo(points[index - 1].x, points[index - 1].y)
    const mid = { x: (points[index - 1].x + points[index].x) / 2, y: (points[index - 1].y + points[index].y) / 2 }
    ctx.quadraticCurveTo(mid.x, mid.y, points[index].x, points[index].y)
    ctx.stroke()
  }
  ctx.restore()
}

function drawFantasyMarker(ctx, object, selected) {
  const meta = object.metadata || {}
  const seed = hashString(object.id)
  const radius = Math.min(object.width, object.height) / 2
  const name = String(meta.stampType || meta.text || meta.name || '').toLowerCase()
  ctx.save()
  ctx.strokeStyle = selected ? '#1677ff' : colorWithAlpha(meta.stroke || '#3a2a16', 0.86)
  ctx.fillStyle = colorWithAlpha(meta.fill || '#8f6a33', 0.72)
  ctx.lineWidth = Math.max(2, radius * 0.08)

  if (name.includes('forest') || name.includes('tree')) {
    const count = 5 + Math.floor(seededNoise(seed, 1) * 5)
    for (let index = 0; index < count; index += 1) {
      const x = (seededNoise(seed, index + 10) - 0.5) * radius * 1.25
      const y = (seededNoise(seed, index + 20) - 0.5) * radius * 1.05
      const h = radius * (0.52 + seededNoise(seed, index + 30) * 0.34)
      ctx.beginPath()
      ctx.moveTo(x, y - h * 0.55)
      ctx.lineTo(x - h * 0.34, y + h * 0.35)
      ctx.lineTo(x + h * 0.34, y + h * 0.35)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  } else if (name.includes('mount') || name.includes('peak')) {
    const count = 3 + Math.floor(seededNoise(seed, 2) * 3)
    for (let index = 0; index < count; index += 1) {
      const x = (index - (count - 1) / 2) * radius * 0.38
      const h = radius * (0.82 + seededNoise(seed, index + 40) * 0.46)
      ctx.beginPath()
      ctx.moveTo(x, -h * 0.62)
      ctx.lineTo(x - h * 0.45, h * 0.48)
      ctx.lineTo(x + h * 0.5, h * 0.48)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.strokeStyle = colorWithAlpha('#fff6db', 0.56)
      ctx.beginPath()
      ctx.moveTo(x, -h * 0.52)
      ctx.lineTo(x - h * 0.12, -h * 0.12)
      ctx.lineTo(x + h * 0.11, -h * 0.16)
      ctx.stroke()
      ctx.strokeStyle = selected ? '#1677ff' : colorWithAlpha(meta.stroke || '#3a2a16', 0.86)
    }
  } else {
    ctx.beginPath()
    ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#fff8dc'
    ctx.font = `700 ${Math.max(18, radius * 0.62)}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((meta.text || meta.name || '•').slice(0, 2), 0, 1)
  }
  ctx.restore()
}

function drawFantasyLabel(ctx, object) {
  const meta = object.metadata || {}
  const text = meta.text || meta.name || 'Label'
  const size = Math.max(20, Math.min(72, object.height * 0.45))
  const curve = Math.min(18, object.width * 0.05)
  ctx.save()
  ctx.font = `700 ${size}px Georgia, serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  const measuredWidth = Math.max(1, ctx.measureText(text).width)
  const scale = Math.min(1, Math.max(0.34, (object.width - 12) / measuredWidth))
  ctx.scale(scale, 1)
  const totalWidth = measuredWidth
  let cursor = -totalWidth / 2
  ;[...text].forEach((char, index, chars) => {
    const charWidth = ctx.measureText(char).width
    const x = cursor + charWidth / 2
    const t = chars.length <= 1 ? 0.5 : index / (chars.length - 1)
    const y = Math.sin((t - 0.5) * Math.PI) * curve
    const angle = Math.cos((t - 0.5) * Math.PI) * 0.08
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    ctx.strokeStyle = colorWithAlpha(meta.stroke || '#f8edd0', 0.78)
    ctx.lineWidth = Math.max(4, size * 0.14)
    ctx.strokeText(char, 0, 0)
    ctx.fillStyle = colorWithAlpha(meta.fill || '#2a241b', 0.92)
    ctx.fillText(char, 0, 0)
    ctx.restore()
    cursor += charWidth
  })
  ctx.restore()
}

function drawSelection(ctx, objects, zoom) {
  if (!objects.length) return
  const bounds = selectionBounds(objects)
  if (!bounds) return
  const handleSize = Math.max(12 / zoom, 9)
  const corners = objectCorners(bounds)

  ctx.save()
  ctx.strokeStyle = '#1677ff'
  ctx.fillStyle = '#ffffff'
  ctx.lineWidth = Math.max(1.5 / zoom, 1)
  ctx.setLineDash([8 / zoom, 5 / zoom])
  ctx.beginPath()
  corners.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y))
  ctx.closePath()
  ctx.stroke()
  ctx.setLineDash([])
  corners.forEach(point => {
    ctx.beginPath()
    ctx.rect(point.x - handleSize / 2, point.y - handleSize / 2, handleSize, handleSize)
    ctx.fill()
    ctx.stroke()
  })
  if (objects.length === 1) {
    drawPointHandles(ctx, objects[0], zoom)
    const top = corners[0]
    const topRight = corners[1]
    const rotatePoint = { x: (top.x + topRight.x) / 2, y: (top.y + topRight.y) / 2 - 46 / zoom }
    ctx.beginPath()
    ctx.moveTo((top.x + topRight.x) / 2, (top.y + topRight.y) / 2)
    ctx.lineTo(rotatePoint.x, rotatePoint.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(rotatePoint.x, rotatePoint.y, handleSize * 0.62, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

function drawPointHandles(ctx, object, zoom) {
  const points = Array.isArray(object.metadata?.points)
    ? object.metadata.points.map(point => objectPointToMap(point, object))
    : []
  const facePoints = Array.isArray(object.metadata?.faces)
    ? object.metadata.faces.flatMap(face => face.map(point => objectPointToMap(point, object)))
    : []
  const allPoints = [...points, ...facePoints]
  if (!allPoints.length) return
  const size = Math.max(12 / zoom, 8)
  ctx.save()
  ctx.setLineDash([])
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#1677ff'
  ctx.lineWidth = Math.max(1.5 / zoom, 1)
  allPoints.forEach(mapPoint => {
    ctx.beginPath()
    ctx.arc(mapPoint.x, mapPoint.y, size / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })
  ctx.restore()
}

function hitHandle(point, selectedObjects, zoom) {
  if (selectedObjects.length !== 1) return null
  const object = selectedObjects[0]
  const pointHit = hitPointHandle(point, object, zoom)
  if (pointHit) return { type: 'point', ...pointHit }
  const corners = objectCorners(object)
  const handleRadius = Math.max(16 / zoom, 10)
  const names = ['nw', 'ne', 'se', 'sw']
  for (let index = 0; index < corners.length; index += 1) {
    if (Math.hypot(point.x - corners[index].x, point.y - corners[index].y) <= handleRadius) {
      return { type: 'resize', corner: names[index] }
    }
  }
  const topMid = { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 }
  const rotatePoint = { x: topMid.x, y: topMid.y - 46 / zoom }
  if (Math.hypot(point.x - rotatePoint.x, point.y - rotatePoint.y) <= handleRadius) {
    return { type: 'rotate' }
  }
  return null
}

function hitPointHandle(point, object, zoom) {
  const radius = Math.max(16 / zoom, 10)
  const points = Array.isArray(object.metadata?.points) ? object.metadata.points : []
  const pointIndex = points.findIndex(item => {
    const mapPoint = objectPointToMap(item, object)
    return Math.hypot(point.x - mapPoint.x, point.y - mapPoint.y) <= radius
  })
  if (pointIndex >= 0) return { pointIndex }
  const faces = Array.isArray(object.metadata?.faces) ? object.metadata.faces : []
  for (let faceIndex = 0; faceIndex < faces.length; faceIndex += 1) {
    const nextPointIndex = faces[faceIndex].findIndex(item => {
      const mapPoint = objectPointToMap(item, object)
      return Math.hypot(point.x - mapPoint.x, point.y - mapPoint.y) <= radius
    })
    if (nextPointIndex >= 0) return { faceIndex, pointIndex: nextPointIndex }
  }
  return null
}

function drawDraft(ctx, draft, zoom) {
  if (!draft) return
  ctx.save()
  ctx.strokeStyle = draft.stroke || '#1677ff'
  ctx.fillStyle = draft.fill || 'rgba(22, 119, 255, 0.12)'
  ctx.lineWidth = Math.max(2 / zoom, draft.lineThickness || 2)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (draft.dashed) ctx.setLineDash([16 / zoom, 10 / zoom])
  if (draft.kind === 'shape' && draft.start && draft.end) {
    const left = Math.min(draft.start.x, draft.end.x)
    const right = Math.max(draft.start.x, draft.end.x)
    const top = Math.min(draft.start.y, draft.end.y)
    const bottom = Math.max(draft.start.y, draft.end.y)
    ctx.beginPath()
    if (draft.shapeKind === 'circle') {
      ctx.ellipse((left + right) / 2, (top + bottom) / 2, Math.max(1, (right - left) / 2), Math.max(1, (bottom - top) / 2), 0, 0, Math.PI * 2)
    } else {
      ctx.rect(left, top, right - left, bottom - top)
    }
    ctx.fill()
    ctx.stroke()
  } else if (draft.points?.length) {
    ctx.beginPath()
    draft.points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
    })
    if (draft.preview) ctx.lineTo(draft.preview.x, draft.preview.y)
    if (draft.closed && draft.points.length >= 3) {
      ctx.closePath()
      ctx.fill()
    }
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#ffffff'
    draft.points.forEach(point => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, Math.max(5 / zoom, 4), 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })
  }
  ctx.restore()
}

export default function MapBuilder({ store }) {
  const {
    mapProject: project,
    addMap,
    selectMap,
    deleteMap,
    renameMap,
    updateActiveMapData,
  } = store

  const activeMap = project?.maps?.find(map => map.id === project?.activeMapId) || null
  const canvasRef = useRef(null)
  const viewportRef = useRef(null)
  const fileInputRef = useRef(null)
  const frameRef = useRef(null)
  const interactionRef = useRef(null)
  const draftRef = useRef(null)
  const viewRef = useRef({ zoom: DEFAULT_ZOOM, pan: { x: 80, y: 80 } })
  const objectsRef = useRef([])
  const selectedIdsRef = useRef([])

  const [mode, setMode] = useState('select')
  const [view, setView] = useState(viewRef.current)
  const [selectedIds, setSelectedIds] = useState([])
  const [newMapName, setNewMapName] = useState('')
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [jsonStatus, setJsonStatus] = useState('')
  const [isCompact, setIsCompact] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 920 : false)
  const [draft, setDraft] = useState(null)
  const [shapeKind, setShapeKind] = useState('rectangle')
  const [lineThickness, setLineThickness] = useState(8)
  const [dashedLines, setDashedLines] = useState(false)

  const schema = useMemo(() => normalizeMapSchema(activeMap), [activeMap])
  const objects = schema.objects
  const visibleObjects = useMemo(() => {
    const visibleLayers = new Set(schema.layers.filter(layer => layer.visible !== false).map(layer => layer.id))
    return objects
      .filter(object => object.visible !== false && visibleLayers.has(object.metadata?.layerId || DEFAULT_OBJECT_LAYER_ID))
      .sort((a, b) => a.zIndex - b.zIndex)
  }, [objects, schema.layers])
  const selectedObjects = objects.filter(object => selectedIds.includes(object.id))
  const primarySelection = selectedObjects[0] || null

  useEffect(() => {
    objectsRef.current = objects
    selectedIdsRef.current = selectedIds
  }, [objects, selectedIds])

  useEffect(() => {
    draftRef.current = draft
    requestRender()
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    viewRef.current = view
    requestRender()
  }, [view]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    requestRender()
  }, [visibleObjects, selectedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeMap) return
    const current = normalizeMapSchema(activeMap)
    if (activeMap.schemaVersion === SCHEMA_VERSION && Array.isArray(activeMap.mapObjects)) return
    updateActiveMapData(() => ({
      schemaVersion: SCHEMA_VERSION,
      width: current.width,
      height: current.height,
      mapObjects: current.objects,
      mapLayers: current.layers,
      mapPins: [],
      mapRegions: [],
      mapLabels: [],
      mapStamps: [],
    }))
  }, [activeMap, updateActiveMapData])

  useEffect(() => {
    setSelectedIds(current => current.filter(id => objects.some(object => object.id === id)))
  }, [objects])

  useEffect(() => {
    const onKeyDown = event => {
      const target = event.target
      const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      if (typing) return
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIdsRef.current.length) {
        event.preventDefault()
        deleteSelectedObjects()
      }
      if (event.key === 'Enter' && draftRef.current?.points?.length) {
        event.preventDefault()
        completeDraft()
      }
      if (event.key === 'Escape' && draftRef.current) {
        event.preventDefault()
        setDraft(null)
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        setSelectedIds(objectsRef.current.filter(object => !object.locked).map(object => object.id))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const resize = () => {
      setIsCompact(window.innerWidth < 920)
      fitCanvasToViewport(false)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [activeMap]) // eslint-disable-line react-hooks/exhaustive-deps

  const persistObjects = useCallback((nextObjects, extra = {}) => {
    updateActiveMapData(() => ({
      ...extra,
      schemaVersion: SCHEMA_VERSION,
      width: schema.width,
      height: schema.height,
      mapObjects: nextObjects.map(normalizeObject),
      mapLayers: schema.layers,
    }))
  }, [schema.height, schema.layers, schema.width, updateActiveMapData])

  const updateObjects = useCallback((updater, extra) => {
    const next = typeof updater === 'function' ? updater(objectsRef.current) : updater
    persistObjects(next, extra)
  }, [persistObjects])

  function requestRender() {
    if (frameRef.current) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      renderCanvas()
    })
  }

  function renderCanvas() {
    const canvas = canvasRef.current
    const viewport = viewportRef.current
    if (!canvas || !viewport) return
    const rect = viewport.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const width = Math.max(1, Math.floor(rect.width * dpr))
    const height = Math.max(1, Math.floor(rect.height * dpr))
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)
    ctx.fillStyle = '#2d3136'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.save()
    ctx.translate(viewRef.current.pan.x, viewRef.current.pan.y)
    ctx.scale(viewRef.current.zoom, viewRef.current.zoom)
    ctx.shadowColor = 'rgba(0,0,0,.26)'
    ctx.shadowBlur = 38 / viewRef.current.zoom
    ctx.shadowOffsetY = 14 / viewRef.current.zoom
    drawGrid(ctx, MAP_W, MAP_H)
    ctx.shadowColor = 'transparent'
    visibleObjects.forEach(object => drawObject(ctx, object, selectedIdsRef.current.includes(object.id)))
    drawDraft(ctx, draftRef.current, viewRef.current.zoom)
    drawSelection(ctx, objectsRef.current.filter(object => selectedIdsRef.current.includes(object.id)), viewRef.current.zoom)
    ctx.restore()
  }

  function fitCanvasToViewport(animate = true) {
    const viewport = viewportRef.current
    if (!viewport) return
    const rect = viewport.getBoundingClientRect()
    const zoom = Math.min((rect.width - 96) / MAP_W, (rect.height - 96) / MAP_H, 1)
    const nextView = {
      zoom: clamp(zoom || DEFAULT_ZOOM, 0.12, 2.5),
      pan: {
        x: (rect.width - MAP_W * clamp(zoom || DEFAULT_ZOOM, 0.12, 2.5)) / 2,
        y: (rect.height - MAP_H * clamp(zoom || DEFAULT_ZOOM, 0.12, 2.5)) / 2,
      },
    }
    setView(nextView)
    if (!animate) viewRef.current = nextView
  }

  function zoomAt(clientX, clientY, factor) {
    const viewport = viewportRef.current
    if (!viewport) return
    const rect = viewport.getBoundingClientRect()
    const current = viewRef.current
    const nextZoom = clamp(current.zoom * factor, 0.12, 2.5)
    const sx = clientX - rect.left
    const sy = clientY - rect.top
    const mapX = (sx - current.pan.x) / current.zoom
    const mapY = (sy - current.pan.y) / current.zoom
    setView({
      zoom: nextZoom,
      pan: { x: sx - mapX * nextZoom, y: sy - mapY * nextZoom },
    })
  }

  function hitTest(point) {
    for (let index = visibleObjects.length - 1; index >= 0; index -= 1) {
      const object = visibleObjects[index]
      if (objectContainsPoint(object, point)) return object
    }
    return null
  }

  function handlePointerDown(event) {
    if (!activeMap || event.button !== 0) return
    const viewport = viewportRef.current
    const point = screenToMap(event.clientX, event.clientY, viewport, viewRef.current)
    const selected = objectsRef.current.filter(object => selectedIdsRef.current.includes(object.id))
    const handle = hitHandle(point, selected, viewRef.current.zoom)
    const hit = hitTest(point)
    event.currentTarget.setPointerCapture(event.pointerId)

    if (mode === 'pan' || event.altKey || event.spaceKey) {
      interactionRef.current = { type: 'pan', startX: event.clientX, startY: event.clientY, startPan: viewRef.current.pan }
      return
    }
    if (mode === 'zoom') {
      zoomAt(event.clientX, event.clientY, event.shiftKey ? 0.78 : 1.22)
      return
    }
    if (POINT_DRAW_TOOLS.has(mode)) {
      startOrExtendPointDraft(point, mode, event.detail >= 2)
      return
    }
    if (mode === 'shape' && shapeKind === 'polygon') {
      startOrExtendPointDraft(point, 'shapePolygon', event.detail >= 2)
      return
    }
    if (mode === 'shape') {
      interactionRef.current = {
        type: 'shape',
        startPoint: point,
        shapeKind,
      }
      setDraft({
        kind: 'shape',
        start: point,
        end: point,
        shapeKind,
        fill: LAND_FILL,
        stroke: LAND_STROKE,
      })
      return
    }
    if (handle?.type === 'rotate') {
      const object = selected[0]
      interactionRef.current = {
        type: 'rotate',
        id: object.id,
        startRotation: object.rotation || 0,
        center: { x: object.x, y: object.y },
        startAngle: Math.atan2(point.y - object.y, point.x - object.x),
      }
      return
    }
    if (handle?.type === 'resize') {
      const object = selected[0]
      interactionRef.current = {
        type: 'resize',
        id: object.id,
        startObject: object,
        corner: handle.corner,
      }
      return
    }
    if (handle?.type === 'point') {
      const object = selected[0]
      interactionRef.current = {
        type: 'point',
        id: object.id,
        pointIndex: handle.pointIndex,
        faceIndex: handle.faceIndex,
        startObject: object,
      }
      return
    }
    if (hit && !hit.locked) {
      const additive = event.shiftKey || event.metaKey || event.ctrlKey
      const nextSelected = additive
        ? selectedIdsRef.current.includes(hit.id)
          ? selectedIdsRef.current.filter(id => id !== hit.id)
          : [...selectedIdsRef.current, hit.id]
        : selectedIdsRef.current.includes(hit.id)
          ? selectedIdsRef.current
          : [hit.id]
      setSelectedIds(nextSelected)
      interactionRef.current = {
        type: 'drag',
        startPoint: point,
        startObjects: objectsRef.current
          .filter(object => nextSelected.includes(object.id))
          .map(object => ({ id: object.id, x: object.x, y: object.y })),
      }
      return
    }
    if (!event.shiftKey) setSelectedIds([])
  }

  function handlePointerMove(event) {
    const interaction = interactionRef.current
    if (!interaction) {
      if (draftRef.current?.points?.length && (POINT_DRAW_TOOLS.has(mode) || draftRef.current.kind === 'shapePolygon')) {
        const point = screenToMap(event.clientX, event.clientY, viewportRef.current, viewRef.current)
        setDraft(current => current ? { ...current, preview: point } : current)
      }
      return
    }
    if (interaction.type === 'pan') {
      setView(current => ({
        ...current,
        pan: {
          x: interaction.startPan.x + event.clientX - interaction.startX,
          y: interaction.startPan.y + event.clientY - interaction.startY,
        },
      }))
      return
    }
    const point = screenToMap(event.clientX, event.clientY, viewportRef.current, viewRef.current)
    if (interaction.type === 'drag') {
      const dx = point.x - interaction.startPoint.x
      const dy = point.y - interaction.startPoint.y
      updateObjects(current => current.map(object => {
        const start = interaction.startObjects.find(item => item.id === object.id)
        return start ? { ...object, x: start.x + dx, y: start.y + dy } : object
      }))
      return
    }
    if (interaction.type === 'resize') {
      updateObjects(current => current.map(object => {
        if (object.id !== interaction.id || object.locked) return object
        const start = interaction.startObject
        const local = toLocal(point, start)
        const directionX = interaction.corner.includes('e') ? 1 : -1
        const directionY = interaction.corner.includes('s') ? 1 : -1
        return {
          ...object,
          width: Math.max(MIN_SIZE, Math.abs(local.x * 2 * directionX)),
          height: Math.max(MIN_SIZE, Math.abs(local.y * 2 * directionY)),
        }
      }))
      return
    }
    if (interaction.type === 'point') {
      updateObjects(current => current.map(object => {
        if (object.id !== interaction.id || object.locked) return object
        const local = toLocal(point, object)
        if (Number.isFinite(interaction.faceIndex)) {
          const faces = (object.metadata?.faces || []).map(face => [...face])
          faces[interaction.faceIndex][interaction.pointIndex] = localToNormalized(local, object)
          return { ...object, metadata: { ...object.metadata, faces } }
        }
        const points = [...(object.metadata?.points || [])]
        points[interaction.pointIndex] = localToNormalized(local, object)
        return { ...object, metadata: { ...object.metadata, points } }
      }))
      return
    }
    if (interaction.type === 'shape') {
      setDraft(current => current ? { ...current, end: point } : current)
      return
    }
    if (interaction.type === 'rotate') {
      const angle = Math.atan2(point.y - interaction.center.y, point.x - interaction.center.x)
      const delta = (angle - interaction.startAngle) * 180 / Math.PI
      updateObjects(current => current.map(object => {
        if (object.id !== interaction.id || object.locked) return object
        return { ...object, rotation: round(interaction.startRotation + delta, 0) }
      }))
    }
  }

  function handlePointerUp(event) {
    const interaction = interactionRef.current
    if (interaction?.type === 'shape' && draftRef.current?.start && draftRef.current?.end) {
      const object = shapeFromRect(draftRef.current.start, draftRef.current.end, interaction.shapeKind, objectsRef.current.length)
      if (object.width > MIN_SIZE || object.height > MIN_SIZE) {
        let selectedId = object.id
        updateObjects(current => {
          const merged = mergeLandObjectIntoList(current, object)
          selectedId = merged.selectedId
          return merged.objects
        })
        setSelectedIds([selectedId])
      }
      setDraft(null)
    }
    interactionRef.current = null
    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }

  function handleWheel(event) {
    event.preventDefault()
    zoomAt(event.clientX, event.clientY, event.deltaY > 0 ? 0.9 : 1.1)
  }

  function startOrExtendPointDraft(point, tool, shouldComplete = false) {
    const defaults = {
      region: { closed: true, fill: LAND_FILL, stroke: LAND_STROKE, lineThickness: 3, dashed: false },
      river: { closed: false, fill: 'transparent', stroke: '#3c93b8', lineThickness, dashed: false },
      road: { closed: false, fill: 'transparent', stroke: '#8b6743', lineThickness, dashed: dashedLines },
      border: { closed: false, fill: 'transparent', stroke: '#9b5ab8', lineThickness, dashed: dashedLines },
      shapePolygon: { closed: true, fill: LAND_FILL, stroke: LAND_STROKE, lineThickness: 2, dashed: false },
    }
    setDraft(current => {
      const sameTool = current?.kind === tool
      const next = sameTool
        ? { ...current, points: shouldComplete ? current.points : [...current.points, point], preview: point }
        : { kind: tool, points: [point], preview: point, ...defaults[tool] }
      if (shouldComplete && next.points.length >= (tool === 'region' || tool === 'shapePolygon' ? 3 : 2)) {
        setTimeout(() => completeDraft(next), 0)
      }
      return next
    })
  }

  function completeDraft(source = draftRef.current) {
    if (!source?.points?.length) return
    const minPoints = source.kind === 'region' || source.kind === 'shapePolygon' ? 3 : 2
    if (source.points.length < minPoints) return
    const objectType = source.kind === 'shapePolygon' ? 'shape' : source.kind
    const object = pointsToObject(source.points, objectType, objectsRef.current.length, {
      name: source.kind === 'shapePolygon' ? 'Polygon' : OBJECT_TYPES[source.kind]?.label || 'Object',
      text: '',
      fill: source.fill,
      stroke: source.stroke,
      opacity: 1,
      lineThickness: source.lineThickness,
      dashed: source.dashed,
      shapeKind: source.kind === 'region' || source.kind === 'shapePolygon' ? 'polygon' : undefined,
    })
    let selectedId = object.id
    updateObjects(current => {
      const merged = mergeLandObjectIntoList(current, object)
      selectedId = merged.selectedId
      return merged.objects
    })
    setSelectedIds([selectedId])
    setDraft(null)
    setMode('select')
  }

  function addObject(type) {
    const object = createObject(type, objects.length)
    let selectedId = object.id
    updateObjects(current => {
      const merged = mergeLandObjectIntoList(current, object)
      selectedId = merged.selectedId
      return merged.objects
    })
    setSelectedIds([selectedId])
  }

  function deleteSelectedObjects() {
    const ids = new Set(selectedIdsRef.current)
    updateObjects(current => current.filter(object => !ids.has(object.id) || object.locked))
    setSelectedIds([])
  }

  function patchSelected(patch) {
    const ids = new Set(selectedIds)
    updateObjects(current => current.map(object => ids.has(object.id) && !object.locked
      ? {
          ...object,
          ...patch,
          metadata: patch.metadata ? { ...object.metadata, ...patch.metadata } : object.metadata,
        }
      : object))
  }

  function moveLayer(direction) {
    if (!selectedIds.length) return
    const selected = new Set(selectedIds)
    const ordered = [...objects].sort((a, b) => a.zIndex - b.zIndex)
    const min = Math.min(...ordered.map(object => object.zIndex), 0)
    const max = Math.max(...ordered.map(object => object.zIndex), 0)
    const next = objects.map(object => {
      if (!selected.has(object.id) || object.locked) return object
      if (direction === 'front') return { ...object, zIndex: max + 1 }
      if (direction === 'back') return { ...object, zIndex: min - 1 }
      return { ...object, zIndex: object.zIndex + direction }
    })
    updateObjects(next.map((object, index) => ({ ...object, zIndex: object.zIndex + index * 0.001 })))
  }

  function toggleVisibility(id) {
    updateObjects(current => current.map(object => object.id === id ? { ...object, visible: object.visible === false } : object))
  }

  function toggleLock(id) {
    updateObjects(current => current.map(object => object.id === id ? { ...object, locked: !object.locked } : object))
  }

  function handleCreateMap(event) {
    event.preventDefault()
    const id = addMap(newMapName.trim() || 'Untitled Map', 'object')
    setNewMapName('')
    setTimeout(() => {
      selectMap(id)
      fitCanvasToViewport()
    }, 0)
  }

  function selectEditorMode(nextMode) {
    setMode(nextMode)
    if (nextMode !== mode) setDraft(null)
  }

  function finishRename(map) {
    const name = renameValue.trim()
    if (name) renameMap(map.id, name)
    setRenamingId(null)
    setRenameValue('')
  }

  function downloadJson() {
    if (!activeMap) return
    const blob = new Blob([JSON.stringify(exportPayload(activeMap, schema), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(activeMap.name || 'map').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-object-map.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function importJson(file) {
    if (!file || !activeMap) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))
        const imported = normalizeMapSchema(parsed)
        updateActiveMapData(() => ({
          schemaVersion: SCHEMA_VERSION,
          width: imported.width,
          height: imported.height,
          mapObjects: imported.objects,
          mapLayers: imported.layers,
          metadata: imported.metadata,
        }))
        setSelectedIds([])
        setJsonStatus('Imported')
        setTimeout(() => setJsonStatus(''), 1800)
      } catch {
        setJsonStatus('Invalid JSON')
        setTimeout(() => setJsonStatus(''), 2200)
      }
    }
    reader.readAsText(file)
  }

  if (!project) {
    return (
      <div className="workspace-page" style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
        <div className="empty-state">Open a project to use the map builder.</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateRows: 'auto 1fr', background: 'var(--surface)', color: 'var(--text)' }}>
      <div className="studio-topbar map-builder-topbar" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderBottom: '1px solid var(--border)', minWidth: 0, flexWrap: 'wrap' }}>
        <strong style={{ fontFamily: 'var(--font-serif)', fontSize: 16, flexShrink: 0 }}>Map Builder</strong>
        <div style={{ display: 'flex', gap: 4, padding: 3, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface2)' }}>
          {TOOLBAR_MODES.map(item => (
            <button
              key={item.id}
              className="btn btn-secondary btn-sm"
              onClick={() => selectEditorMode(item.id)}
              title={item.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: 'none',
                background: mode === item.id ? 'var(--accent)' : 'transparent',
                color: mode === item.id ? '#fff' : 'var(--muted)',
              }}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: isCompact ? 0 : 'auto', flexShrink: 0, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, 0.86)} title="Zoom out">−</button>
          <span style={{ minWidth: 48, textAlign: 'center', fontSize: 12, color: 'var(--muted)' }}>{Math.round(view.zoom * 100)}%</span>
          <button className="btn btn-secondary btn-sm" onClick={() => zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1.16)} title="Zoom in">+</button>
          <button className="btn btn-secondary btn-sm" onClick={fitCanvasToViewport}>Fit</button>
          <button className="btn btn-secondary btn-sm" onClick={downloadJson}>Export JSON</button>
          <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>Import JSON</button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={event => importJson(event.target.files?.[0])} style={{ display: 'none' }} />
          {jsonStatus && <span style={{ fontSize: 12, color: jsonStatus === 'Invalid JSON' ? '#d86b70' : 'var(--accent)' }}>{jsonStatus}</span>}
        </div>
      </div>

      <div style={{ minHeight: 0, display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'minmax(152px, 190px) minmax(0, 1fr) minmax(240px, 300px)', gridTemplateRows: isCompact ? 'auto minmax(420px, 1fr) auto' : '1fr' }}>
        <aside style={{ borderRight: isCompact ? 'none' : '1px solid var(--border)', borderBottom: isCompact ? '1px solid var(--border)' : 'none', background: 'color-mix(in srgb, var(--surface) 94%, #000)', padding: 10, overflowY: 'auto', display: 'flex', flexDirection: isCompact ? 'row' : 'column', gap: 12, flexWrap: isCompact ? 'wrap' : 'nowrap' }}>
          <form onSubmit={handleCreateMap} style={{ display: 'flex', gap: 6 }}>
            <input
              value={newMapName}
              onChange={event => setNewMapName(event.target.value)}
              placeholder="New map"
              style={{ minWidth: 0, flex: 1, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', borderRadius: 7, padding: '7px 8px', fontFamily: 'inherit' }}
            />
            <button className="btn btn-primary btn-sm" type="submit">+</button>
          </form>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: isCompact ? 150 : 0 }}>
            <PanelTitle>Draw</PanelTitle>
            {['region', 'river', 'road', 'border', 'shape'].map(toolId => (
              <button
                key={toolId}
                className="btn btn-secondary btn-sm"
                onClick={() => selectEditorMode(toolId)}
                style={{ justifyContent: 'flex-start', display: 'flex', gap: 8, background: mode === toolId ? 'var(--accent)' : undefined, color: mode === toolId ? '#fff' : undefined }}
              >
                <span style={{ width: 16 }}>{TOOLBAR_MODES.find(item => item.id === toolId)?.icon}</span>
                <span>{TOOLBAR_MODES.find(item => item.id === toolId)?.label}</span>
              </button>
            ))}
            {(mode === 'river' || mode === 'road' || mode === 'border') && (
              <>
                <NumberInput label="Thickness" value={lineThickness} min={1} onChange={setLineThickness} />
                {(mode === 'road' || mode === 'border') && <CheckboxInput label="Dashed" checked={dashedLines} onChange={setDashedLines} />}
              </>
            )}
            {mode === 'shape' && (
              <SelectInput
                label="Shape"
                value={shapeKind}
                options={[
                  { value: 'rectangle', label: 'Rectangle' },
                  { value: 'circle', label: 'Circle' },
                  { value: 'polygon', label: 'Polygon' },
                ]}
                onChange={value => { setShapeKind(value); setDraft(null) }}
              />
            )}
            {draft?.points?.length ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-primary btn-sm" onClick={() => completeDraft()}>Done</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setDraft(null)}>Cancel</button>
              </div>
            ) : null}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: isCompact ? 150 : 0 }}>
            <PanelTitle>Objects</PanelTitle>
            {Object.entries(OBJECT_TYPES).map(([type, item]) => (
              <button key={type} className="btn btn-secondary btn-sm" onClick={() => addObject(type)} style={{ justifyContent: 'flex-start', display: 'flex', gap: 8 }}>
                <span style={{ width: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0, minWidth: isCompact ? 180 : 0 }}>
            <PanelTitle>Maps</PanelTitle>
            {(project.maps || []).map(map => {
              const active = map.id === project.activeMapId
              return (
                <div key={map.id} style={{ display: 'flex', gap: 3, alignItems: 'stretch' }}>
                  {renamingId === map.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={event => setRenameValue(event.target.value)}
                      onBlur={() => finishRename(map)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') finishRename(map)
                        if (event.key === 'Escape') setRenamingId(null)
                      }}
                      style={{ flex: 1, minWidth: 0, border: '1px solid var(--accent)', background: 'var(--surface2)', color: 'var(--text)', borderRadius: 7, padding: '6px 8px', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <>
                      <button
                        onClick={() => selectMap(map.id)}
                        onDoubleClick={() => { setRenamingId(map.id); setRenameValue(map.name || '') }}
                        style={{ flex: 1, minWidth: 0, padding: '7px 9px', borderRadius: 7, border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent)' : 'var(--surface2)', color: active ? '#fff' : 'var(--muted)', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {map.name || 'Untitled Map'}
                      </button>
                      {(project.maps || []).length > 1 && (
                        <button className="btn btn-secondary btn-sm" onClick={() => deleteMap(map.id)} title="Delete map">×</button>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </section>
        </aside>

        <main
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          style={{ minWidth: 0, minHeight: isCompact ? 420 : 0, position: 'relative', overflow: 'hidden', touchAction: 'none', cursor: mode === 'pan' ? 'grab' : mode === 'zoom' ? 'zoom-in' : 'default' }}
        >
          {activeMap ? (
            <>
              <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
              <div style={{ position: 'absolute', left: 14, bottom: 14, display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,.5)', color: '#fff', fontSize: 12, pointerEvents: 'none' }}>
                <span>{MAP_W} × {MAP_H}</span>
                <span>{objects.length} objects</span>
                <span>{selectedIds.length} selected</span>
              </div>
            </>
          ) : (
            <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
              Create a map to start.
            </div>
          )}
        </main>

        <aside style={{ borderLeft: isCompact ? 'none' : '1px solid var(--border)', borderTop: isCompact ? '1px solid var(--border)' : 'none', background: 'color-mix(in srgb, var(--surface) 94%, #000)', padding: 10, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PanelTitle>Properties</PanelTitle>
            {primarySelection ? (
              <>
                <PropertyInput label="Name" value={primarySelection.metadata?.name || ''} onChange={value => patchSelected({ metadata: { name: value } })} />
                <PropertyInput label="Text" value={primarySelection.metadata?.text || ''} onChange={value => patchSelected({ metadata: { text: value } })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <NumberInput label="X" value={primarySelection.x} onChange={value => patchSelected({ x: value })} />
                  <NumberInput label="Y" value={primarySelection.y} onChange={value => patchSelected({ y: value })} />
                  <NumberInput label="W" value={primarySelection.width} min={MIN_SIZE} onChange={value => patchSelected({ width: value })} />
                  <NumberInput label="H" value={primarySelection.height} min={MIN_SIZE} onChange={value => patchSelected({ height: value })} />
                  <NumberInput label="Rotate" value={primarySelection.rotation} onChange={value => patchSelected({ rotation: value })} />
                  <NumberInput label="Layer" value={primarySelection.zIndex} onChange={value => patchSelected({ zIndex: value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <ColorInput label="Fill" value={primarySelection.metadata?.fill || LAND_FILL} onChange={value => patchSelected({ metadata: { fill: value } })} />
                  <ColorInput label="Stroke" value={primarySelection.metadata?.stroke || LAND_STROKE} onChange={value => patchSelected({ metadata: { stroke: value } })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <NumberInput label="Opacity" value={round((primarySelection.metadata?.opacity ?? 1) * 100, 0)} min={0} onChange={value => patchSelected({ metadata: { opacity: clamp(value / 100, 0, 1) } })} />
                  <NumberInput label="Line" value={primarySelection.metadata?.lineThickness || 2} min={1} onChange={value => patchSelected({ metadata: { lineThickness: value } })} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <CheckboxInput label="Dashed" checked={Boolean(primarySelection.metadata?.dashed)} onChange={value => patchSelected({ metadata: { dashed: value } })} />
                  {primarySelection.type === 'shape' && (
                    <SelectInput
                      label="Shape"
                      value={primarySelection.metadata?.shapeKind || 'rectangle'}
                      options={[
                        { value: 'rectangle', label: 'Rectangle' },
                        { value: 'circle', label: 'Circle' },
                        { value: 'polygon', label: 'Polygon' },
                      ]}
                      onChange={value => patchSelected({ metadata: { shapeKind: value } })}
                    />
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => patchSelected({ locked: !primarySelection.locked })}>{primarySelection.locked ? 'Unlock' : 'Lock'}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => patchSelected({ visible: primarySelection.visible === false })}>{primarySelection.visible === false ? 'Show' : 'Hide'}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => moveLayer('front')}>Front</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => moveLayer('back')}>Back</button>
                  <button className="btn btn-secondary btn-sm" onClick={deleteSelectedObjects}>Delete</button>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5 }}>Select an object to edit its position, size, rotation, visibility, lock state, and metadata.</div>
            )}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <PanelTitle>Layers</PanelTitle>
            {[...objects].sort((a, b) => b.zIndex - a.zIndex).map(object => {
              const selected = selectedIds.includes(object.id)
              return (
                <div key={object.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 4, alignItems: 'center', padding: 5, borderRadius: 7, border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`, background: selected ? 'color-mix(in srgb, var(--accent) 14%, var(--surface2))' : 'var(--surface2)' }}>
                  <button
                    onClick={event => {
                      if (event.shiftKey || event.metaKey || event.ctrlKey) {
                        setSelectedIds(current => current.includes(object.id) ? current.filter(id => id !== object.id) : [...current, object.id])
                      } else {
                        setSelectedIds([object.id])
                      }
                    }}
                    style={{ minWidth: 0, textAlign: 'left', background: 'none', border: 'none', color: selected ? 'var(--text-main)' : 'var(--muted)', fontFamily: 'inherit', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {OBJECT_TYPES[object.type]?.icon || '□'} {object.metadata?.name || object.type}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleVisibility(object.id)} title={object.visible === false ? 'Show' : 'Hide'}>{object.visible === false ? '○' : '●'}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleLock(object.id)} title={object.locked ? 'Unlock' : 'Lock'}>{object.locked ? 'L' : 'U'}</button>
                </div>
              )
            })}
            {!objects.length && <div style={{ color: 'var(--muted)', fontSize: 13 }}>No objects yet.</div>}
          </section>
        </aside>
      </div>
    </div>
  )
}

function PanelTitle({ children }) {
  return <div style={{ fontSize: 10, color: 'var(--faint)', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>{children}</div>
}

function PropertyInput({ label, value, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--muted)' }}>
      <span>{label}</span>
      <input value={value} onChange={event => onChange(event.target.value)} style={{ border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', borderRadius: 7, padding: '7px 8px', fontFamily: 'inherit' }} />
    </label>
  )
}

function NumberInput({ label, value, min = -Infinity, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--muted)' }}>
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? round(value) : 0}
        onChange={event => onChange(Math.max(min, Number(event.target.value) || 0))}
        style={{ minWidth: 0, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', borderRadius: 7, padding: '7px 8px', fontFamily: 'inherit' }}
      />
    </label>
  )
}

function ColorInput({ label, value, onChange }) {
  const safeValue = /^#[0-9a-f]{6}$/i.test(value) ? value : LAND_FILL
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--muted)' }}>
      <span>{label}</span>
      <input type="color" value={safeValue} onChange={event => onChange(event.target.value)} style={{ width: '100%', minHeight: 34, border: '1px solid var(--border)', background: 'var(--surface2)', borderRadius: 7, padding: 3 }} />
    </label>
  )
}

function CheckboxInput({ label, checked, onChange }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', minHeight: 32 }}>
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} style={{ accentColor: 'var(--accent)' }} />
      <span>{label}</span>
    </label>
  )
}

function SelectInput({ label, value, options, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--muted)', minWidth: 120 }}>
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} style={{ border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', borderRadius: 7, padding: '7px 8px', fontFamily: 'inherit' }}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}
