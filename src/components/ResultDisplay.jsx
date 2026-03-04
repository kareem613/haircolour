import { useState } from 'react'
import './ResultDisplay.css'

export function ResultDisplay({ original, result, onTryAgain, onStartOver }) {
  const [showBefore, setShowBefore] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  const imageSrc = showBefore ? original : result
  const imageAlt = showBefore ? 'Original selfie' : 'Generated preview'

  return (
    <div className="result-display">
      <h2 className="result-title">Your New Look</h2>
      <div className="result-toggle">
        <button
          className={`toggle-btn ${!showBefore ? 'active' : ''}`}
          onClick={() => setShowBefore(false)}
        >
          After
        </button>
        <button
          className={`toggle-btn ${showBefore ? 'active' : ''}`}
          onClick={() => setShowBefore(true)}
        >
          Before
        </button>
      </div>
      <div
        className={`result-image-container ${zoomed ? 'zoomed' : ''}`}
        onClick={() => setZoomed(z => !z)}
      >
        <img src={imageSrc} alt={imageAlt} className="result-image" />
        {!zoomed && <span className="zoom-hint">Tap to zoom</span>}
      </div>
      <div className="result-actions">
        <button className="btn btn-primary" onClick={onTryAgain}>Try Different Style</button>
        <button className="btn btn-secondary" onClick={onStartOver}>New Selfie</button>
      </div>
    </div>
  )
}
