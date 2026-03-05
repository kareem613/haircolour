import { useEffect, useRef, useState } from 'react'
import './ResultDisplay.css'

const FEEDBACK_OPTIONS = [
  { key: 'love', label: 'I Love It', emoji: '❤️' },
  { key: 'maybe', label: 'Maybe', emoji: '🤔' },
  { key: 'notforme', label: 'Not For Me', emoji: '👎' },
  { key: 'looksoff', label: 'Looks Off', emoji: '⚠️' },
]

export function ResultDisplay({ original, tabs, settings, feedback, onFeedbackChange, onRetry, onTryAgain, onStartOver }) {
  const [activeTab, setActiveTab] = useState(null)
  const [zoomed, setZoomed] = useState(false)
  const hasAutoSwitched = useRef(false)

  // Auto-select first generated tab (not Original)
  useEffect(() => {
    if (!activeTab && tabs.length > 0) {
      setActiveTab(tabs[0].key)
    }
  }, [tabs, activeTab])

  // Auto-switch to the first tab that completes
  useEffect(() => {
    if (hasAutoSwitched.current) return
    const firstDone = tabs.find(t => t.status === 'done')
    if (firstDone) {
      setActiveTab(firstDone.key)
      hasAutoSwitched.current = true
    }
  }, [tabs])

  const allTabs = [
    { key: '_original', label: 'Original', status: 'done', image: original },
    ...tabs,
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
            {onRetry && (
              <button className="btn btn-primary retry-btn" onClick={() => onRetry(active.key)}>
                Retry
              </button>
            )}
          </div>
        )}
        {active.status === 'done' && active.image && (
          <>
            <img src={active.image} alt={active.label} className="result-image" />
            {!zoomed && <span className="zoom-hint">Tap to zoom</span>}
          </>
        )}
      </div>

      {active.key !== '_original' && active.status === 'done' && (
        <div className="feedback-row">
          {FEEDBACK_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`feedback-btn ${feedback[active.key] === opt.key ? 'selected' : ''}`}
              onClick={() => onFeedbackChange(active.key, opt.key)}
            >
              <span className="feedback-emoji">{opt.emoji}</span>
              <span className="feedback-label">{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {feedback[active.key] === 'looksoff' && onRetry && (
        <button
          className="btn btn-primary regenerate-btn"
          onClick={() => {
            onFeedbackChange(active.key, null)
            onRetry(active.key)
          }}
        >
          Regenerate This Style
        </button>
      )}

      {active.key !== '_original' && (
        <div className="settings-summary">
          <span className="settings-pill">{settings.style}</span>
          <span className="settings-pill">{settings.colour}</span>
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
