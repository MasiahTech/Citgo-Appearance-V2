import React, { useState } from 'react'
import { Check, X } from 'lucide-react'
import { CategorySidebar } from './CategorySidebar'
import { DrawableGrid }    from './DrawableGrid'
import { SliderPanel }     from './SliderPanel'
import { OutfitPanel }     from './OutfitPanel'
import { PedModelPanel }   from './PedModelPanel'
import { TattooPanel }     from './TattooPanel'
import { StarterOutfitPanel } from './StarterOutfitPanel'

const border = (o = 0.06) => `1px solid rgba(255,255,255,${o})`
const bg     = (o = 0.03) => `rgba(255,255,255,${o})`

const CAM_PRESETS = [
  { id: 'face',  label: 'Face'  },
  { id: 'chest', label: 'Chest' },
  { id: 'full',  label: 'Full'  },
  { id: 'feet',  label: 'Feet'  },
]

export function AppearanceEditor({
  gender, slots, localState,
  outfits, jobOutfits, outfitError,
  shopType, shopLabel, shopPrice, categories,
  editorMode, starterOutfits, isBoss, jobName, jobLabel,
  tattooZones,
  pendingCode, codeLoading, codeError, importLoading, importError,
  onComponentChange, onPropChange, onPropRemove,
  onHairChange, onBlendChange, onOverlayChange, onEyeColorChange,
  onPedModelChange, onTattooToggle,
  onCameraPreset, onConfirm, onCancel,
  onApplyOutfit, onSaveOutfit, onDeleteOutfit,
  onGenerateCode, onImportCode, onClearCode,
  onSaveJobOutfit, onDeleteJobOutfit,
  onSaveStarterOutfit, onDeleteStarterOutfit,
}) {
  const defaultCategory = categories
    ? (categories.includes('component') ? null
      : categories.includes('hair') ? { type: 'hair', id: 'hair', label: 'Hair Style & Color' }
      : categories.includes('tattoo') ? { type: 'tattoo', id: 'ZONE_TORSO', label: 'Torso' }
      : null)
    : { type: 'outfits', id: 'outfits', label: 'Outfits' }
  const [activeCategory, setActiveCategory] = useState(defaultCategory)

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onCancel?.() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  // Confirm button label based on mode
  let confirmLabel = shopPrice ? `Purchase — $${shopPrice}` : 'Save'
  if (shopType === 'tattoo' && shopPrice && tattooZones) {
    let zonesWithTattoo = 0
    for (const [, tattoos] of Object.entries(tattooZones)) {
      if (tattoos.some(t => t.applied)) zonesWithTattoo++
    }
    const totalPrice = zonesWithTattoo * shopPrice
    confirmLabel = totalPrice > 0 ? `Purchase — $${totalPrice}` : 'Save'
  }
  if (editorMode === 'characterCreation') confirmLabel = 'Create Character'
  if (editorMode === 'starterOutfitAdmin') confirmLabel = 'Done'

  const renderRightPanel = () => {
    if (!activeCategory) return (
      <div className="h-full flex items-center justify-center">
        <span style={{ fontSize: 12, color: '#333' }}>Select a category</span>
      </div>
    )

    if (activeCategory.type === 'outfits') {
      return (
        <OutfitPanel
          key="outfits"
          outfits={outfits || []}
          jobOutfits={jobOutfits || []}
          localState={localState}
          isBoss={isBoss}
          jobLabel={jobLabel}
          onApply={onApplyOutfit}
          onSave={onSaveOutfit}
          onDelete={onDeleteOutfit}
          onGenerateCode={onGenerateCode}
          onImportCode={onImportCode}
          onClearCode={onClearCode}
          onSaveJobOutfit={onSaveJobOutfit}
          onDeleteJobOutfit={onDeleteJobOutfit}
          pendingCode={pendingCode}
          codeLoading={codeLoading}
          codeError={codeError}
          importLoading={importLoading}
          importError={importError}
          errorMessage={outfitError}
        />
      )
    }

    if (activeCategory.type === 'starterOutfits') {
      return (
        <StarterOutfitPanel
          key="starterOutfits"
          outfits={starterOutfits || []}
          isAdmin={editorMode === 'starterOutfitAdmin'}
          onApply={onApplyOutfit}
          onSave={onSaveStarterOutfit}
          onDelete={onDeleteStarterOutfit}
        />
      )
    }

    if (activeCategory.type === 'tattoo') {
      const zoneTattoos = tattooZones[activeCategory.id] || []
      return (
        <TattooPanel
          key={`tattoo-${activeCategory.id}`}
          zoneId={activeCategory.id}
          zoneLabel={activeCategory.label}
          tattoos={zoneTattoos}
          onToggle={onTattooToggle}
        />
      )
    }

    if (activeCategory.type === 'component') {
      const slot = slots.components.find(c => c.id === activeCategory.id)
      if (!slot) return null
      const current = localState.components[activeCategory.id] ?? { drawable: 0, texture: 0 }
      return (
        <DrawableGrid
          key={`comp-${activeCategory.id}`}
          type="component"
          slot={slot}
          gender={gender}
          current={current}
          onDrawableSelect={(d, t) => onComponentChange(activeCategory.id, d, t)}
        />
      )
    }

    if (activeCategory.type === 'prop') {
      const slot = slots.props.find(p => p.id === activeCategory.id)
      if (!slot) return null
      const current = localState.props[activeCategory.id] ?? { drawable: -1, texture: 0 }
      return (
        <DrawableGrid
          key={`prop-${activeCategory.id}`}
          type="prop"
          slot={slot}
          gender={gender}
          current={current}
          onDrawableSelect={(d, t) => onPropChange(activeCategory.id, d, t)}
          onRemove={() => onPropRemove(activeCategory.id)}
        />
      )
    }

    if (activeCategory.type === 'hair') {
      const hairSlot = { numDrawables: slots.hairDrawables ?? 74 }
      return <SliderPanel key="hair" mode="hair" localState={localState} gender={gender} hairSlot={hairSlot} onHairChange={onHairChange} />
    }
    if (activeCategory.type === 'headBlend') {
      return <SliderPanel key="headBlend" mode="headBlend" localState={localState} onBlendChange={onBlendChange} />
    }
    if (activeCategory.type === 'headOverlays') {
      return (
        <SliderPanel
          key={`overlay-${activeCategory.id}`}
          mode="headOverlays"
          overlayName={activeCategory.id}
          overlayLabel={activeCategory.label}
          localState={localState}
          gender={gender}
          onOverlayChange={onOverlayChange}
        />
      )
    }
    if (activeCategory.type === 'eyeColor') {
      return <SliderPanel key="eyeColor" mode="eyeColor" localState={localState} onEyeColorChange={onEyeColorChange} />
    }
    if (activeCategory.type === 'pedModel') {
      return <PedModelPanel key="pedModel" gender={gender} onPedModelChange={onPedModelChange} />
    }
    return null
  }

  return (
    <div className="fixed inset-0 z-9998 bg-transparent pointer-events-none">

      {/* LEFT: Category sidebar */}
      <div
        data-no-orbit
        className="pointer-events-auto fixed left-5 top-5 bottom-5 z-9999 flex flex-col glass animate-enter"
        style={{ width: 260, borderRadius: 14, border: border(), boxShadow: '0 8px 40px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
        <CategorySidebar
          slots={slots}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          shopLabel={shopLabel}
          categories={categories}
          editorMode={editorMode}
          tattooZones={tattooZones}
        />
      </div>

      {/* RIGHT: Controls panel */}
      <div
        data-no-orbit
        className="pointer-events-auto fixed right-5 top-5 bottom-5 z-9999 flex flex-col glass animate-enter"
        style={{ width: 400, borderRadius: 14, border: border(), boxShadow: '0 8px 40px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

        <div className="flex-1 overflow-hidden">{renderRightPanel()}</div>

        {/* Camera preset row */}
        <div style={{ height: 1, background: bg(0.04) }} />
        <div className="flex items-center gap-1.5 shrink-0" style={{ padding: '6px 12px' }}>
          <span style={{ fontSize: 9, color: '#505050', flex: 1 }}>
            <span style={{ color: '#686868', fontWeight: 600 }}>Drag</span>{' '}rotate &nbsp;·&nbsp;
            <span style={{ color: '#686868', fontWeight: 600 }}>Scroll</span>{' '}zoom &nbsp;·&nbsp;
            <span style={{ color: '#686868', fontWeight: 600 }}>W/S</span>{' '}height
          </span>
          {CAM_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => onCameraPreset?.(p.id)}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#ddd' }}
              onMouseOut={e  => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#999' }}
              style={{
                height: 26, padding: '0 10px', borderRadius: 5,
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(255,255,255,0.07)',
                color: '#999',
                border: '1px solid rgba(255,255,255,0.15)',
                transition: 'color 0.1s',
              }}>
              {p.label}
            </button>
          ))}
          <button
            onClick={() => onCameraPreset?.('reset')}
            title="Reset camera"
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#ddd' }}
            onMouseOut={e  => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#999' }}
            style={{
              width: 26, height: 26, borderRadius: 5, fontSize: 15,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)',
              color: '#999',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.1s',
            }}>
            ↺
          </button>
        </div>

        {/* Save / Cancel */}
        <div style={{ height: 1, background: bg(0.04) }} />
        <div className="flex items-center gap-2 shrink-0" style={{ padding: '8px 12px' }}>
          <span style={{ flex: 1 }} />
          <button
            onClick={onConfirm}
            className="flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ height: 32, padding: '0 20px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: '#f5f5f5', color: '#000', border: 'none' }}>
            <Check style={{ width: 11, height: 11 }} strokeWidth={3} />
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ height: 32, padding: '0 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'transparent', color: '#666', border: border(0.12) }}>
            <X style={{ width: 10, height: 10 }} />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
