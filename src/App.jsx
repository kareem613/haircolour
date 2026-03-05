import { useState, useEffect } from 'react'
import { CameraCapture } from './components/CameraCapture'
import { StyleSelector } from './components/StyleSelector'
import { ColourSelector } from './components/ColourSelector'
import { ModelSelector } from './components/ModelSelector'
import { ResultDisplay } from './components/ResultDisplay'
import { generatePreview, refineWithOriginalFace } from './lib/api'
import { MODELS } from './lib/constants'
import { createFaceMaskedImage } from './lib/faceMask'
import './App.css'

const isDebug = new URLSearchParams(window.location.search).has('debug')

function App() {
  const [step, setStep] = useState('capture')
  const [selfieData, setSelfieData] = useState(null)
  const [debugMasked, setDebugMasked] = useState(null)
  const [style, setStyle] = useState(null)
  const [moneyPiece, setMoneyPiece] = useState(false)
  const [colour, setColour] = useState(null)
  const [model, setModel] = useState(MODELS[MODELS.length - 1].id)
  const [resultImage, setResultImage] = useState(null)
  const [rawGeminiImage, setRawGeminiImage] = useState(null)
  const [generatingStatus, setGeneratingStatus] = useState('')
  const [error, setError] = useState(null)

  function handleCapture(dataUrl) {
    setSelfieData(dataUrl)
    setStep('options')
    if (isDebug) {
      setDebugMasked('loading')
      createFaceMaskedImage(dataUrl).then(({ maskedUrl, error }) => {
        setDebugMasked(error || maskedUrl)
      })
    }
  }

  // Auto-load debug selfie
  useEffect(() => {
    if (isDebug && !selfieData) {
      fetch('/debug-selfie.jpg')
        .then(r => r.blob())
        .then(blob => {
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result
            setSelfieData(dataUrl)
            setStep('options')
            setDebugMasked('loading')
            createFaceMaskedImage(dataUrl).then(({ maskedUrl, error }) => {
              setDebugMasked(error || maskedUrl)
            })
          }
          reader.readAsDataURL(blob)
        })
        .catch(() => {})
    }
  }, [])

  async function handleGenerate() {
    setError(null)
    setStep('generating')
    try {
      // Pass 1: Generate hair colour change
      setGeneratingStatus('Generating hair preview...')
      const imageToSend = (isDebug && debugMasked?.startsWith('data:')) ? debugMasked : selfieData
      const result = await generatePreview({
        selfieDataUrl: imageToSend,
        style,
        moneyPiece,
        colour,
        model
      })
      setRawGeminiImage(result.imageUrl)

      // Pass 2: Refine — ask Gemini to seamlessly merge original face into generated image
      const touchUpPhrases = [
        'Adding the finishing touches...',
        'Blending your highlights just right...',
        'Putting on the final polish...',
        'Perfecting your new look...',
        'Making sure every strand is flawless...',
      ]
      setGeneratingStatus(touchUpPhrases[Math.floor(Math.random() * touchUpPhrases.length)])
      const refined = await refineWithOriginalFace({
        originalDataUrl: selfieData,
        generatedDataUrl: result.imageUrl,
        model
      })
      setResultImage(refined.imageUrl)
      setStep('result')
    } catch (err) {
      setError(err.message)
      setStep('options')
    }
  }

  function handleTryAgain() {
    setResultImage(null)
    setRawGeminiImage(null)
    setStyle(null)
    setMoneyPiece(false)
    setColour(null)
    setError(null)
    setStep('options')
  }

  function handleStartOver() {
    setSelfieData(null)
    setResultImage(null)
    setRawGeminiImage(null)
    setStyle(null)
    setMoneyPiece(false)
    setColour(null)
    setError(null)
    setDebugMasked(null)
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
            {isDebug && debugMasked && (
              <div className="debug-panel">
                <span className="selector-label">Debug: Face Mask</span>
                {debugMasked === 'loading'
                  ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Generating face mask...</p>
                  : debugMasked.startsWith('data:')
                    ? <img src={debugMasked} alt="Face masked" className="selfie-preview" />
                    : <p style={{ color: 'var(--color-error)', fontSize: '0.85rem' }}>{debugMasked}</p>
                }
              </div>
            )}
            {error && <div className="error-banner">{error}</div>}
            <StyleSelector value={style} moneyPiece={moneyPiece} onChange={setStyle} onMoneyPieceChange={setMoneyPiece} />
            <ColourSelector value={colour} onChange={setColour} />
            {isDebug && <ModelSelector value={model} onChange={setModel} />}
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
            <p>{generatingStatus || 'Creating your preview...'}</p>
          </div>
        )}

        {step === 'result' && (
          <ResultDisplay
            original={selfieData}
            result={resultImage}
            rawGemini={isDebug ? rawGeminiImage : null}
            masked={isDebug ? debugMasked : null}
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
