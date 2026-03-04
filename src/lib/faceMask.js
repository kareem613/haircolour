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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawFaceOvalPath(ctx, landmarks, w, h) {
  ctx.beginPath()
  const firstPt = landmarks[FACE_OVAL_INDICES[0]]
  ctx.moveTo(firstPt.x * w, firstPt.y * h)
  for (let i = 1; i < FACE_OVAL_INDICES.length; i++) {
    const pt = landmarks[FACE_OVAL_INDICES[i]]
    ctx.lineTo(pt.x * w, pt.y * h)
  }
  ctx.closePath()
}

export async function createFaceMaskedImage(imageDataUrl) {
  const fl = await getLandmarker()
  const img = await loadImage(imageDataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')

  ctx.drawImage(img, 0, 0)

  const result = fl.detect(img)

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return { maskedUrl: null, error: 'No face detected' }
  }

  const landmarks = result.faceLandmarks[0]
  drawFaceOvalPath(ctx, landmarks, img.naturalWidth, img.naturalHeight)

  ctx.fillStyle = 'black'
  ctx.fill()

  return { maskedUrl: canvas.toDataURL('image/jpeg', 0.85), error: null }
}

/**
 * Combines the Gemini result (hair) with the original image (face).
 * Uses a feathered (blurred) mask for seamless blending — no hard edges.
 */
export async function combineWithOriginalFace(originalDataUrl, processedDataUrl) {
  const fl = await getLandmarker()
  const [originalImg, processedImg] = await Promise.all([
    loadImage(originalDataUrl),
    loadImage(processedDataUrl),
  ])

  // Detect face on the ORIGINAL image
  const result = fl.detect(originalImg)

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return processedDataUrl
  }

  const landmarks = result.faceLandmarks[0]
  const w = originalImg.naturalWidth
  const h = originalImg.naturalHeight

  // --- Mask canvas: create a soft feathered mask of the face ---
  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = w
  maskCanvas.height = h
  const maskCtx = maskCanvas.getContext('2d')

  // Draw the hard face oval shape in white
  maskCtx.fillStyle = 'white'
  drawFaceOvalPath(maskCtx, landmarks, w, h)
  maskCtx.fill()

  // Blur the mask to create feathered edges
  maskCtx.filter = 'blur(15px)'
  maskCtx.globalCompositeOperation = 'source-in'
  maskCtx.fillRect(0, 0, w, h)

  // --- Main canvas: composite the images ---
  const mainCanvas = document.createElement('canvas')
  mainCanvas.width = w
  mainCanvas.height = h
  const mainCtx = mainCanvas.getContext('2d')

  // Step 1: Draw the ORIGINAL image (face source)
  mainCtx.drawImage(originalImg, 0, 0)

  // Step 2: Apply the feathered mask — keeps only the face area with soft edges
  mainCtx.globalCompositeOperation = 'destination-in'
  mainCtx.drawImage(maskCanvas, 0, 0)

  // Step 3: Draw the PROCESSED image underneath (hair + background)
  mainCtx.globalCompositeOperation = 'destination-over'
  mainCtx.drawImage(processedImg, 0, 0, w, h)

  return mainCanvas.toDataURL('image/jpeg', 0.85)
}
