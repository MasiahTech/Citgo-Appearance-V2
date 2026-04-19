/**
 * DrawableGrid — Right panel for clothing components and props.
 * Virtualized grid of uz_AutoShot photo thumbnails.
 * Below the grid: texture selector row for the current drawable.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import { Search, X, EyeOff } from 'lucide-react'
import { Thumbnail } from './Thumbnail'

const CARD_W = 106
const GAP    = 6
const ROW_H  = CARD_W + GAP + 18
const border = (o = 0.06) => `1px solid rgba(255,255,255,${o})`
const bg     = (o = 0.03) => `rgba(255,255,255,${o})`

// ── Cell wrapper for FixedSizeGrid ───────────────────────────────────────────
function Cell({ columnIndex, rowIndex, style, data }) {
  const { items, current, COLS, onSelect } = data
  const idx  = rowIndex * COLS + columnIndex
  if (idx >= items.length) return null
  const item = items[idx]
  const sel  = current.drawable === item.drawable
  return (
    <div style={{
      ...style,
      left:   +style.left   + GAP,
      top:    +style.top    + GAP,
      width:  +style.width  - GAP,
      height: +style.height - GAP,
    }}>
      <Thumbnail item={item} isSelected={sel} onClick={onSelect} />
    </div>
  )
}

// ── DrawableGrid ─────────────────────────────────────────────────────────────
export function DrawableGrid({ type, slot, gender, current, isHidden, onDrawableSelect, onRemove, onHideToggle }) {
  const [search, setSearch] = useState('')
  const gridRef = useRef(null)
  const [gridSize, setGridSize] = useState({ width: 0, height: 0 })

  // Measure grid container
  useEffect(() => {
    const measure = () => {
      if (gridRef.current) {
        const r = gridRef.current.getBoundingClientRect()
        setGridSize({ width: r.width, height: r.height })
      }
    }
    measure()
    const t = setTimeout(measure, 50)
    window.addEventListener('resize', measure)
    return () => { window.removeEventListener('resize', measure); clearTimeout(t) }
  }, [])

  // Build drawable items array
  const allItems = useMemo(() => {
    const arr = []
    const start = type === 'prop' ? -1 : 0  // props can have -1 (removed)
    for (let d = 0; d < slot.numDrawables; d++) {
      arr.push({ type, id: slot.id, gender, drawable: d, texture: 0 })
    }
    return arr
  }, [type, slot, gender])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems
    const q = search.toLowerCase()
    return allItems.filter(i => `#${i.drawable}`.includes(q))
  }, [allItems, search])

  const COLS = Math.max(1, Math.floor((gridSize.width - GAP) / (CARD_W + GAP)))
  const ROWS = Math.ceil(filteredItems.length / COLS)

  const handleSelect = useCallback((item) => {
    if (current.drawable === item.drawable) {
      // Clicking the already-selected item deselects / removes it
      if (type === 'prop') {
        onRemove?.()
      } else {
        onDrawableSelect(0, 0)
      }
    } else {
      onDrawableSelect(item.drawable, 0)
    }
  }, [onDrawableSelect, onRemove, type, current])

  const itemData = useMemo(() => ({
    items: filteredItems,
    current,
    COLS,
    onSelect: handleSelect,
  }), [filteredItems, current, COLS, handleSelect])

  // Current drawable's texture count
  const numTextures = slot.numTextures?.[String(current.drawable)] ?? 1

  const subtitle = type === 'prop'
    ? `Prop · ID ${slot.id}`
    : `Component · ID ${slot.id}`

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-2.5 shrink-0" style={{ padding: '12px 14px' }}>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{slot.label}</p>
          <p style={{ fontSize: 11, color: '#666', marginTop: 3 }}>{subtitle}</p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#777', background: bg(0.03), border: border(0.05), borderRadius: 4, padding: '2px 9px' }}>
          {filteredItems.length}
        </span>
        <button
          onClick={() => onHideToggle?.()}
          title={isHidden ? `Show ${slot.label}` : `Hide ${slot.label}`}
          className="flex items-center justify-center gap-1.5 cursor-pointer"
          style={{
            height: 28, padding: '0 10px', borderRadius: 6,
            background: isHidden ? 'rgba(236,72,153,0.35)' : 'rgba(236,72,153,0.12)',
            border: `1px solid rgba(236,72,153,${isHidden ? '0.6' : '0.35'})`,
            fontSize: 11, fontWeight: 600, color: '#ec4899',
            transition: 'background 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.background = isHidden ? 'rgba(236,72,153,0.45)' : 'rgba(236,72,153,0.22)'}
          onMouseOut={e  => e.currentTarget.style.background = isHidden ? 'rgba(236,72,153,0.35)' : 'rgba(236,72,153,0.12)'}>
          <EyeOff style={{ width: 12, height: 12 }} />
          {isHidden ? 'Show' : 'Hide'}
        </button>
      </div>

      <div style={{ height: 1, background: bg(0.04) }} />

      {/* Search */}
      <div style={{ padding: '7px 12px' }}>
        <div className="flex items-center gap-2" style={{ height: 30, borderRadius: 6, padding: '0 10px', background: bg(0.015), border: border(0.04) }}>
          <Search style={{ width: 12, height: 12, color: '#666', flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by #id..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#ddd', caretColor: '#999' }}
          />
          {search ? (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <X style={{ width: 11, height: 11, color: '#777' }} />
            </button>
          ) : (
            <span style={{ fontSize: 10, color: '#555', fontFamily: 'monospace' }}>{slot.numDrawables}</span>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: bg(0.04) }} />

      {/* Virtualized grid */}
      <div className="flex-1 overflow-hidden" ref={gridRef}>
        {filteredItems.length > 0 && gridSize.height > 0 ? (
          <Grid
            className="scrollbar-thin"
            columnCount={COLS}
            columnWidth={CARD_W + GAP}
            height={gridSize.height}
            rowCount={ROWS}
            rowHeight={ROW_H}
            width={gridSize.width}
            overscanRowCount={3}
            itemData={itemData}>
            {Cell}
          </Grid>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <Search style={{ width: 14, height: 14, color: '#444' }} />
            <span style={{ fontSize: 12, color: '#666' }}>No items found</span>
          </div>
        )}
      </div>

      {/* Texture selector row */}
      {numTextures > 1 && (
        <>
          <div style={{ height: 1, background: bg(0.04) }} />
          <div style={{ padding: '7px 12px' }}>
            <p style={{ fontSize: 11, color: '#777', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Texture</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: numTextures }, (_, t) => (
                <button
                  key={t}
                  onClick={() => onDrawableSelect(current.drawable, t)}
                  style={{
                    width: 32, height: 32, borderRadius: 5, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                    background: current.texture === t ? '#f0f0f0' : bg(0.04),
                    color:      current.texture === t ? '#000'    : '#666',
                    border:     current.texture === t ? 'none'    : border(0.08),
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Status bar */}
      <div style={{ height: 1, background: bg(0.04) }} />
      <div className="flex items-center shrink-0" style={{ padding: '8px 12px' }}>
        {current.drawable >= 0 ? (
          <>
            <span style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.4)', marginRight: 8 }} />
            <span style={{ fontSize: 12, color: '#999' }}>
              Drawable <span style={{ color: '#ddd', fontWeight: 700 }}>#{current.drawable}</span>
              {current.texture > 0 && <> · Texture <span style={{ color: '#ddd', fontWeight: 700 }}>#{current.texture}</span></>}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#555' }}>No prop equipped</span>
        )}
      </div>
    </div>
  )
}
