import { useState } from 'react'
import heic2any from 'heic2any'
import { useCamera } from '../hooks/useCamera'
import './CameraCapture.css'

export function CameraCapture({ onCapture }) {
  const { videoRef, active, startCamera, capturePhoto, stopCamera, error } = useCamera()
  const [mode, setMode] = useState('choose')

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    let blob = file
    // Convert HEIC/HEIF to JPEG since browsers can't render them natively
    if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
      } catch {
        // If conversion fails, try using the file as-is
      }
    }

    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      onCapture(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
    }
    img.src = url
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
        <p>We'll show you how different highlights and hairstyles would look on you</p>
        <ul className="capture-tips">
          <li>Face the camera with your hair visible</li>
          <li>Use good, even lighting</li>
          <li>You'll pick a highlight style, colour, and hairstyle next</li>
          <li>Select multiple hairstyles to compare them side by side</li>
        </ul>
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
