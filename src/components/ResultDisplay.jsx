import './ResultDisplay.css'

export function ResultDisplay({ original, result, onTryAgain, onStartOver }) {
  return (
    <div className="result-display">
      <h2 className="result-title">Your New Look</h2>
      <div className="result-images">
        <div className="result-image-wrapper">
          <span className="result-label">Before</span>
          <img src={original} alt="Original selfie" className="result-image" />
        </div>
        <div className="result-image-wrapper">
          <span className="result-label">After</span>
          <img src={result} alt="Generated preview" className="result-image" />
        </div>
      </div>
      <div className="result-actions">
        <button className="btn btn-primary" onClick={onTryAgain}>Try Different Style</button>
        <button className="btn btn-secondary" onClick={onStartOver}>New Selfie</button>
      </div>
    </div>
  )
}
