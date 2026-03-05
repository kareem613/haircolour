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

  return (
    <div className="camera-capture">
      <div className="capture-prompt">
        <div className="capture-icon">💇‍♀️</div>
        <h2>Welcome to Guisselle's</h2>
        <p>Upload a photo and preview different highlights and hairstyles before your appointment</p>
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
