/**
 * SliderPanel — Right panel for Hair, Head Blend, Overlays, and Eye Color.
 * Hair/eyebrows/beard/chestHair show uz_AutoShot thumbnail grids (virtualized, 106x130).
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import { Check } from 'lucide-react'

const border = (o = 0.06) => `1px solid rgba(255,255,255,${o})`
const bg     = (o = 0.03) => `rgba(255,255,255,${o})`

const THUMB_BASE = 'https://cfx-nui-uz_AutoShot/shots/'

// Thumbnail card dimensions (match clothing DrawableGrid)
const CARD_W = 106
const GAP    = 6
const LABEL_H = 18
const ROW_H  = 130 + GAP

// GTA overlay index for uz_AutoShot URL construction
const OVERLAY_GTA_INDEX = {
  eyebrows:       2,
  beard:          1,
  chestHair:      10,
  blemishes:      0,
  ageing:         3,
  makeUp:         4,
  blush:          5,
  complexion:     6,
  sunDamage:      7,
  lipstick:       8,
  moleAndFreckles:9,
  bodyBlemishes:  11,
}

// Max style count per overlay
const MAX_STYLE = {
  eyebrows:        34,
  beard:           29,
  chestHair:       17,
  blemishes:       24,
  ageing:          15,
  makeUp:           8,
  blush:            6,
  complexion:      12,
  sunDamage:       11,
  lipstick:        10,
  moleAndFreckles: 18,
  bodyBlemishes:   12,
}

// Overlays that have color pickers (colorType 1 = hair palette)
const HAS_HAIR_COLOR  = new Set(['eyebrows', 'beard', 'chestHair'])
// Overlays that have makeup color pickers (colorType 2)
const HAS_MAKEUP_COLOR = new Set(['makeUp', 'blush', 'lipstick'])

// ── GTA hair color palette (64 colors) ──────────────────────────────────────
const HAIR_COLORS = [
  '#1a1a1a','#2a1f1a','#3b2b20','#4d3828','#6b4c30','#8b6340','#a87c55','#c49970',
  '#e0c090','#f0d9b0','#f5e8c8','#fff5e0','#d4a843','#c8922a','#b87820','#a06018',
  '#884818','#6e3010','#3d1a08','#1a0804','#0a0404','#200808','#3d1010','#6b1a1a',
  '#8b2424','#b03030','#c84040','#d85858','#e87070','#c86090','#a84878','#884060',
  '#6a3050','#503060','#3a2870','#2a2080','#1a1890','#2030a0','#3048b0','#4060c0',
  '#6080d0','#8090e0','#6a90c0','#4878a8','#306090','#1a4878','#0a3060','#143850',
  '#1a5040','#1a6030','#208040','#30a050','#50b060','#70c070','#58a058','#408040',
  '#306030','#204020','#102010','#304838','#486858','#708878','#90a898','#b0c0b8',
]

// ── GTA eye color palette (32 colors) ───────────────────────────────────────
const EYE_COLORS = [
  '#6b8e6b','#5a7a6b','#4a6a70','#3a5a75','#4a6890','#5a78a8','#7898c0','#98b8d8',
  '#c8d8e8','#e0ecf8','#8b7050','#7a6040','#6a5030','#594020','#4a3018','#3a2010',
  '#9b5a3a','#8a4a30','#7a3a28','#6a2a1a','#5a2010','#4a1808','#c8a870','#b89860',
  '#a88850','#987840','#886830','#785820','#685010','#584008','#483000','#382000',
]

// ── Single style thumbnail (for virtualized grid cells) ─────────────────────
function StyleThumbCell({ columnIndex, rowIndex, style, data }) {
  const { count, urlFn, selected, onSelect, COLS } = data
  const idx = rowIndex * COLS + columnIndex
  if (idx >= count) return null

  return (
    <div style={{
      ...style,
      left:   +style.left   + GAP,
      top:    +style.top    + GAP,
      width:  +style.width  - GAP,
      height: +style.height - GAP,
    }}>
      <StyleThumb idx={idx} url={urlFn(idx)} selected={selected === idx} onSelect={onSelect} />
    </div>
  )
}

function StyleThumb({ idx, url, selected, onSelect }) {
  const [src, setSrc] = useState(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    let cancelled = false
    setSrc(null); setErr(false)
    fetch(url)
      .then(r => { if (!r.ok) throw 0; return r.blob() })
      .then(b => { if (!cancelled) setSrc(URL.createObjectURL(b)) })
      .catch(() => { if (!cancelled) setErr(true) })
    return () => { cancelled = true }
  }, [url])

  return (
    <div
      onClick={() => onSelect(idx)}
      style={{
        width: '100%', height: '100%', borderRadius: 7, cursor: 'pointer',
        background: selected ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.04)'}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
      }}>
      <div style={{ flex: 1, position: 'relative', background: 'rgba(0,0,0,0.2)', minHeight: 0 }}>
        {!src && !err && (
          <div className="skeleton" style={{ position: 'absolute', inset: 0 }} />
        )}
        {err && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: '#888' }}>#{idx}</span>
          </div>
        )}
        {src && (
          <img src={src} alt="" draggable={false} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', padding: 4,
          }} />
        )}
        {selected && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            width: 14, height: 14, borderRadius: '50%',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check style={{ width: 8, height: 8, color: '#000' }} strokeWidth={3} />
          </div>
        )}
      </div>
      <div style={{
        height: LABEL_H, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderTop: '1px solid rgba(255,255,255,0.025)', background: 'rgba(0,0,0,0.2)',
      }}>
        <span style={{ fontSize: 9, color: selected ? '#ccc' : '#444', fontWeight: selected ? 700 : 400 }}>
          #{idx}
        </span>
      </div>
    </div>
  )
}

// ── Virtualized style thumbnail grid ─────────────────────────────────────────
function StyleThumbGrid({ count, urlFn, selected, onSelect }) {
  const containerRef = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect()
        setSize({ width: r.width, height: r.height })
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const COLS = Math.max(1, Math.floor((size.width + GAP) / (CARD_W + GAP)))
  const rows = Math.ceil(count / COLS)

  const itemData = useMemo(() => ({
    count, urlFn, selected, onSelect, COLS,
  }), [count, urlFn, selected, onSelect, COLS])

  // Calculate minimum height: show all rows if they fit, else cap at available space
  const totalH = rows * ROW_H + GAP
  const gridH  = Math.min(totalH, size.height || 400)

  return (
    <div ref={containerRef} style={{ flex: '1 1 0', minHeight: 160, marginBottom: 16 }}>
      {size.width > 0 && (
        <Grid
          columnCount={COLS}
          columnWidth={(size.width - GAP) / COLS}
          rowCount={rows}
          rowHeight={ROW_H}
          width={size.width}
          height={gridH}
          itemData={itemData}
          className="scrollbar-thin"
          style={{ overflowX: 'hidden' }}
        >
          {StyleThumbCell}
        </Grid>
      )}
    </div>
  )
}

// ── Color swatch ─────────────────────────────────────────────────────────────
function ColorSwatch({ color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 22, height: 22, borderRadius: 4,
        background: color, border: 'none', cursor: 'pointer',
        outline: active ? '2px solid #f5f5f5' : 'none',
        outlineOffset: 1,
        transition: 'transform 0.1s, outline 0.1s',
        flexShrink: 0,
      }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
      onMouseOut={e  => e.currentTarget.style.transform = 'scale(1)'}
    />
  )
}

// ── Slider row ───────────────────────────────────────────────────────────────
function SliderRow({ label, value, min = 0, max, step = 1, onChange, formatValue }) {
  const display = formatValue ? formatValue(value) : value
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#ccc', fontFamily: 'monospace' }}>{display}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>
      {text}
    </p>
  )
}

// ────────────────────────────────────────────────────────────────────────────
export function SliderPanel({ mode, overlayName, overlayLabel, localState, gender = 'male', hairSlot, onHairChange, onBlendChange, onOverlayChange, onEyeColorChange }) {

  // ── HAIR ──────────────────────────────────────────────────────────────────
  if (mode === 'hair') {
    const hair      = localState.hair ?? {}
    const style     = hair.style     ?? 0
    const color     = hair.color     ?? 0
    const highlight = hair.highlight ?? 0
    const hairCount = hairSlot?.numDrawables ?? 74

    const urlFn = useCallback((i) => `${THUMB_BASE}${gender}/2/${i}.png`, [gender])

    return (
      <div className="flex flex-col h-full" style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#eee', letterSpacing: '-0.02em', marginBottom: 12, flexShrink: 0 }}>Hair Style & Color</p>

        <SectionLabel text="Style" />
        <StyleThumbGrid
          count={hairCount}
          urlFn={urlFn}
          selected={style}
          onSelect={v => onHairChange('style', v)}
        />

        <div className="overflow-y-auto scrollbar-thin" style={{ flexShrink: 0 }}>
          <SectionLabel text="Primary Color" />
          <div className="flex flex-wrap gap-1" style={{ marginBottom: 16 }}>
            {HAIR_COLORS.map((hex, i) => (
              <ColorSwatch key={i} color={hex} active={color === i} onClick={() => onHairChange('color', i)} />
            ))}
          </div>

          <SectionLabel text="Highlight Color" />
          <div className="flex flex-wrap gap-1">
            {HAIR_COLORS.map((hex, i) => (
              <ColorSwatch key={i} color={hex} active={highlight === i} onClick={() => onHairChange('highlight', i)} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── HEAD BLEND ────────────────────────────────────────────────────────────
  if (mode === 'headBlend') {
    const hb      = localState.headBlend ?? {}
    const sf      = hb.shapeFirst  ?? 0
    const ss      = hb.shapeSecond ?? 0
    const skin1   = hb.skinFirst   ?? 0
    const skin2   = hb.skinSecond  ?? 0
    const shapeMix = hb.shapeMix   ?? 0
    const skinMix  = hb.skinMix    ?? 0
    const pct = v => `${Math.round(v * 100)}%`

    return (
      <div className="flex flex-col h-full overflow-y-auto scrollbar-thin" style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#eee', letterSpacing: '-0.02em', marginBottom: 14 }}>Head Blend</p>
        <SliderRow label="Face Shape — Parent A" value={sf}      min={0} max={45} onChange={v => onBlendChange('shapeFirst',  v)} />
        <SliderRow label="Face Shape — Parent B" value={ss}      min={0} max={45} onChange={v => onBlendChange('shapeSecond', v)} />
        <SliderRow label="Skin Tone — Parent A"  value={skin1}   min={0} max={45} onChange={v => onBlendChange('skinFirst',   v)} />
        <SliderRow label="Skin Tone — Parent B"  value={skin2}   min={0} max={45} onChange={v => onBlendChange('skinSecond',  v)} />
        <SliderRow label="Face Shape Mix"  value={shapeMix} min={0} max={1} step={0.01} onChange={v => onBlendChange('shapeMix', v)} formatValue={pct} />
        <SliderRow label="Skin Tone Mix"   value={skinMix}  min={0} max={1} step={0.01} onChange={v => onBlendChange('skinMix',  v)} formatValue={pct} />
      </div>
    )
  }

  // ── HEAD OVERLAYS ─────────────────────────────────────────────────────────
  if (mode === 'headOverlays') {
    const ov      = localState.headOverlays?.[overlayName] ?? { style: 0, opacity: 0.0, color: 0, secondColor: 0 }
    const style   = ov.style   ?? 0
    const opacity = ov.opacity ?? 0.0
    const pct     = v => `${Math.round(v * 100)}%`

    const gtaIdx    = OVERLAY_GTA_INDEX[overlayName]
    const maxStyle  = MAX_STYLE[overlayName] ?? 13
    const showThumbs = gtaIdx != null && (overlayName === 'eyebrows' || overlayName === 'beard' || overlayName === 'chestHair')
    const hasColor  = HAS_HAIR_COLOR.has(overlayName) || HAS_MAKEUP_COLOR.has(overlayName)

    const urlFn = useCallback((i) => `${THUMB_BASE}${gender}/overlay_${gtaIdx}/${i}.png`, [gender, gtaIdx])

    return (
      <div className="flex flex-col h-full" style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#eee', letterSpacing: '-0.02em', marginBottom: 12, flexShrink: 0 }}>{overlayLabel}</p>

        <SectionLabel text="Style" />
        {showThumbs ? (
          <StyleThumbGrid
            count={maxStyle}
            urlFn={urlFn}
            selected={style}
            onSelect={v => onOverlayChange(overlayName, 'style', v)}
          />
        ) : (
          <SliderRow label="Style" value={style} min={0} max={maxStyle - 1} onChange={v => onOverlayChange(overlayName, 'style', v)} />
        )}

        <div className="overflow-y-auto scrollbar-thin" style={{ flexShrink: 0 }}>
          <SliderRow label="Opacity" value={opacity} min={0} max={1} step={0.01}
            onChange={v => onOverlayChange(overlayName, 'opacity', v)} formatValue={pct} />

          {hasColor && (
            <>
              <SectionLabel text="Primary Color" />
              <div className="flex flex-wrap gap-1" style={{ marginBottom: 16 }}>
                {HAIR_COLORS.map((hex, i) => (
                  <ColorSwatch key={i} color={hex} active={(ov.color ?? 0) === i}
                    onClick={() => onOverlayChange(overlayName, 'color', i)} />
                ))}
              </div>

              <SectionLabel text="Secondary Color" />
              <div className="flex flex-wrap gap-1">
                {HAIR_COLORS.map((hex, i) => (
                  <ColorSwatch key={i} color={hex} active={(ov.secondColor ?? 0) === i}
                    onClick={() => onOverlayChange(overlayName, 'secondColor', i)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── EYE COLOR ─────────────────────────────────────────────────────────────
  if (mode === 'eyeColor') {
    const current = localState.eyeColor ?? 0
    return (
      <div className="flex flex-col h-full overflow-y-auto scrollbar-thin" style={{ padding: '12px 14px' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#eee', letterSpacing: '-0.02em', marginBottom: 12 }}>Eye Color</p>
        <SectionLabel text="Select Color" />
        <div className="flex flex-wrap gap-1.5">
          {EYE_COLORS.map((hex, i) => (
            <ColorSwatch key={i} color={hex} active={current === i} onClick={() => onEyeColorChange(i)} />
          ))}
        </div>
      </div>
    )
  }

  return null
}
