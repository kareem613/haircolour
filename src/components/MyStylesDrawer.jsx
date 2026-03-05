import { useEffect, useState } from 'react'
import './MyStylesDrawer.css'

const MAX_SLOTS = 6
const FEEDBACK_EMOJI = { love: '❤️', maybe: '🤔' }

export function MyStylesDrawer({
  collection,
  open,
  onToggle,
  onRemove,
  replaceCandidate,
  onReplace,
  onCancelReplace,
  onShareRequest,
}) {
  const [zoomedItem, setZoomedItem] = useState(null)
  const [shareMode, setShareMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [shareMessage, setShareMessage] = useState('')
  const [shareStatus, setShareStatus] = useState('idle')
  const [shareError, setShareError] = useState('')
  const [bumpDismissed, setBumpDismissed] = useState(false)
  const count = collection.length
  const isReplaceMode = !!replaceCandidate

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => collection[i] || null)

  useEffect(() => {
    if (count === 0) {
      setBumpDismissed(false)
      return
    }
    if (open) {
      setBumpDismissed(true)
    }
  }, [count, open])

  function resetShareState() {
    setShareMode(false)
    setSelectedIds([])
    setShareMessage('')
    setShareStatus('idle')
    setShareError('')
  }

  function handleToggleDrawer() {
    if (open) {
      resetShareState()
    }
    onToggle()
  }

  function handleSelectForShare(itemId) {
    setSelectedIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    )
  }

  async function handleSubmitShare() {
    if (!selectedIds.length || !onShareRequest) return
    setShareStatus('submitting')
    setShareError('')
    try {
      await onShareRequest(selectedIds, shareMessage.trim())
      setShareStatus('success')
      setSelectedIds([])
      setShareMessage('')
    } catch (err) {
      setShareStatus('error')
      setShareError(err.message || 'Failed to send request')
    }
  }

  return (
    <>
      <div className={`drawer-bar ${count > 0 && !open && !bumpDismissed ? 'drawer-bar-has-items' : ''}`} onClick={handleToggleDrawer}>
        <span className="drawer-bar-label">── My Styles ({count}/{MAX_SLOTS}) ──</span>
      </div>

      {open && (
        <div className="drawer-overlay">
          <div className="drawer-panel">
            <div className="drawer-header">
              {isReplaceMode ? (
                <>
                  <span className="drawer-title">Collection full — choose one to replace</span>
                  <button className="drawer-close" onClick={onCancelReplace}>Cancel</button>
                </>
              ) : (
                <>
                  <span className="drawer-title">My Styles ({count}/{MAX_SLOTS})</span>
                  <button className="drawer-close" onClick={handleToggleDrawer}>Close</button>
                </>
              )}
            </div>

            {!isReplaceMode && (
              <div className="drawer-share">
                <button
                  className="drawer-share-btn"
                  onClick={() => setShareMode(v => !v)}
                  disabled={count === 0}
                >
                  Share selected styles with Guisselle
                </button>
                {shareMode && (
                  <div className="drawer-share-panel">
                    <p className="drawer-share-hint">Tap images below to select multiple styles.</p>
                    <textarea
                      className="drawer-share-message"
                      value={shareMessage}
                      onChange={e => setShareMessage(e.target.value)}
                      placeholder="Optional note for Guisselle"
                      rows={3}
                    />
                    <button
                      className="drawer-share-submit"
                      onClick={handleSubmitShare}
                      disabled={shareStatus === 'submitting' || selectedIds.length === 0}
                    >
                      {shareStatus === 'submitting' ? 'Sending…' : `Send ${selectedIds.length || ''} selected`}
                    </button>
                    {shareStatus === 'success' && <p className="drawer-share-success">Sent to Guisselle ✅</p>}
                    {shareStatus === 'error' && <p className="drawer-share-error">{shareError}</p>}
                  </div>
                )}
              </div>
            )}

            <div className="drawer-grid">
              {slots.map((item, i) => (
                <div
                  key={item?.id || `empty-${i}`}
                  className={`drawer-slot ${item ? 'filled' : 'empty'} ${isReplaceMode && item ? 'replaceable' : ''} ${shareMode && selectedIds.includes(item?.id) ? 'selected' : ''}`}
                >
                  {item ? (
                    <>
                      <div
                        className="drawer-slot-image-wrap"
                        onClick={() => {
                          if (isReplaceMode) return onReplace(item.id)
                          if (shareMode) return handleSelectForShare(item.id)
                          setZoomedItem(item)
                        }}
                      >
                        <img src={item.image} alt={`${item.style} ${item.colour}`} className="drawer-slot-image" />
                        {isReplaceMode && <span className="replace-badge">Tap to replace</span>}
                        {shareMode && (
                          <span className="share-select-badge">{selectedIds.includes(item.id) ? '✓ Selected' : 'Tap to select'}</span>
                        )}
                      </div>
                      <div className="drawer-slot-info">
                        <span className="drawer-slot-emoji">{FEEDBACK_EMOJI[item.feedback] || ''}</span>
                        <span className="drawer-slot-text">{item.style}</span>
                        <span className="drawer-slot-text">{item.colour}</span>
                        {item.moneyPiece && <span className="drawer-slot-badge">MP</span>}
                      </div>
                      {!isReplaceMode && !shareMode && (
                        <button className="drawer-slot-remove" onClick={() => onRemove(item.id)}>×</button>
                      )}
                    </>
                  ) : (
                    <div className="drawer-slot-placeholder">
                      <span className="placeholder-icon">+</span>
                      <span className="placeholder-text">Empty slot</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {zoomedItem && (
        <div className="drawer-zoom-overlay" onClick={() => setZoomedItem(null)}>
          <img src={zoomedItem.image} alt={`${zoomedItem.style} ${zoomedItem.colour}`} className="drawer-zoom-image" />
        </div>
      )}
    </>
  )
}
