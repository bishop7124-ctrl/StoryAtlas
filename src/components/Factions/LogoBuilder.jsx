import { useState } from 'react'
import { getShapeElement } from './FactionLogo'
import { DEFAULT_LOGO_BACKGROUND, normalizeFactionLogo } from './logoData'

const uid = () => Math.random().toString(36).slice(2)

const SHAPES = [
  { type: 'circle',   label: 'Circle'   },
  { type: 'square',   label: 'Square'   },
  { type: 'triangle', label: 'Triangle' },
  { type: 'diamond',  label: 'Diamond'  },
  { type: 'star',     label: 'Star'     },
  { type: 'hexagon',  label: 'Hexagon'  },
  { type: 'cross',    label: 'Cross'    },
  { type: 'shield',   label: 'Shield'   },
  { type: 'crescent', label: 'Moon'     },
  { type: 'arrow',    label: 'Arrow'    },
]

const COLORS = [
  '#8b0000', '#cc2222', '#d4700a', '#d4af37',
  '#1a5c2a', '#2d8a3e', '#0e7490', '#1e3a6e',
  '#1e5fa8', '#7c3aed', '#9d2264', '#111111',
  '#555555', '#999999', '#cccccc', '#ffffff',
]

const BACKGROUND_COLORS = [
  '#0c0c12', '#171720', '#2b1b1b', '#2a1f0f',
  '#14231b', '#102a32', '#16243d', '#241b3d',
  '#3a1630', '#111111', '#f4f1e8', '#ffffff',
]

const BTN = 'px-2.5 py-1 rounded text-xs font-bold border border-[var(--border)] bg-[var(--bg-nav)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-[var(--text-muted)]'

