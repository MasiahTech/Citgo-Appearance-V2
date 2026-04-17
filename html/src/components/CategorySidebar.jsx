import React, { useState } from 'react'
import {
  Shirt, ShoppingBag, Shield, Paintbrush, HardHat,
  Glasses, Watch, Gem, Footprints, Ear,
  User, Palette, Eye, Bookmark, ChevronDown, ChevronRight,
  PenTool, Star,
} from 'lucide-react'

const bg = (o = 0.03) => `rgba(255,255,255,${o})`

const ICON_MAP = {
  Shirt, ShoppingBag, Shield, Paintbrush, HardHat,
  Glasses, Watch, Gem, Footprints, Ear, User, Palette, Eye,
}

const OVERLAY_ITEMS = [
  { id: 'eyebrows',        label: 'Eyebrows'        },
  { id: 'beard',           label: 'Facial Hair'      },
  { id: 'makeUp',          label: 'Makeup'           },
  { id: 'blush',           label: 'Blush'            },
  { id: 'lipstick',        label: 'Lipstick'         },
  { id: 'complexion',      label: 'Complexion'       },
  { id: 'moleAndFreckles', label: 'Moles / Freckles' },
  { id: 'ageing',          label: 'Ageing'           },
  { id: 'sunDamage',       label: 'Sun Damage'       },
  { id: 'blemishes',       label: 'Blemishes'        },
  { id: 'chestHair',       label: 'Chest Hair'       },
  { id: 'bodyBlemishes',   label: 'Body Blemishes'   },
]

const TATTOO_ZONES = [
  { id: 'ZONE_TORSO',     label: 'Torso'     },
  { id: 'ZONE_HEAD',      label: 'Head'       },
  { id: 'ZONE_LEFT_ARM',  label: 'Left Arm'   },
  { id: 'ZONE_RIGHT_ARM', label: 'Right Arm'  },
  { id: 'ZONE_LEFT_LEG',  label: 'Left Leg'   },
  { id: 'ZONE_RIGHT_LEG', label: 'Right Leg'  },
]

function SectionHeader({ label, collapsed, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', padding: '10px 16px 5px', display: 'flex', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
        color: '#555', textTransform: 'uppercase', flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      {collapsed
        ? <ChevronRight style={{ width: 10, height: 10, color: '#444', flexShrink: 0 }} />
        : <ChevronDown  style={{ width: 10, height: 10, color: '#444', flexShrink: 0 }} />
      }
    </button>
  )
}

function CategoryItem({ icon: Icon, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 11,
        padding: '8px 16px',
        background: active ? bg(0.07) : 'transparent',
        border: 'none',
        borderLeft: active ? '2px solid rgba(255,255,255,0.35)' : '2px solid transparent',
        cursor: 'pointer', textAlign: 'left',
      }}>
      {Icon && (
        <Icon style={{ width: 14, height: 14, color: active ? '#bbb' : '#484848', flexShrink: 0 }} />
      )}
      <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#e0e0e0' : '#727272', flex: 1 }}>
        {label}
      </span>
      {count != null && (
        <span style={{ fontSize: 9, color: '#444', flexShrink: 0 }}>{count}</span>
      )}
      {active && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)', flexShrink: 0,
        }} />
      )}
    </button>
  )
}

