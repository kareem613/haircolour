import { useState, useEffect, useCallback } from 'react'
import { CameraCapture } from './components/CameraCapture'
import { StyleSelector } from './components/StyleSelector'
import { HairstyleSelector } from './components/HairstyleSelector'
import { ColourSelector } from './components/ColourSelector'
import { ModelSelector } from './components/ModelSelector'
import { ResultDisplay } from './components/ResultDisplay'
import { generatePreview, refineWithOriginalFace } from './lib/api'
import { MODELS, HIGHLIGHT_STYLES, COLOURS, HAIRSTYLES } from './lib/constants'
import { createFaceMaskedImage } from './lib/faceMask'
import { getCollection, addToCollection, updateInCollection, removeFromCollection, submitCollectionShare } from './lib/collection'
import { MyStylesDrawer } from './components/MyStylesDrawer'
import './App.css'

const isDebug = new URLSearchParams(window.location.search).has('debug')
const bannerCircle = '/banner-circle.png'

function App() {
  const [step, setStep] = useState('capture')
  const [selfieData, setSelfieData] = useState(null)
  const [debugMasked, setDebugMasked] = useState(null)
  const [style, setStyle] = useState(null)
  const [moneyPiece, setMoneyPiece] = useState(false)
  const [colour, setColour] = useState(null)
  const [hairstyles, setHairstyles] = useState([])
  const [model, setModel] = useState(MODELS[MODELS.length - 1].id)
  // results: { [key]: { status: 'generating'|'refining'|'done'|'error', image, rawImage, error } }
  const [results, setResults] = useState({})
  const [error, setError] = useState(null)
  const [feedback, setFeedback] = useState({})
  const [savedIds, setSavedIds] = useState({})
  const [collection, setCollection] = useState(() => getCollection())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [replaceCandidate, setReplaceCandidate] = useState(null)

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

  const generateOne = useCallback(async (key, hairstyleId) => {
    const imageToSend = (isDebug && debugMasked?.startsWith('data:')) ? debugMasked : selfieData

    setResults(prev => ({ ...prev, [key]: { status: 'generating', image: null, rawImage: null, error: null } }))

    try {
      // Pass 1: Generate
      const result = await generatePreview({
        selfieDataUrl: imageToSend,
        style,
        moneyPiece,
        colour,
        hairstyle: hairstyleId,
        model
      })

      setResults(prev => ({ ...prev, [key]: { ...prev[key], status: 'refining', rawImage: result.imageUrl } }))

      // Pass 2: Refine
      const refined = await refineWithOriginalFace({
        originalDataUrl: selfieData,
        generatedDataUrl: result.imageUrl,
        model
      })

      setResults(prev => ({ ...prev, [key]: { ...prev[key], status: 'done', image: refined.imageUrl } }))
    } catch (err) {
      setResults(prev => ({ ...prev, [key]: { ...prev[key], status: 'error', error: err.message } }))
    }
  }, [selfieData, debugMasked, style, moneyPiece, colour, model])

  async function runWithConcurrency(jobs, limit) {
    const queue = [...jobs]
    async function worker() {
      while (queue.length > 0) {
        const job = queue.shift()
        await generateOne(job.key, job.hairstyleId)
      }
    }
    const workers = Array.from({ length: Math.min(limit, jobs.length) }, () => worker())
    await Promise.all(workers)
  }

  function handleGenerate() {
    setError(null)
    setResults({})

    const jobs = hairstyles.length > 0
      ? hairstyles.map(hsId => ({ key: hsId, hairstyleId: hsId }))
      : [{ key: '_default', hairstyleId: null }]

    // Initialize all results as pending
    const initial = {}
    for (const job of jobs) {
      initial[job.key] = { status: 'generating', image: null, rawImage: null, error: null }
    }
    setResults(initial)
    setStep('result')

    // Run with max 2 concurrent
    runWithConcurrency(jobs, 2)
  }

  function handleRetry(key) {
    const hairstyleId = key === '_default' ? null : key
    generateOne(key, hairstyleId)
  }

  // Build settings summary for display
  function getSettings() {
    const styleInfo = HIGHLIGHT_STYLES.find(s => s.id === style)
    const colourInfo = COLOURS.find(c => c.id === colour)
    return {
      style: styleInfo?.label || style,
      colour: colourInfo?.label || colour,
      moneyPiece,
    }
  }

  // Build tab list from results
  function getResultTabs() {
    return Object.entries(results).map(([key, data]) => {
      const hsInfo = HAIRSTYLES.find(h => h.id === key)
      const label = hsInfo?.label || (key === '_default' ? (HIGHLIGHT_STYLES.find(s => s.id === style)?.label || 'Result') : key)
      return { key, label, ...data }
    })
  }

  async function handleFeedbackChange(tabKey, feedbackKey) {
    const current = feedback[tabKey]
    // null feedbackKey = explicit clear; same key = toggle off; else = set new
    const next = feedbackKey === null ? null : (current === feedbackKey ? null : feedbackKey)

    setFeedback(prev => ({ ...prev, [tabKey]: next }))

    const wasSaved = current === 'love' || current === 'maybe'
    const willSave = next === 'love' || next === 'maybe'

    if (wasSaved && willSave && savedIds[tabKey]) {
      // Switching between love ↔ maybe — just update the feedback field in place
      updateInCollection(savedIds[tabKey], { feedback: next })
      setCollection(getCollection())
      return
    }

    if (wasSaved && !willSave && savedIds[tabKey]) {
      // Deselecting or switching to notforme/looksoff — remove from collection
      await removeFromCollection(savedIds[tabKey])
      setSavedIds(prev => { const copy = { ...prev }; delete copy[tabKey]; return copy })
      setCollection(getCollection())
      return
    }

    if (!wasSaved && willSave) {
      // New save — add to collection (fill next empty slot)
      const tab = Object.entries(results).find(([k]) => k === tabKey)
      if (!tab || !tab[1].image) return
      const settingsInfo = getSettings()
      const item = {
        image: tab[1].image,
        style: settingsInfo.style,
        colour: settingsInfo.colour,
        moneyPiece: settingsInfo.moneyPiece,
        feedback: next,
      }
      const currentCollection = getCollection()
      if (currentCollection.length >= 6) {
        // Collection full — open replace mode
        setReplaceCandidate(item)
        setDrawerOpen(true)
      } else {
        const result = await addToCollection(item)
        if (result.success) {
          setSavedIds(prev => ({ ...prev, [tabKey]: result.id }))
        }
        setCollection(getCollection())
      }
    }
  }

  async function handleRemoveFromCollection(id) {
    await removeFromCollection(id)
    setCollection(getCollection())
    // Clean up savedIds reference
    setSavedIds(prev => {
      const copy = { ...prev }
      for (const key of Object.keys(copy)) {
        if (copy[key] === id) delete copy[key]
      }
      return copy
    })
  }

  async function handleReplace(oldId) {
    if (!replaceCandidate) return
    await removeFromCollection(oldId)
    await addToCollection(replaceCandidate)
    setReplaceCandidate(null)
    setCollection(getCollection())
    setDrawerOpen(false)
  }

  async function handleShareRequest(imageIds, message) {
    await submitCollectionShare(imageIds, message)
  }

  function handleTryAgain() {
    setResults({})
    setStyle(null)
    setMoneyPiece(false)
    setColour(null)
    setHairstyles([])
    setError(null)
    setFeedback({})
    setSavedIds({})
    setStep('options')
  }

  function handleStartOver() {
    setSelfieData(null)
    setResults({})
    setStyle(null)
    setMoneyPiece(false)
    setColour(null)
    setHairstyles([])
    setError(null)
    setDebugMasked(null)
    setFeedback({})
    setSavedIds({})
    setStep('capture')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-bg" style={{ backgroundImage: `url(${bannerCircle})` }} aria-hidden="true" />
        <div className="app-header-content">
          <h1>
            <span className="app-header-prefix">Hair by</span>
            <span className="app-header-name">Guisselle</span>
          </h1>
        </div>
      </header>
      <img src={bannerCircle} alt="" className="app-header-avatar" />
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
            <HairstyleSelector value={hairstyles} onChange={setHairstyles} />
            {isDebug && <ModelSelector value={model} onChange={setModel} />}
            <button
              className="btn btn-primary"
              disabled={!style || !colour}
              onClick={handleGenerate}
            >
              Generate Preview{hairstyles.length > 1 ? ` (${hairstyles.length} styles)` : ''}
            </button>
            <button className="btn btn-ghost" onClick={handleStartOver}>
              Retake Selfie
            </button>
          </div>
        )}

        {step === 'result' && (
          <ResultDisplay
            original={selfieData}
            tabs={getResultTabs()}
            settings={getSettings()}
            feedback={feedback}
            onFeedbackChange={handleFeedbackChange}
            onRetry={handleRetry}
            onTryAgain={handleTryAgain}
            onStartOver={handleStartOver}
          />
        )}
      </main>
      <MyStylesDrawer
        collection={collection}
        open={drawerOpen}
        onToggle={() => setDrawerOpen(o => !o)}
        onRemove={handleRemoveFromCollection}
        replaceCandidate={replaceCandidate}
        onReplace={handleReplace}
        onCancelReplace={() => { setReplaceCandidate(null); setDrawerOpen(false) }}
        onShareRequest={handleShareRequest}
      />
      <footer className="app-footer">
        {__APP_VERSION__} ({__COMMIT_SHA__})
      </footer>
    </div>
  )
}

export default App
