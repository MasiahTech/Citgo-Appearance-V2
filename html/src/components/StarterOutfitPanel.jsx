/**
 * StarterOutfitPanel — Shows preset outfits for character creation.
 * In admin mode (editorMode='starterOutfitAdmin'), allows saving/deleting outfits.
 * In character creation mode, only shows "Apply" buttons.
 */

import React, { useState } from 'react'
import { Check, Trash2, Plus } from 'lucide-react'

const border = (o = 0.06) => `1px solid rgba(255,255,255,${o})`
const bg     = (o = 0.03) => `rgba(255,255,255,${o})`

function OutfitCard({ outfit, index, onApply, onDelete, isAdmin }) {
  const [confirm, setConfirm] = useState(false)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 10px', background: bg(0.02),
      border: border(0.04), borderRadius: 7, marginBottom: 5,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {outfit.name || `Outfit #${index + 1}`}
        </p>
      </div>

      <button
        onClick={() => onApply(outfit)}
        title="Wear this outfit"
        style={{
          width: 26, height: 26, borderRadius: 5, border: border(0.08),
          background: bg(0.04), cursor: 'pointer', color: '#888',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <Check style={{ width: 11, height: 11 }} strokeWidth={2.5} />
      </button>

      {isAdmin && (
        <button
          onClick={() => { if (!confirm) { setConfirm(true) } else { onDelete(index + 1) } }}
          onBlur={() => setConfirm(false)}
          title={confirm ? 'Click again to confirm' : 'Delete'}
          style={{
            width: 26, height: 26, borderRadius: 5,
            border: confirm ? '1px solid rgba(239,68,68,0.4)' : border(0.05),
            background: confirm ? 'rgba(239,68,68,0.15)' : bg(0.03),
            cursor: 'pointer',
            color: confirm ? '#ef4444' : '#444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}>
          <Trash2 style={{ width: 10, height: 10 }} />
        </button>
      )}
    </div>
  )
}

export function StarterOutfitPanel({ outfits, isAdmin, onApply, onSave, onDelete }) {
  const [saveName, setSaveName] = useState('')

  const handleApply = (outfit) => {
    const components = {}
    const props      = {}
    if (outfit.components) {
      for (const [id, val] of Object.entries(outfit.components)) {
        components[id] = { drawable: val.drawable, texture: val.texture }
      }
    }
    if (outfit.props) {
      for (const [id, val] of Object.entries(outfit.props)) {
        props[id] = { drawable: val.drawable, texture: val.texture }
      }
    }
    onApply({ components, props })
  }

  const handleSave = () => {
    const name = saveName.trim()
    if (!name) return
    onSave(name)
    setSaveName('')
  }

  return (
    <div className="flex flex-col h-full">
      <div style={{ padding: '12px 14px 10px', flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#eee', letterSpacing: '-0.02em' }}>
          Starter Outfits
        </p>
        <p style={{ fontSize: 10, color: '#444', marginTop: 2 }}>
          {isAdmin ? 'Create and manage starter outfits for new characters' : 'Choose a starting outfit'}
        </p>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ padding: '10px 12px' }}>
        {outfits.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 11, color: '#333' }}>No starter outfits configured.</p>
          </div>
        )}

        {outfits.map((outfit, i) => (
          <OutfitCard
            key={i}
            outfit={outfit}
            index={i}
            onApply={handleApply}
            onDelete={onDelete}
            isAdmin={isAdmin}
          />
        ))}

        {/* Admin: save current appearance as starter outfit */}
        {isAdmin && (
          <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: bg(0.02), border: border(0.04) }}>
            <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>
              Save Current as Starter Outfit
            </p>
            <div style={{ display: 'flex', gap: 7 }}>
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder="Outfit name..."
                maxLength={40}
                style={{
                  flex: 1, height: 30, borderRadius: 6, background: bg(0.015),
                  border: border(0.06), padding: '0 10px', fontSize: 11,
                  color: '#ccc', outline: 'none', caretColor: '#888',
                }}
              />
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                style={{
                  height: 30, padding: '0 14px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: saveName.trim() ? '#f0f0f0' : bg(0.03),
                  color: saveName.trim() ? '#000' : '#333',
                  border: 'none', cursor: saveName.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 0.12s',
                }}>
                <Plus style={{ width: 10, height: 10 }} />
                Save
              </button>
            </div>
            <p style={{ fontSize: 8, color: '#444', marginTop: 6 }}>
              Your current clothing will be saved as a starter outfit for this gender.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
