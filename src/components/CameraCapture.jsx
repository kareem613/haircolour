import heic2any from 'heic2any'
import './CameraCapture.css'

export function CameraCapture({ onCapture }) {
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
      const MAX_DIM = 1024
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > MAX_DIM || h > MAX_DIM) {
        const scale = MAX_DIM / Math.max(w, h)
        w = Math.round(w * scale)
        h = Math.round(h * scale)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      onCapture(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  return (
    <div className="camera-capture">
      <div className="capture-prompt">
        <h2>Welcome to Guisselle's</h2>
        <p>Try out highlights and styles before your next appointment</p>
        <ul className="capture-tips">
          <li>Use a photo where your hair is clearly visible</li>
          <li>Good, even lighting works best</li>
          <li>You'll pick a highlight style, colour, and hairstyle next</li>
          <li>Select multiple hairstyles to compare them side by side</li>
        </ul>
      </div>
      <div className="capture-options">
        <label className="btn btn-primary file-input-label">
          Take Photo
          <input type="file" accept="image/*" capture="user" onChange={handleFileChange} hidden />
        </label>
        <label className="btn btn-ghost file-input-label">
          Upload from Gallery
          <input type="file" accept="image/*" onChange={handleFileChange} hidden />
        </label>
      </div>
    </div>
  )
}
