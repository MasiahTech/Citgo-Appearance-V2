/**
 * Thumbnail — Photo card using uz_AutoShot's cfx-nui shots/ URLs.
 * Identical logic to uz_AutoShot's ClothingMenu Thumbnail component.
 */

import React, { useState, useEffect } from 'react'
import { Check } from 'lucide-react'

const THUMB_BASE = 'https://cfx-nui-uz_AutoShot/shots/'

export const Thumbnail = React.memo(function Thumbnail({ item, isSelected, onClick, ext = 'png' }) {
  const [src,   setSrc]   = useState(null)
  const [error, setError] = useState(false)

  // Build URL matching uz_AutoShot's path conventions
  const texSuffix = item.texture > 0 ? `_${item.texture}` : ''
  const thumbName = item.type === 'prop'
    ? `${item.gender}/prop_${item.id}/${item.drawable}${texSuffix}.${ext}`
    : `${item.gender}/${item.id}/${item.drawable}${texSuffix}.${ext}`

  useEffect(() => {
    let cancelled = false
    setSrc(null)
    setError(false)
    fetch(THUMB_BASE + thumbName)
      .then(r => { if (!r.ok) throw 0; return r.blob() })
      .then(b => { if (!cancelled) setSrc(URL.createObjectURL(b)) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [thumbName])

  const label = `#${item.drawable}`

  return (
    <div
      className="relative overflow-hidden cursor-pointer"
      style={{
        borderRadius: 7,
        width: '100%', height: '100%',
        background: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.012)',
        border: `1px solid ${isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.04)'}`,
        display: 'flex', flexDirection: 'column',
      }}
      onClick={() => onClick(item)}>

      {/* Image area */}
      <div style={{
        position: 'relative', flex: '1 1 0', minHeight: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', background: 'rgba(0,0,0,0.15)',
      }}>
        {!src && !error && <div style={{ position: 'absolute', inset: 0 }} className="skeleton" />}
        {error && <span style={{ fontSize: 10, color: '#999' }}>{label}</span>}
        {src && (
          <img
            src={src} alt="" draggable={false}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'contain', padding: 4, transition: 'transform 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.06)'}
            onMouseOut={e  => e.currentTarget.style.transform = 'scale(1)'}
          />
        )}
        {/* Hover label overlay */}
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(0,0,0,0.55)',
            opacity: 0, pointerEvents: 'none', transition: 'opacity 0.1s',
          }}
          ref={el => {
            if (!el) return
            const parent = el.parentElement?.parentElement
            if (!parent) return
            parent.onmouseenter = () => el.style.opacity = '1'
            parent.onmouseleave = () => el.style.opacity = '0'
          }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{label}</span>
        </div>
        {/* Selected checkmark */}
        {isSelected && (
          <div style={{
            position: 'absolute', top: 3, right: 3,
            width: 13, height: 13, borderRadius: '50%',
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check style={{ width: 7, height: 7, color: '#000' }} strokeWidth={3} />
          </div>
        )}
        {/* Texture badge */}
        {item.texture > 0 && (
          <span style={{
            position: 'absolute', top: 3, left: 3,
            fontSize: 8, fontWeight: 700, color: '#999',
            background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 2, padding: '0 3px',
          }}>T{item.texture}</span>
        )}
      </div>

      {/* Label bar */}
      <div style={{
        height: 18, flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.025)',
        background: 'rgba(0,0,0,0.2)',
      }}>
        <span style={{
          fontSize: 9, fontWeight: isSelected ? 700 : 500,
          color: isSelected ? '#ddd' : '#666',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{label}</span>
      </div>
    </div>
  )
})
