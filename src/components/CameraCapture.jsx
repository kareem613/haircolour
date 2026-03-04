import { useState } from 'react'
import { useCamera } from '../hooks/useCamera'
import './CameraCapture.css'

export function CameraCapture({ onCapture }) {
  const { videoRef, active, startCamera, capturePhoto, stopCamera, error } = useCamera()
  const [mode, setMode] = useState('choose')

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onCapture(reader.result)
    reader.readAsDataURL(file)
  }

  function handleCapture() {
    const dataUrl = capturePhoto()
    if (dataUrl) onCapture(dataUrl)
  }

  function handleStartCamera() {
    setMode('camera')
    startCamera()
  }

  if (mode === 'camera' && active) {
    return (
      <div className="camera-capture">
        <video ref={videoRef} autoPlay playsInline muted className="camera-viewfinder" />
        <div className="camera-actions">
          <button className="btn btn-secondary" onClick={() => { stopCamera(); setMode('choose') }}>Cancel</button>
          <button className="btn btn-capture" onClick={handleCapture}>
            <span className="capture-ring" />
          </button>
          <div style={{ width: 48 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="camera-capture">
      <div className="capture-prompt">
        <div className="capture-icon">📸</div>
        <h2>Take a Selfie</h2>
        <p>We'll show you how different highlights would look on your hair</p>
      </div>
      <div className="capture-options">
        <label className="btn btn-primary file-input-label">
          Take Photo
          <input type="file" accept="image/*" capture="user" onChange={handleFileChange} hidden />
        </label>
        <button className="btn btn-secondary" onClick={handleStartCamera}>
          Use Camera
        </button>
        <label className="btn btn-ghost file-input-label">
          Upload from Gallery
          <input type="file" accept="image/*" onChange={handleFileChange} hidden />
        </label>
      </div>
      {error && <p className="camera-error">Camera access denied. Please use file upload instead.</p>}
    </div>
  )
}