export function CategorySidebar({ slots, activeCategory, onSelect, shopLabel, categories, editorMode, tattooZones }) {
  const [collapsed, setCollapsed] = useState({ hairFace: false, clothing: false, props: false, tattoo: false })

  const toggle = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))

  const allowed = (cat) => !categories || categories.includes(cat)

  const showOutfits   = allowed('outfits')
  const showHair      = allowed('hair')
  const showBlend     = allowed('headBlend')
  const showEyeColor  = allowed('eyeColor')
  const showPedModel  = allowed('pedModel')
  const showClothing  = allowed('component')
  const showProps     = allowed('prop')
  const showTattoo    = allowed('tattoo')
  const showStarter   = allowed('starterOutfits')

  const filteredOverlays = OVERLAY_ITEMS.filter(ov => allowed(`overlay:${ov.id}`))
  const hasHairFace = showHair || showBlend || showEyeColor || showPedModel || filteredOverlays.length > 0

  const availableTattooZones = showTattoo
    ? TATTOO_ZONES.filter(z => tattooZones && tattooZones[z.id] && tattooZones[z.id].length > 0)
    : []

  let headerTitle = shopLabel || 'Appearance'
  let headerSub   = shopLabel ? 'Browse available options' : 'Character editor'
  if (editorMode === 'characterCreation') {
    headerTitle = 'Create Character'
    headerSub   = 'Customize your appearance'
  } else if (editorMode === 'starterOutfitAdmin') {
    headerTitle = 'Starter Outfits'
    headerSub   = 'Manage default outfits'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      <div style={{ padding: '15px 16px 11px', flexShrink: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#eee', letterSpacing: '-0.02em' }}>
          {headerTitle}
        </p>
        <p style={{ fontSize: 11, color: '#444', marginTop: 3 }}>
          {headerSub}
        </p>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' }} />

      <div className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', paddingBottom: 10 }}>

        {/* Outfits */}
        {showOutfits && (
          <>
            <div style={{ padding: '8px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#555', textTransform: 'uppercase', flexShrink: 0 }}>
                Outfits
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            </div>
            <CategoryItem
              icon={Bookmark}
              label="My Outfits"
              active={activeCategory?.type === 'outfits'}
              onClick={() => onSelect({ type: 'outfits', id: 'outfits', label: 'Outfits' })}
            />
          </>
        )}

        {/* Starter Outfits */}
        {showStarter && (
          <CategoryItem
            icon={Star}
            label="Starter Outfits"
            active={activeCategory?.type === 'starterOutfits'}
            onClick={() => onSelect({ type: 'starterOutfits', id: 'starterOutfits', label: 'Starter Outfits' })}
          />
        )}

        {/* Hair & Face */}
        {hasHairFace && (
          <>
            <SectionHeader label="Hair & Face" collapsed={collapsed.hairFace} onToggle={() => toggle('hairFace')} />
            {!collapsed.hairFace && (
              <>
                {showPedModel && (
                  <CategoryItem icon={User} label="Ped Model"
                    active={activeCategory?.type === 'pedModel'}
                    onClick={() => onSelect({ type: 'pedModel', id: 'pedModel', label: 'Ped Model' })} />
                )}
                {showHair && (
                  <CategoryItem icon={User} label="Hair Style & Color"
                    active={activeCategory?.type === 'hair'}
                    onClick={() => onSelect({ type: 'hair', id: 'hair', label: 'Hair Style & Color' })} />
                )}
                {showBlend && (
                  <CategoryItem icon={Palette} label="Head Blend"
                    active={activeCategory?.type === 'headBlend'}
                    onClick={() => onSelect({ type: 'headBlend', id: 'headBlend', label: 'Head Blend' })} />
                )}
                {filteredOverlays.map(ov => (
                  <CategoryItem key={ov.id} icon={Paintbrush} label={ov.label}
                    active={activeCategory?.type === 'headOverlays' && activeCategory.id === ov.id}
                    onClick={() => onSelect({ type: 'headOverlays', id: ov.id, label: ov.label })} />
                ))}
                {showEyeColor && (
                  <CategoryItem icon={Eye} label="Eye Color"
                    active={activeCategory?.type === 'eyeColor'}
                    onClick={() => onSelect({ type: 'eyeColor', id: 'eyeColor', label: 'Eye Color' })} />
                )}
              </>
            )}
          </>
        )}

        {/* Clothing */}
        {showClothing && slots.components.length > 0 && (
          <>
            <SectionHeader label="Clothing" collapsed={collapsed.clothing} onToggle={() => toggle('clothing')} />
            {!collapsed.clothing && slots.components.map(comp => {
              const Icon = ICON_MAP[comp.icon] ?? Shirt
              return (
                <CategoryItem key={`comp-${comp.id}`} icon={Icon} label={comp.label}
                  active={activeCategory?.type === 'component' && activeCategory.id === comp.id}
                  onClick={() => onSelect({ type: 'component', id: comp.id, label: comp.label })} />
              )
            })}
          </>
        )}

        {/* Props */}
        {showProps && slots.props.length > 0 && (
          <>
            <SectionHeader label="Props" collapsed={collapsed.props} onToggle={() => toggle('props')} />
            {!collapsed.props && slots.props.map(prop => {
              const Icon = ICON_MAP[prop.icon] ?? HardHat
              return (
                <CategoryItem key={`prop-${prop.id}`} icon={Icon} label={prop.label}
                  active={activeCategory?.type === 'prop' && activeCategory.id === prop.id}
                  onClick={() => onSelect({ type: 'prop', id: prop.id, label: prop.label })} />
              )
            })}
          </>
        )}

        {/* Tattoo zones */}
        {showTattoo && availableTattooZones.length > 0 && (
          <>
            <SectionHeader label="Tattoos" collapsed={collapsed.tattoo} onToggle={() => toggle('tattoo')} />
            {!collapsed.tattoo && availableTattooZones.map(zone => (
              <CategoryItem
                key={zone.id}
                icon={PenTool}
                label={zone.label}
                count={tattooZones[zone.id]?.length}
                active={activeCategory?.type === 'tattoo' && activeCategory.id === zone.id}
                onClick={() => onSelect({ type: 'tattoo', id: zone.id, label: zone.label })}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}