export default function LogoBuilder({ logo, onChange }) {
  const [selectedIdx, setSelectedIdx] = useState(null)
  const logoData = normalizeFactionLogo(logo)
  const { shapes, backgroundColor, backgroundTransparent } = logoData
  const selected = selectedIdx !== null && selectedIdx < shapes.length ? shapes[selectedIdx] : null

  const updateLogo = (updates) => onChange({ ...logoData, ...updates })

  const addShape = (type) => {
    const newShape = { id: uid(), type, cx: 50, cy: 50, size: 30, color: '#ffffff' }
    const next = [...shapes, newShape]
    updateLogo({ shapes: next })
    setSelectedIdx(next.length - 1)
  }

  const update = (updates) => {
    if (selectedIdx === null) return
    updateLogo({ shapes: shapes.map((s, i) => i === selectedIdx ? { ...s, ...updates } : s) })
  }

  const removeSelected = () => {
    if (selectedIdx === null) return
    updateLogo({ shapes: shapes.filter((_, i) => i !== selectedIdx) })
    setSelectedIdx(null)
  }

  const moveLayer = (dir) => {
    if (selectedIdx === null) return
    const next = [...shapes]
    const target = selectedIdx + dir
    if (target < 0 || target >= next.length) return
    ;[next[selectedIdx], next[target]] = [next[target], next[selectedIdx]]
    updateLogo({ shapes: next })
    setSelectedIdx(target)
  }

  const clearAll = () => { updateLogo({ shapes: [] }); setSelectedIdx(null) }

  const checkerboard = {
    backgroundColor: '#ffffff',
    backgroundImage:
      'linear-gradient(45deg, rgba(0,0,0,0.16) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.16) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.16) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.16) 75%)',
    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
    backgroundSize: '16px 16px',
  }

  return (
    <div className="flex gap-5">

      {/* Canvas */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div
          className="w-44 h-44 rounded-xl border-2 border-[var(--border)] relative overflow-hidden cursor-default select-none"
          onClick={() => setSelectedIdx(null)}
          style={backgroundTransparent ? checkerboard : { backgroundColor }}
        >
          <svg viewBox="0 0 100 100" width="176" height="176">
            {!backgroundTransparent && <rect width="100" height="100" fill={backgroundColor} />}
            {shapes.map((shape, i) => {
              const isSelected = i === selectedIdx
              return (
                <g
                  key={shape.id || i}
                  onClick={(e) => { e.stopPropagation(); setSelectedIdx(i) }}
                  style={{ cursor: 'pointer' }}
                >
                  {getShapeElement(shape, {
                    stroke: isSelected ? '#ffffff' : 'none',
                    strokeWidth: isSelected ? 1.5 : 0,
                    opacity: isSelected ? 1 : 0.9,
                  })}
                </g>
              )
            })}
          </svg>
          {shapes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs pointer-events-none">
              Add shapes below
            </div>
          )}
        </div>
        <span className="text-[10px] text-[var(--text-muted)] text-center">Click a shape to select it</span>
        {shapes.length > 0 && (
          <button type="button" onClick={clearAll} className="text-[10px] text-red-500/50 hover:text-red-500 transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Background */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Background</p>
            <label className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={backgroundTransparent}
                onChange={e => updateLogo({ backgroundTransparent: e.target.checked })}
                className="accent-[var(--accent)]"
              />
              Transparent
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {BACKGROUND_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => updateLogo({ backgroundColor: c, backgroundTransparent: false })}
                title={c}
                className="w-5 h-5 rounded border-2 transition-all hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: !backgroundTransparent && backgroundColor === c ? 'var(--accent)' : 'transparent',
                  outline: c === '#ffffff' || c === '#f4f1e8' ? '1px solid rgba(255,255,255,0.15)' : 'none',
                }}
              />
            ))}
            <button
              type="button"
              onClick={() => updateLogo({ backgroundTransparent: true })}
              title="Transparent background"
              className="w-5 h-5 rounded border-2 transition-all hover:scale-110"
              style={{
                ...checkerboard,
                borderColor: backgroundTransparent ? 'var(--accent)' : 'transparent',
                outline: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <label title="Custom background colour" className="w-5 h-5 rounded border border-[var(--border)] overflow-hidden cursor-pointer hover:scale-110 transition-all flex-shrink-0">
              <input
                type="color"
                value={backgroundColor || DEFAULT_LOGO_BACKGROUND}
                onChange={e => updateLogo({ backgroundColor: e.target.value, backgroundTransparent: false })}
                className="w-6 h-6 -translate-x-0.5 -translate-y-0.5 cursor-pointer opacity-0 absolute"
              />
              <div className="w-full h-full" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
            </label>
          </div>
        </div>

        {/* Shape palette */}
        <div>
          <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2">Add Shape</p>
          <div className="grid grid-cols-5 gap-1.5">
            {SHAPES.map(s => (
              <button
                key={s.type}
                type="button"
                onClick={() => addShape(s.type)}
                className="flex flex-col items-center gap-1 p-1.5 rounded border border-[var(--border)] bg-[var(--bg-nav)] hover:border-[var(--accent)] hover:bg-[var(--accent-fade)] transition-all group"
              >
                <svg viewBox="0 0 100 100" className="w-7 h-7 text-[var(--text-muted)] group-hover:text-[var(--accent)]">
                  {getShapeElement({ type: s.type, cx: 50, cy: 50, size: 38, color: 'currentColor' })}
                </svg>
                <span className="text-[9px] text-[var(--text-muted)] group-hover:text-[var(--accent)] leading-none">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <>
            {/* Color swatches */}
            <div>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2">Colour</p>
              <div className="flex flex-wrap gap-1.5 items-center">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update({ color: c })}
                    title={c}
                    className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: selected.color === c ? 'var(--accent)' : 'transparent',
                      outline: c === '#ffffff' || c === '#cccccc' ? '1px solid rgba(255,255,255,0.15)' : 'none',
                    }}
                  />
                ))}
                <label title="Custom colour" className="w-5 h-5 rounded-full border border-[var(--border)] overflow-hidden cursor-pointer hover:scale-110 transition-all flex-shrink-0">
                  <input
                    type="color"
                    value={selected.color}
                    onChange={e => update({ color: e.target.value })}
                    className="w-6 h-6 -translate-x-0.5 -translate-y-0.5 cursor-pointer opacity-0 absolute"
                  />
                  <div className="w-full h-full rounded-full" style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }} />
                </label>
              </div>
            </div>

            {/* Size */}
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Size</p>
                <span className="text-[10px] text-[var(--text-muted)]">{selected.size}</span>
              </div>
              <input
                type="range" min="6" max="46" value={selected.size}
                onChange={e => update({ size: Number(e.target.value) })}
                className="w-full h-1 accent-[var(--accent)]"
              />
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">X</p>
                  <span className="text-[10px] text-[var(--text-muted)]">{selected.cx}</span>
                </div>
                <input
                  type="range" min="5" max="95" value={selected.cx}
                  onChange={e => update({ cx: Number(e.target.value) })}
                  className="w-full h-1 accent-[var(--accent)]"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest">Y</p>
                  <span className="text-[10px] text-[var(--text-muted)]">{selected.cy}</span>
                </div>
                <input
                  type="range" min="5" max="95" value={selected.cy}
                  onChange={e => update({ cy: Number(e.target.value) })}
                  className="w-full h-1 accent-[var(--accent)]"
                />
              </div>
            </div>

            {/* Layer & delete */}
            <div className="flex gap-2">
              <button type="button" onClick={() => moveLayer(-1)} className={BTN} title="Move forward (higher layer)">↑ Forward</button>
              <button type="button" onClick={() => moveLayer(1)}  className={BTN} title="Move backward (lower layer)">↓ Back</button>
              <button type="button" onClick={removeSelected} className="px-2.5 py-1 rounded text-xs font-bold border border-red-500/30 bg-[var(--bg-nav)] hover:border-red-500 hover:text-red-500 transition-all text-red-500/50 ml-auto">
                Remove
              </button>
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-[var(--text-muted)] text-xs italic border border-dashed border-[var(--border)] rounded-lg">
            {shapes.length === 0 ? 'Add a shape to get started' : 'Select a shape on the canvas to edit it'}
          </div>
        )}
      </div>
    </div>
  )
}
