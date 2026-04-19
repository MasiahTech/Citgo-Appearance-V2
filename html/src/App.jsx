import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AppearanceEditor } from './components/AppearanceEditor'
import { fetchNUI, setResourceName } from './utils/fetchNUI'

// ── NUI bridge ───────────────────────────────────────────────────────────────
export { fetchNUI }

// ── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [visible, setVisible] = useState(false)
  const [gender,  setGender]  = useState('male')
  const [slots,   setSlots]   = useState(null)

  // Shop state
  const [shopType,   setShopType]   = useState(null)
  const [shopLabel,  setShopLabel]  = useState(null)
  const [shopPrice,  setShopPrice]  = useState(null)
  const [categories, setCategories] = useState(null)

  // Editor mode state
  const [editorMode,     setEditorMode]     = useState(null)
  const [starterOutfits, setStarterOutfits] = useState([])

  // Job outfit state
  const [isBoss,    setIsBoss]    = useState(false)
  const [jobName,   setJobName]   = useState(null)
  const [jobLabel,  setJobLabel]  = useState(null)

  // Tattoo state
  const [tattooZones, setTattooZones] = useState({})

  // Outfit state
  const [outfits,      setOutfits]      = useState([])
  const [jobOutfits,   setJobOutfits]   = useState([])
  const [outfitError,  setOutfitError]  = useState(null)
  // Share code state
  const [pendingCode,  setPendingCode]  = useState(null)
  const [codeLoading,  setCodeLoading]  = useState(false)
  const [codeError,    setCodeError]    = useState(null)
  // Import state
  const [importLoading, setImportLoading] = useState(false)
  const [importError,   setImportError]   = useState(null)

  // Local selection state — tracks what the UI shows as "selected"
  const [localState, setLocalState] = useState({
    components: {}, props: {}, hair: {}, headBlend: {}, headOverlays: {}, eyeColor: 0,
  })
  // Visual-only hide state — tracks which slots are temporarily hidden on the ped
  const [hiddenSlots, setHiddenSlots] = useState({})
  // Ref so outfit-save callbacks always see the latest state without stale closures
  const localStateRef = useRef(localState)
  useEffect(() => { localStateRef.current = localState }, [localState])

  // ── NUI messages ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const d = e.data
      if (!d?.type) return

      // ── Initial open ──
      if (d.type === 'open') {
        if (d.resourceName) setResourceName(d.resourceName)
        setGender(d.gender || 'male')
        setSlots(d.slots || { components: [], props: [] })
        setShopType(d.shopType || null)
        setShopLabel(d.shopLabel || null)
        setShopPrice(d.shopPrice || null)
        setCategories(d.categories || null)
        setEditorMode(d.editorMode || null)
        setStarterOutfits(d.starterOutfits || [])
        setIsBoss(false)
        setJobName(null)
        setJobLabel(null)
        setTattooZones({})

        const app = d.appearance || {}

        const comps = {}
        if (Array.isArray(app.components)) {
          app.components.forEach(c => { comps[c.component_id] = { drawable: c.drawable, texture: c.texture } })
        }
        const props = {}
        if (Array.isArray(app.props)) {
          app.props.forEach(p => { props[p.prop_id] = { drawable: p.drawable, texture: p.texture } })
        }

        setLocalState({
          components:   comps,
          props:        props,
          hair:         app.hair         || { style: 0, color: 0, highlight: 0 },
          headBlend:    app.headBlend    || {},
          headOverlays: app.headOverlays || {},
          eyeColor:     app.eyeColor     || 0,
        })
        setOutfits([])
        setJobOutfits([])
        setOutfitError(null)
        setHiddenSlots({})
        setVisible(true)

        // Fetch tattoo data if tattoo shop
        if (d.categories && d.categories.includes('tattoo')) {
          fetchNUI('getTattooData').then(res => {
            if (res?.zones) setTattooZones(res.zones)
          }).catch(() => {})
        }

        return
      }

      // ── Ped model changed (surgeon gender switch) ──
      if (d.type === 'pedModelChanged') {
        setGender(d.gender || 'male')
        setSlots(d.slots || { components: [], props: [] })
        if (d.starterOutfits !== undefined) setStarterOutfits(d.starterOutfits || [])

        const app = d.appearance || {}
        const comps = {}
        if (Array.isArray(app.components)) {
          app.components.forEach(c => { comps[c.component_id] = { drawable: c.drawable, texture: c.texture } })
        }
        const props = {}
        if (Array.isArray(app.props)) {
          app.props.forEach(p => { props[p.prop_id] = { drawable: p.drawable, texture: p.texture } })
        }
        setLocalState({
          components:   comps,
          props:        props,
          hair:         app.hair         || { style: 0, color: 0, highlight: 0 },
          headBlend:    app.headBlend    || {},
          headOverlays: app.headOverlays || {},
          eyeColor:     app.eyeColor     || 0,
        })
        return
      }

      // ── Outfit list update (async, arrives shortly after open) ──
      if (d.type === 'outfits') {
        setOutfits(d.outfits || [])
        if (d.jobOutfits) setJobOutfits(d.jobOutfits)
        return
      }

      // ── Job outfit update ──
      if (d.type === 'jobOutfits') {
        setJobOutfits(d.jobOutfits || [])
        if (d.isBoss !== undefined) setIsBoss(d.isBoss)
        if (d.jobName)  setJobName(d.jobName)
        if (d.jobLabel) setJobLabel(d.jobLabel)
        return
      }

      // ── Starter outfits updated (from admin save/delete) ──
      if (d.type === 'starterOutfitsUpdated') {
        setStarterOutfits(d.starterOutfits || [])
        return
      }

      // ── Outfit error ──
      if (d.type === 'outfitError') {
        setOutfitError(d.message)
        setTimeout(() => setOutfitError(null), 4000)
        return
      }

      // ── Share code received ──
      if (d.type === 'outfitCode') {
        setCodeLoading(false)
        setPendingCode(d.code)
        return
      }

      // ── Imported outfit received ──
      if (d.type === 'importedOutfit') {
        setImportLoading(false)
        setImportError(null)
        if (d.outfit) {
          const components = d.outfit.components || {}
          const props      = d.outfit.props      || {}
          setLocalState(prev => ({
            ...prev,
            components: { ...prev.components, ...components },
            props:      { ...prev.props,      ...props      },
          }))
          fetchNUI('applyOutfit', { components, props })
        }
        return
      }

      // ── Code error (invalid/expired) ──
      if (d.type === 'codeError') {
        setCodeLoading(false)
        setImportLoading(false)
        setImportError(d.message)
        setTimeout(() => setImportError(null), 4000)
        return
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // ── Hide drawables per component (bare/nude defaults) ───────────────────
  const HIDE_DRAWABLES = { 3: 15, 4: 15, 6: 15, 8: 15, 11: 15 }

  // ── Clothing / prop change handlers ──────────────────────────────────────

  const handleComponentChange = useCallback((id, drawable, texture) => {
    setLocalState(prev => ({
      ...prev,
      components: { ...prev.components, [id]: { drawable, texture } },
    }))
    setHiddenSlots(prev => {
      if (!prev[`comp_${id}`]) return prev
      const next = { ...prev }
      delete next[`comp_${id}`]
      return next
    })
    fetchNUI('applyComponent', { id, drawable, texture })
  }, [])

  const handlePropChange = useCallback((id, drawable, texture) => {
    setLocalState(prev => ({
      ...prev,
      props: { ...prev.props, [id]: { drawable, texture } },
    }))
    setHiddenSlots(prev => {
      if (!prev[`prop_${id}`]) return prev
      const next = { ...prev }
      delete next[`prop_${id}`]
      return next
    })
    fetchNUI('applyProp', { id, drawable, texture })
  }, [])

  const handlePropRemove = useCallback((id) => {
    setLocalState(prev => ({
      ...prev,
      props: { ...prev.props, [id]: { drawable: -1, texture: 0 } },
    }))
    setHiddenSlots(prev => {
      if (!prev[`prop_${id}`]) return prev
      const next = { ...prev }
      delete next[`prop_${id}`]
      return next
    })
    fetchNUI('applyProp', { id, drawable: -1, texture: 0 })
  }, [])

  const handleHideToggle = useCallback((slotType, id) => {
    const key = `${slotType}_${id}`
    setHiddenSlots(prev => {
      const isHidden = !!prev[key]
      if (isHidden) {
        // Unhide: restore the real selected drawable
        const current = slotType === 'comp'
          ? localStateRef.current.components[id] ?? { drawable: 0, texture: 0 }
          : localStateRef.current.props[id] ?? { drawable: -1, texture: 0 }
        if (slotType === 'comp') {
          fetchNUI('applyComponent', { id, drawable: current.drawable, texture: current.texture })
        } else {
          fetchNUI('applyProp', { id, drawable: current.drawable, texture: current.texture })
        }
        const next = { ...prev }
        delete next[key]
        return next
      } else {
        // Hide: set ped to hide drawable without changing state
        if (slotType === 'comp') {
          const hideDrawable = HIDE_DRAWABLES[id] ?? 0
          fetchNUI('applyComponent', { id, drawable: hideDrawable, texture: 0 })
        } else {
          fetchNUI('applyProp', { id, drawable: -1, texture: 0 })
        }
        return { ...prev, [key]: true }
      }
    })
  }, [])

  const handleHairChange = useCallback((field, value) => {
    setLocalState(prev => {
      const hair = { ...prev.hair, [field]: value }
      fetchNUI('applyHair', hair)
      return { ...prev, hair }
    })
  }, [])

  const handleBlendChange = useCallback((field, value) => {
    setLocalState(prev => {
      const headBlend = { ...prev.headBlend, [field]: value }
      fetchNUI('applyBlend', headBlend)
      return { ...prev, headBlend }
    })
  }, [])

  const handleOverlayChange = useCallback((overlayName, field, value) => {
    setLocalState(prev => {
      const ov = { ...(prev.headOverlays[overlayName] || { style: 0, opacity: 0.0, color: 0, secondColor: 0 }), [field]: value }
      fetchNUI('applyOverlay', { name: overlayName, ...ov })
      return { ...prev, headOverlays: { ...prev.headOverlays, [overlayName]: ov } }
    })
  }, [])

  const handleEyeColorChange = useCallback((value) => {
    setLocalState(prev => ({ ...prev, eyeColor: value }))
    fetchNUI('applyEyeColor', { value })
  }, [])

  // ── Tattoo handlers ────────────────────────────────────────────────────────

  const handleTattooToggle = useCallback((tattoo, isApplied) => {
    setTattooZones(prev => {
      const updated = { ...prev }
      const zone = updated[tattoo.zone]
      if (!zone) return prev
      // One tattoo per zone: deselect all others, toggle the clicked one
      updated[tattoo.zone] = zone.map(t => {
        if (t.name === tattoo.name) return { ...t, applied: !isApplied }
        return { ...t, applied: false }
      })
      // Collect all applied tattoos across all zones
      const allApplied = []
      for (const [, tattoos] of Object.entries(updated)) {
        for (const t of tattoos) {
          if (t.applied) allApplied.push({ collection: t.collection, hash: t.hash })
        }
      }
      fetchNUI('applyTattooPreview', { tattoos: allApplied })
      return updated
    })
  }, [])

  // ── Outfit handlers ───────────────────────────────────────────────────────

  const handleApplyOutfit = useCallback((outfit) => {
    const components = outfit.components || {}
    const props      = outfit.props      || {}

    setLocalState(prev => ({
      ...prev,
      components: { ...prev.components, ...components },
      props:      { ...prev.props,      ...props      },
    }))

    fetchNUI('applyOutfit', { components, props })
  }, [])

  const handleSaveOutfit = useCallback((name) => {
    const { components, props } = localStateRef.current
    fetchNUI('saveOutfit', { name, components, props })
  }, [])

  const handleDeleteOutfit = useCallback((id) => {
    fetchNUI('deleteOutfit', { id })
  }, [])

  const handleGenerateCode = useCallback((outfitId) => {
    setCodeLoading(true)
    setCodeError(null)
    fetchNUI('generateOutfitCode', { outfitId })
  }, [])

  const handleImportCode = useCallback((code, name) => {
    setImportLoading(true)
    setImportError(null)
    fetchNUI('importOutfitCode', { code, name })
  }, [])

  const handleClearCode = useCallback(() => setPendingCode(null), [])

  const handlePedModelChange = useCallback((model) => {
    fetchNUI('changePedModel', { model })
  }, [])

  // ── Job outfit boss handlers ──────────────────────────────────────────────

  const handleSaveJobOutfit = useCallback((name, minGrade) => {
    const { components, props } = localStateRef.current
    fetchNUI('saveJobOutfit', { name, minGrade, components, props })
  }, [])

  const handleDeleteJobOutfit = useCallback((id) => {
    fetchNUI('deleteJobOutfit', { id })
  }, [])

  // ── Starter outfit handlers ───────────────────────────────────────────────

  const handleSaveStarterOutfit = useCallback((name) => {
    const { components, props } = localStateRef.current
    fetchNUI('saveStarterOutfit', { name, components, props })
  }, [])

  const handleDeleteStarterOutfit = useCallback((index) => {
    fetchNUI('deleteStarterOutfit', { index })
  }, [])

  // ── Camera / confirm / cancel ─────────────────────────────────────────────

  const handleCameraPreset = useCallback((preset) => {
    fetchNUI('setCameraPreset', { preset })
  }, [])

  const handleConfirm = useCallback(() => {
    setVisible(false)
    // Count zones with applied tattoos for cumulative pricing
    let tattooZoneCount = 0
    for (const [, tattoos] of Object.entries(tattooZones)) {
      if (tattoos.some(t => t.applied)) tattooZoneCount++
    }
    fetchNUI('confirm', { tattooZoneCount })
  }, [tattooZones])

  const handleCancel = useCallback(() => {
    setVisible(false)
    fetchNUI('cancel')
  }, [])

  // ── Orbit camera mouse / scroll controls ─────────────────────────────────
  const isDragging = useRef(false)
  const lastMouse  = useRef({ x: 0, y: 0 })

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('[data-no-orbit]')) return
    isDragging.current = true
    lastMouse.current  = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return
    const dx = e.clientX - lastMouse.current.x
    lastMouse.current = { x: e.clientX, y: e.clientY }
    if (dx !== 0) fetchNUI('rotateCamera', { deltaX: dx })
  }, [])

  const onMouseUp = useCallback(() => { isDragging.current = false }, [])

  const onWheel = useCallback((e) => {
    if (e.target.closest('[data-no-orbit]')) return
    fetchNUI('zoomCamera', { delta: e.deltaY > 0 ? 1 : -1 })
  }, [])

  // W/S = camera height, R = reset
  useEffect(() => {
    if (!visible) return
    const held = {}
    let frameId = null
    const tick = () => {
      if (held['w']) fetchNUI('adjustCamHeight', { delta:  1 })
      if (held['s']) fetchNUI('adjustCamHeight', { delta: -1 })
      frameId = requestAnimationFrame(tick)
    }
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const k = e.key.toLowerCase()
      if (k === 'r' && !held['r']) { held['r'] = true; fetchNUI('resetCamera') }
      else if ((k === 'w' || k === 's') && !held[k]) { e.preventDefault(); held[k] = true }
    }
    const onKeyUp = (e) => { delete held[e.key.toLowerCase()] }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    frameId = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [visible])

  if (!visible || !slots) return null

  return (
    <div
      className="fixed inset-0 z-9998 cursor-grab active:cursor-grabbing bg-transparent"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      onContextMenu={e => e.preventDefault()}>
      <AppearanceEditor
        gender={gender}
        slots={slots}
        localState={localState}
        outfits={outfits}
        jobOutfits={jobOutfits}
        outfitError={outfitError}
        shopType={shopType}
        shopLabel={shopLabel}
        shopPrice={shopPrice}
        categories={categories}
        editorMode={editorMode}
        starterOutfits={starterOutfits}
        isBoss={isBoss}
        jobName={jobName}
        jobLabel={jobLabel}
        tattooZones={tattooZones}
        hiddenSlots={hiddenSlots}
        onComponentChange={handleComponentChange}
        onPropChange={handlePropChange}
        onPropRemove={handlePropRemove}
        onHideToggle={handleHideToggle}
        onHairChange={handleHairChange}
        onBlendChange={handleBlendChange}
        onOverlayChange={handleOverlayChange}
        onEyeColorChange={handleEyeColorChange}
        onPedModelChange={handlePedModelChange}
        onTattooToggle={handleTattooToggle}
        onCameraPreset={handleCameraPreset}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onApplyOutfit={handleApplyOutfit}
        onSaveOutfit={handleSaveOutfit}
        onDeleteOutfit={handleDeleteOutfit}
        onGenerateCode={handleGenerateCode}
        onImportCode={handleImportCode}
        onClearCode={handleClearCode}
        onSaveJobOutfit={handleSaveJobOutfit}
        onDeleteJobOutfit={handleDeleteJobOutfit}
        onSaveStarterOutfit={handleSaveStarterOutfit}
        onDeleteStarterOutfit={handleDeleteStarterOutfit}
        pendingCode={pendingCode}
        codeLoading={codeLoading}
        codeError={codeError}
        importLoading={importLoading}
        importError={importError}
      />
    </div>
  )
}
