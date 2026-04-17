/**
 * TattooPanel — Displays tattoos for a single body zone with radio-style selection.
 * Only one tattoo can be active per zone. Selecting a new one replaces the previous.
 */

import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'

const border = (o = 0.06) => `1px solid rgba(255,255,255,${o})`
const bg     = (o = 0.03) => `rgba(255,255,255,${o})`

const ROW_H = 44

function TattooRow({ index, style, data }) {
  const { tattoos, onToggle } = data
  const tattoo = tattoos[index]
  if (!tattoo) return null

  return (
    <div style={{
      ...style,
      padding: '0 14px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div
        onClick={() => onToggle(tattoo, tattoo.applied)}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
          background: tattoo.applied ? 'rgba(34,197,94,0.06)' : bg(0.02),
          border: tattoo.applied ? '1px solid rgba(34,197,94,0.15)' : border(0.04),
          height: ROW_H - 6,
          transition: 'all 0.12s',
        }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 11, fontWeight: 500, color: tattoo.applied ? '#ddd' : '#888',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {tattoo.label || tattoo.name}
          </p>
        </div>

        {/* Radio indicator */}
        <div style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          border: tattoo.applied ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.15s',
        }}>
          {tattoo.applied && (
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: '#22c55e',
            }} />
          )}
        </div>
      </div>
    </div>
  )
}

export function TattooPanel({ zoneId, zoneLabel, tattoos, onToggle }) {
  const appliedCount = useMemo(() => tattoos.filter(t => t.applied).length, [tattoos])
  const appliedName  = useMemo(() => {
    const applied = tattoos.find(t => t.applied)
    return applied ? applied.label || applied.name : null
  }, [tattoos])

  const itemData = useMemo(() => ({ tattoos, onToggle }), [tattoos, onToggle])

  return (
    <div className="flex flex-col h-full">
      <div style={{ padding: '12px 14px 10px', flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#eee', letterSpacing: '-0.02em' }}>
          {zoneLabel}
        </p>
        <p style={{ fontSize: 10, color: '#444', marginTop: 2 }}>
          {tattoos.length} tattoos · {appliedName ? (<span style={{ color: '#22c55e' }}>{appliedName}</span>) : 'none selected'}
        </p>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

      <div className="flex-1" style={{ minHeight: 0 }}>
        {tattoos.length > 0 ? (
          <List
            height={600}
            width="100%"
            itemCount={tattoos.length}
            itemSize={ROW_H}
            itemData={itemData}
            className="scrollbar-thin"
            style={{ height: '100%' }}
          >
            {TattooRow}
          </List>
        ) : (
          <div className="h-full flex items-center justify-center">
            <span style={{ fontSize: 11, color: '#333' }}>No tattoos for this zone</span>
          </div>
        )}
      </div>
    </div>
  )
}
