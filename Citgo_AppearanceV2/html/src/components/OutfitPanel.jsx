/**
 * OutfitPanel — Outfit management backed by illenium-appearance's SQL system.
 * Personal outfits: save, delete, share codes, import.
 * Job outfits: bosses can create (with min grade) and delete; non-bosses can only wear.
 */

import React, { useState, useEffect } from 'react'
import { Check, Trash2, Share2, Download, Briefcase, User, Copy, Loader, Plus } from 'lucide-react'

const border = (o = 0.06) => `1px solid rgba(255,255,255,${o})`
const bg     = (o = 0.03) => `rgba(255,255,255,${o})`

function Tab({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, fontSize: 10, fontWeight: active ? 700 : 500, cursor: 'pointer',
        background: active ? bg(0.07) : 'transparent',
        color: active ? '#ddd' : '#555',
        border: 'none',
        borderBottom: active ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
        transition: 'all 0.12s',
      }}>
      {Icon && <Icon style={{ width: 10, height: 10 }} />}
      {label}
    </button>
  )
}

function CodePopup({ code, onClose }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    try {
      const el = document.createElement('textarea')
      el.value = code
      el.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none'
      document.body.appendChild(el)
      el.focus()
      el.select()
      el.setSelectionRange(0, 99999)
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* user can manually select */ }
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 10,
      background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', borderRadius: 10, background: 'rgba(14,14,16,0.97)',
        border: border(0.12), padding: 18,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#eee', marginBottom: 4 }}>
          Outfit Share Code
        </p>
        <p style={{ fontSize: 9, color: '#444', marginBottom: 14 }}>
          Share this code. Anyone can paste it in the Import tab to get your outfit.
        </p>

        <div style={{
          textAlign: 'center', letterSpacing: '0.25em', fontSize: 22, fontWeight: 800,
          fontFamily: 'monospace', color: '#eee',
          background: bg(0.04), border: border(0.08), borderRadius: 8,
          padding: '14px 0', marginBottom: 14, wordBreak: 'break-all',
        }}>
          {code}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={copy}
            style={{
              flex: 1, height: 32, borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: copied ? 'rgba(34,197,94,0.2)' : bg(0.06),
              color: copied ? '#22c55e' : '#bbb',
              border: copied ? '1px solid rgba(34,197,94,0.3)' : border(0.1),
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.15s',
            }}>
            {copied
              ? <><Check style={{ width: 10, height: 10 }} /> Copied!</>
              : <><Copy  style={{ width: 10, height: 10 }} /> Copy Code</>
            }
          </button>
          <button
            onClick={onClose}
            style={{
              height: 32, padding: '0 16px', borderRadius: 6, fontSize: 11, fontWeight: 500,
              background: 'transparent', color: '#555', border: border(0.08), cursor: 'pointer',
            }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function OutfitRow({ outfit, onApply, onDelete, onShare, shareLoading, isJob, canDelete }) {
  const [confirm, setConfirm] = useState(false)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '7px 10px', background: bg(0.02),
      border: border(0.04), borderRadius: 7, marginBottom: 5,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {outfit.name}
        </p>
        {outfit.minGrade != null && (
          <p style={{ fontSize: 9, color: '#555', marginTop: 1 }}>
            Min grade: {outfit.minGrade}
          </p>
        )}
      </div>

      <button onClick={() => onApply(outfit)} title="Wear outfit"
        style={{
          width: 26, height: 26, borderRadius: 5, border: border(0.08),
          background: bg(0.04), cursor: 'pointer', color: '#888',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <Check style={{ width: 11, height: 11 }} strokeWidth={2.5} />
      </button>

      {!isJob && onShare && (
        <button
          onClick={() => onShare(outfit)}
          title="Get share code"
          disabled={shareLoading}
          style={{
            width: 26, height: 26, borderRadius: 5, border: border(0.08),
            background: bg(0.04), cursor: shareLoading ? 'default' : 'pointer', color: '#888',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          {shareLoading
            ? <Loader style={{ width: 9, height: 9, animation: 'spin 1s linear infinite' }} />
            : <Share2  style={{ width: 10, height: 10 }} />
          }
        </button>
      )}

      {(canDelete !== false) && onDelete && (
        <button
          onClick={() => { if (!confirm) { setConfirm(true) } else { onDelete(outfit.id) } }}
          onBlur={() => setConfirm(false)}
          title={confirm ? 'Click again to confirm delete' : 'Delete'}
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

export function OutfitPanel({
  outfits, jobOutfits, localState,
  isBoss, jobLabel,
  pendingCode, codeLoading, codeError, importLoading, importError,
  onApply, onSave, onDelete,
  onGenerateCode, onImportCode, onClearCode,
  onSaveJobOutfit, onDeleteJobOutfit,
  errorMessage,
}) {
  const [tab,        setTab]        = useState('personal')
  const [saveName,   setSaveName]   = useState('')
  const [codeInput,  setCodeInput]  = useState('')
  const [importName, setImportName] = useState('')

  // Boss job outfit creation
  const [jobOutfitName,  setJobOutfitName]  = useState('')
  const [jobOutfitGrade, setJobOutfitGrade] = useState('0')

  const [sharingOutfitId, setSharingOutfitId] = useState(null)

  useEffect(() => {
    if (pendingCode) setSharingOutfitId(null)
  }, [pendingCode])

  const handleShare = (outfit) => {
    setSharingOutfitId(outfit.id)
    onGenerateCode(outfit.id)
  }

  const handleSave = () => {
    const name = saveName.trim()
    if (!name) return
    onSave(name)
    setSaveName('')
  }

  const handleImport = () => {
    const code = codeInput.trim()
    const name = importName.trim()
    if (!code || !name) return
    onImportCode(code, name)
  }

  const handleSaveJobOutfit = () => {
    const name = jobOutfitName.trim()
    if (!name) return
    onSaveJobOutfit(name, parseInt(jobOutfitGrade) || 0)
    setJobOutfitName('')
    setJobOutfitGrade('0')
  }

  useEffect(() => {
    if (!importLoading && !importError) {
      setCodeInput('')
      setImportName('')
    }
  }, [importLoading])

  const hasJobOutfits = jobOutfits && jobOutfits.length > 0
  const importReady   = codeInput.trim().length > 0 && importName.trim().length > 0 && !importLoading

  return (
    <div className="flex flex-col h-full" style={{ position: 'relative' }}>

      {pendingCode && (
        <CodePopup code={pendingCode} onClose={onClearCode} />
      )}

      <div style={{ padding: '12px 14px 10px', flexShrink: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#eee', letterSpacing: '-0.02em' }}>Outfits</p>
        <p style={{ fontSize: 10, color: '#444', marginTop: 2 }}>Save &amp; manage your looks</p>
      </div>

      {(errorMessage || codeError) && (
        <div style={{ margin: '0 14px 8px', padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p style={{ fontSize: 10, color: '#ef4444' }}>{errorMessage || codeError}</p>
        </div>
      )}

      <div style={{ display: 'flex', borderBottom: border(0.04), flexShrink: 0 }}>
        <Tab label="My Outfits" icon={User}     active={tab === 'personal'} onClick={() => setTab('personal')} />
        {(hasJobOutfits || isBoss) && (
          <Tab label={jobLabel || 'Job'} icon={Briefcase} active={tab === 'job'} onClick={() => setTab('job')} />
        )}
        <Tab label="Import"    icon={Download}  active={tab === 'import'}   onClick={() => setTab('import')} />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ padding: '10px 12px' }}>

        {/* Personal outfits */}
        {tab === 'personal' && (
          <>
            {outfits.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 11, color: '#333' }}>No saved outfits yet.</p>
              </div>
            )}
            {outfits.map(o => (
              <OutfitRow
                key={o.id}
                outfit={o}
                onApply={onApply}
                onDelete={onDelete}
                onShare={handleShare}
                shareLoading={sharingOutfitId === o.id && codeLoading}
              />
            ))}

            <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: bg(0.02), border: border(0.04) }}>
              <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>
                Save Current Outfit
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
                    transition: 'all 0.12s',
                  }}>
                  Save
                </button>
              </div>
            </div>
          </>
        )}

        {/* Job outfits */}
        {tab === 'job' && (
          <>
            <p style={{ fontSize: 9, color: '#3a3a3a', marginBottom: 10 }}>
              {isBoss ? 'Manage job uniforms. Non-bosses can only wear these.' : 'Preset uniforms for your job.'}
            </p>

            {jobOutfits.map((o, i) => (
              <OutfitRow
                key={o.id || `job_${i}`}
                outfit={o}
                onApply={onApply}
                onDelete={isBoss ? onDeleteJobOutfit : null}
                canDelete={isBoss}
                isJob
              />
            ))}

            {!hasJobOutfits && !isBoss && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 11, color: '#333' }}>No job outfits available.</p>
              </div>
            )}

            {/* Boss: create new job outfit */}
            {isBoss && (
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: bg(0.02), border: border(0.04) }}>
                <p style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>
                  Create Job Outfit
                </p>
                <div style={{ display: 'flex', gap: 7, marginBottom: 7 }}>
                  <input
                    value={jobOutfitName}
                    onChange={e => setJobOutfitName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveJobOutfit()}
                    placeholder="Outfit name..."
                    maxLength={40}
                    style={{
                      flex: 1, height: 30, borderRadius: 6, background: bg(0.015),
                      border: border(0.06), padding: '0 10px', fontSize: 11,
                      color: '#ccc', outline: 'none', caretColor: '#888',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#666', flexShrink: 0 }}>Min Grade:</span>
                  <input
                    type="number"
                    value={jobOutfitGrade}
                    onChange={e => setJobOutfitGrade(e.target.value)}
                    min={0} max={99}
                    style={{
                      width: 50, height: 30, borderRadius: 6, background: bg(0.015),
                      border: border(0.06), padding: '0 8px', fontSize: 11,
                      color: '#ccc', outline: 'none', caretColor: '#888', textAlign: 'center',
                    }}
                  />
                  <span style={{ flex: 1 }} />
                  <button
                    onClick={handleSaveJobOutfit}
                    disabled={!jobOutfitName.trim()}
                    style={{
                      height: 30, padding: '0 14px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: jobOutfitName.trim() ? '#f0f0f0' : bg(0.03),
                      color: jobOutfitName.trim() ? '#000' : '#333',
                      border: 'none', cursor: jobOutfitName.trim() ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'all 0.12s',
                    }}>
                    <Plus style={{ width: 10, height: 10 }} />
                    Create
                  </button>
                </div>
                <p style={{ fontSize: 8, color: '#444', marginTop: 6 }}>
                  Saves your current clothing as a job outfit. Players at or above the min grade can wear it.
                </p>
              </div>
            )}
          </>
        )}

        {/* Import code */}
        {tab === 'import' && (
          <div>
            <p style={{ fontSize: 9, color: '#444', marginBottom: 10 }}>
              Enter a share code and a name for your new outfit.
              Only clothing &amp; props will be applied — hair and face features are untouched.
            </p>

            <input
              value={importName}
              onChange={e => setImportName(e.target.value)}
              placeholder="Name for this outfit..."
              maxLength={40}
              style={{
                width: '100%', height: 32, borderRadius: 6, marginBottom: 8,
                background: bg(0.015), border: border(0.06),
                padding: '0 12px', fontSize: 11,
                color: '#ccc', outline: 'none', caretColor: '#888',
                boxSizing: 'border-box',
              }}
            />

            <input
              value={codeInput}
              onChange={e => setCodeInput(e.target.value.trim())}
              onKeyDown={e => e.key === 'Enter' && importReady && handleImport()}
              placeholder="Paste share code..."
              maxLength={20}
              style={{
                width: '100%', height: 42, borderRadius: 8,
                background: bg(0.015),
                border: codeInput.length > 0 ? '1px solid rgba(255,255,255,0.2)' : border(0.06),
                padding: '0 14px',
                fontSize: 16, fontWeight: 800, letterSpacing: '0.2em',
                color: '#eee', outline: 'none', caretColor: '#888',
                fontFamily: 'monospace', textAlign: 'center',
                boxSizing: 'border-box', transition: 'border-color 0.15s',
              }}
            />

            {importError && (
              <p style={{ fontSize: 10, color: '#ef4444', marginTop: 5 }}>{importError}</p>
            )}

            <button
              onClick={handleImport}
              disabled={!importReady}
              style={{
                width: '100%', height: 34, marginTop: 10, borderRadius: 6,
                fontSize: 11, fontWeight: 700,
                background: importReady ? '#f0f0f0' : bg(0.03),
                color:      importReady ? '#000'    : '#333',
                border: 'none', cursor: importReady ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.12s',
              }}>
              {importLoading
                ? <><Loader style={{ width: 11, height: 11 }} /> Importing...</>
                : <><Download style={{ width: 11, height: 11 }} /> Import &amp; Apply</>
              }
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
