import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

let landmarker = null

async function getLandmarker() {
  if (landmarker) return landmarker
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )
  landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
    },
    runningMode: 'IMAGE',
    numFaces: 1,
  })
  return landmarker
}

// MediaPipe FACE_OVAL indices (outer boundary of face)
const FACE_OVAL_INDICES = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
]

export async function createFaceMaskedImage(imageDataUrl) {
  const fl = await getLandmarker()

  // Load image into an HTMLImageElement
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = imageDataUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')

  // Draw the original image
  ctx.drawImage(img, 0, 0)

  // Detect face landmarks
  const result = fl.detect(img)

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return { maskedUrl: null, error: 'No face detected' }
  }

  const landmarks = result.faceLandmarks[0]
  const w = img.naturalWidth
  const h = img.naturalHeight

  // Build face oval path from landmark indices
  ctx.beginPath()
  const firstPt = landmarks[FACE_OVAL_INDICES[0]]
  ctx.moveTo(firstPt.x * w, firstPt.y * h)
  for (let i = 1; i < FACE_OVAL_INDICES.length; i++) {
    const pt = landmarks[FACE_OVAL_INDICES[i]]
    ctx.lineTo(pt.x * w, pt.y * h)
  }
  ctx.closePath()

  // Black out the face area
  ctx.fillStyle = 'black'
  ctx.fill()

  return { maskedUrl: canvas.toDataURL('image/jpeg', 0.85), error: null }
}
