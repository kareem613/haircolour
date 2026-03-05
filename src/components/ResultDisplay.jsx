import { useState, useMemo } from 'react'
import './ResultDisplay.css'

export function ResultDisplay({ original, result, rawGemini, masked, onTryAgain, onStartOver }) {
  const [activeView, setActiveView] = useState('result')
  const [zoomed, setZoomed] = useState(false)

  const isDebug = !!(rawGemini || masked)

  const views = useMemo(() => {
    const list = [
      { id: 'result', label: 'Final', src: result },
      { id: 'original', label: 'Original', src: original },
    ]
    if (isDebug) {
      if (rawGemini) list.push({ id: 'raw', label: 'AI Output', src: rawGemini })
      if (masked?.startsWith('data:')) list.push({ id: 'masked', label: 'Face Mask', src: masked })
    }
    return list
  }, [original, result, rawGemini, masked, isDebug])

  const activeImage = views.find(v => v.id === activeView) || views[0]

  return (
    <div className="result-display">
      <h2 className="result-title">Your New Look</h2>
      <div className="result-toggle">
        {views.map(v => (
          <button
            key={v.id}
            className={`toggle-btn ${activeView === v.id ? 'active' : ''}`}
            onClick={() => setActiveView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <div
        className={`result-image-container ${zoomed ? 'zoomed' : ''}`}
        onClick={() => setZoomed(z => !z)}
      >
        <img src={activeImage.src} alt={activeImage.label} className="result-image" />
        {!zoomed && <span className="zoom-hint">Tap to zoom</span>}
      </div>
      <div className="result-actions">
        <button className="btn btn-primary" onClick={onTryAgain}>Try Different Style</button>
        <button className="btn btn-secondary" onClick={onStartOver}>New Selfie</button>
      </div>
    </div>
  )
}
