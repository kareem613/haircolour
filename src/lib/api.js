import { buildPrompt, buildRefinePrompt } from './prompt'

function parseDataUrl(dataUrl) {
  return {
    base64: dataUrl.split(',')[1],
    mimeType: dataUrl.split(';')[0].split(':')[1],
  }
}

function shrinkDataUrl(dataUrl, maxDim = 1024) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w <= maxDim && h <= maxDim) { resolve(dataUrl); return }
      const scale = maxDim / Math.max(w, h)
      w = Math.round(w * scale)
      h = Math.round(h * scale)
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(c.toDataURL('image/jpeg', 0.8))
    }
    img.src = dataUrl
  })
}

export async function generatePreview({ selfieDataUrl, style, moneyPiece, colour, hairstyle, model }) {
  const { base64, mimeType } = parseDataUrl(selfieDataUrl)
  const prompt = buildPrompt({ style, moneyPiece, colour, hairstyle })

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType, prompt, model })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Generation failed (${response.status})`)
  }

  const data = await response.json()
  if (!data.image) {
    throw new Error(data.text || 'No image returned from API')
  }

  return {
    imageUrl: `data:${data.image.mimeType};base64,${data.image.data}`,
    text: data.text
  }
}

export async function refineWithOriginalFace({ originalDataUrl, generatedDataUrl, model }) {
  const shrunkGenerated = await shrinkDataUrl(generatedDataUrl)
  const original = parseDataUrl(originalDataUrl)
  const generated = parseDataUrl(shrunkGenerated)
  const prompt = buildRefinePrompt()

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: [
        { base64: original.base64, mimeType: original.mimeType },
        { base64: generated.base64, mimeType: generated.mimeType },
      ],
      prompt,
      model
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Refinement failed (${response.status})`)
  }

  const data = await response.json()
  if (!data.image) {
    throw new Error(data.text || 'No image returned from refinement')
  }

  return {
    imageUrl: `data:${data.image.mimeType};base64,${data.image.data}`,
    text: data.text
  }
}
