import React from 'react'
import { User } from 'lucide-react'

const border = (o = 0.06) => `1px solid rgba(255,255,255,${o})`
const bg     = (o = 0.03) => `rgba(255,255,255,${o})`

export function PedModelPanel({ gender, onPedModelChange }) {
  const models = [
    { id: 'mp_m_freemode_01', label: 'Male',   active: gender === 'male'   },
    { id: 'mp_f_freemode_01', label: 'Female', active: gender === 'female' },
  ]

  return (
    <div className="flex flex-col h-full">
      <div style={{ padding: '12px 14px 10px', flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#eee', letterSpacing: '-0.02em' }}>Ped Model</p>
        <p style={{ fontSize: 10, color: '#444', marginTop: 2 }}>Switch between male and female character</p>
      </div>

      <div style={{ padding: '10px 14px' }}>
        <p style={{ fontSize: 9, color: '#ef4444', marginBottom: 14, lineHeight: 1.5 }}>
          Warning: Switching ped model will reset your appearance to default for that model.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          {models.map(m => (
            <button
              key={m.id}
              onClick={() => { if (!m.active) onPedModelChange(m.id) }}
              style={{
                flex: 1, height: 80, borderRadius: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: m.active ? bg(0.08) : bg(0.02),
                border: m.active ? '1px solid rgba(255,255,255,0.25)' : border(0.06),
                cursor: m.active ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}>
              <User style={{ width: 20, height: 20, color: m.active ? '#eee' : '#555' }} />
              <span style={{ fontSize: 12, fontWeight: m.active ? 700 : 500, color: m.active ? '#eee' : '#666' }}>
                {m.label}
              </span>
              {m.active && (
                <span style={{
                  fontSize: 8, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  Active
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
