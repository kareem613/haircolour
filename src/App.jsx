import { useState } from 'react'
import { CameraCapture } from './components/CameraCapture'
import { StyleSelector } from './components/StyleSelector'
import { ColourSelector } from './components/ColourSelector'
import { ModelSelector } from './components/ModelSelector'
import { ResultDisplay } from './components/ResultDisplay'
import { generatePreview } from './lib/api'
import { MODELS } from './lib/constants'
import './App.css'

function App() {
  const [step, setStep] = useState('capture')
  const [selfieData, setSelfieData] = useState(null)
  const [style, setStyle] = useState(null)
  const [moneyPiece, setMoneyPiece] = useState(false)
  const [colour, setColour] = useState(null)
  const [model, setModel] = useState(MODELS[MODELS.length - 1].id)
  const [resultImage, setResultImage] = useState(null)
  const [error, setError] = useState(null)

  function handleCapture(dataUrl) {
    setSelfieData(dataUrl)
    setStep('options')
  }

  async function handleGenerate() {
    setError(null)
    setStep('generating')
    try {
      const result = await generatePreview({
        selfieDataUrl: selfieData,
        style,
        moneyPiece,
        colour,
        model
      })
      setResultImage(result.imageUrl)
      setStep('result')
    } catch (err) {
      setError(err.message)
      setStep('options')
    }
  }

  function handleTryAgain() {
    setResultImage(null)
    setStyle(null)
    setMoneyPiece(false)
    setColour(null)
    setError(null)
    setStep('options')
  }

  function handleStartOver() {
    setSelfieData(null)
    setResultImage(null)
    setStyle(null)
    setMoneyPiece(false)
    setColour(null)
    setError(null)
    setStep('capture')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hair Colour Preview</h1>
      </header>
      <main className="app-body">
        {step === 'capture' && (
          <CameraCapture onCapture={handleCapture} />
        )}

        {step === 'options' && (
          <div className="options-screen">
            <img src={selfieData} alt="Your selfie" className="selfie-preview" />
            {error && <div className="error-banner">{error}</div>}
            <StyleSelector value={style} moneyPiece={moneyPiece} onChange={setStyle} onMoneyPieceChange={setMoneyPiece} />
            <ColourSelector value={colour} onChange={setColour} />
            <ModelSelector value={model} onChange={setModel} />
            <button
              className="btn btn-primary"
              disabled={!style || !colour}
              onClick={handleGenerate}
            >
              Generate Preview
            </button>
            <button className="btn btn-ghost" onClick={handleStartOver}>
              Retake Selfie
            </button>
          </div>
        )}

        {step === 'generating' && (
          <div className="generating-screen">
            <div className="spinner" />
            <p>Creating your preview...</p>
          </div>
        )}

        {step === 'result' && (
          <ResultDisplay
            original={selfieData}
            result={resultImage}
            onTryAgain={handleTryAgain}
            onStartOver={handleStartOver}
          />
        )}
      </main>
      <footer className="app-footer">
        {__APP_VERSION__} ({__COMMIT_SHA__})
      </footer>
    </div>
  )
}

export default App
