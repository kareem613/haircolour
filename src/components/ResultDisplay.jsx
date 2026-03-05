import { useState, useEffect } from 'react'
import './ResultDisplay.css'

export function ResultDisplay({ original, tabs, settings, onTryAgain, onStartOver }) {
  const [activeTab, setActiveTab] = useState(null)
  const [zoomed, setZoomed] = useState(false)

  // Auto-select first tab, and switch to a newly-completed tab if current is still loading
  useEffect(() => {
    if (!activeTab && tabs.length > 0) {
      setActiveTab(tabs[0].key)
    }
  }, [tabs, activeTab])

  const allTabs = [
    ...tabs,
    { key: '_original', label: 'Original', status: 'done', image: original },
  ]

  const active = allTabs.find(t => t.key === activeTab) || allTabs[0]

  function getStatusIcon(tab) {
    if (tab.key === '_original') return null
    if (tab.status === 'done') return ' ✓'
    if (tab.status === 'error') return ' ✗'
    return null // spinner handled by CSS
  }

  function isLoading(tab) {
    return tab.status === 'generating' || tab.status === 'refining'
  }

  return (
    <div className="result-display">
      <h2 className="result-title">Your New Look</h2>

      <div className="result-tabs">
        {allTabs.map(tab => (
          <button
            key={tab.key}
            className={`result-tab ${activeTab === tab.key ? 'active' : ''} ${isLoading(tab) ? 'loading' : ''} ${tab.status === 'error' ? 'error' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}{getStatusIcon(tab)}
            {isLoading(tab) && <span className="tab-spinner" />}
          </button>
        ))}
      </div>

      <div
        className={`result-image-container ${zoomed ? 'zoomed' : ''}`}
        onClick={() => active.image && setZoomed(z => !z)}
      >
        {active.status === 'generating' && (
          <div className="result-loading">
            <div className="spinner" />
            <p>Generating preview...</p>
          </div>
        )}
        {active.status === 'refining' && (
          <div className="result-loading">
            <div className="spinner" />
            <p>Adding finishing touches...</p>
          </div>
        )}
        {active.status === 'error' && (
          <div className="result-loading">
            <p className="result-error-text">{active.error || 'Generation failed'}</p>
          </div>
        )}
        {active.status === 'done' && active.image && (
          <>
            <img src={active.image} alt={active.label} className="result-image" />
            {!zoomed && <span className="zoom-hint">Tap to zoom</span>}
          </>
        )}
      </div>

      {active.key !== '_original' && (
        <div className="settings-summary">
          <span className="settings-pill">{settings.style}</span>
          <span className="settings-pill">{settings.colour}</span>
          {active.label && active.key !== '_default' && (
            <span className="settings-pill">{active.label}</span>
          )}
          {settings.moneyPiece && (
            <span className="settings-pill">Money Piece</span>
          )}
        </div>
      )}

      <div className="result-actions">
        <button className="btn btn-primary" onClick={onTryAgain}>Try Different Style</button>
        <button className="btn btn-secondary" onClick={onStartOver}>New Selfie</button>
      </div>
    </div>
  )
}
