import { useState } from 'react'
import './MyStylesDrawer.css'

const MAX_SLOTS = 6
const FEEDBACK_EMOJI = { love: '❤️', maybe: '🤔' }

export function MyStylesDrawer({ collection, open, onToggle, onRemove, replaceCandidate, onReplace, onCancelReplace }) {
  const [zoomedItem, setZoomedItem] = useState(null)
  const count = collection.length
  const isReplaceMode = !!replaceCandidate

  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => collection[i] || null)

  return (
    <>
      {/* Collapsed bar — always visible */}
      <div className="drawer-bar" onClick={onToggle}>
        <span className="drawer-bar-label">── My Styles ({count}/{MAX_SLOTS}) ──</span>
      </div>

      {/* Expanded overlay */}
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
                  <button className="drawer-close" onClick={onToggle}>Close</button>
                </>
              )}
            </div>

            <div className="drawer-grid">
              {slots.map((item, i) => (
                <div key={item?.id || `empty-${i}`} className={`drawer-slot ${item ? 'filled' : 'empty'} ${isReplaceMode && item ? 'replaceable' : ''}`}>
                  {item ? (
                    <>
                      <div
                        className="drawer-slot-image-wrap"
                        onClick={() => isReplaceMode ? onReplace(item.id) : setZoomedItem(item)}
                      >
                        <img src={item.image} alt={`${item.style} ${item.colour}`} className="drawer-slot-image" />
                        {isReplaceMode && <span className="replace-badge">Tap to replace</span>}
                      </div>
                      <div className="drawer-slot-info">
                        <span className="drawer-slot-emoji">{FEEDBACK_EMOJI[item.feedback] || ''}</span>
                        <span className="drawer-slot-text">{item.style}</span>
                        <span className="drawer-slot-text">{item.colour}</span>
                        {item.moneyPiece && <span className="drawer-slot-badge">MP</span>}
                      </div>
                      {!isReplaceMode && (
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

      {/* Zoom overlay */}
      {zoomedItem && (
        <div className="drawer-zoom-overlay" onClick={() => setZoomedItem(null)}>
          <img src={zoomedItem.image} alt={`${zoomedItem.style} ${zoomedItem.colour}`} className="drawer-zoom-image" />
        </div>
      )}
    </>
  )
}
