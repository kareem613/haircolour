import { buildPrompt, buildRefinePrompt } from './prompt'

function parseDataUrl(dataUrl) {
  return {
    base64: dataUrl.split(',')[1],
    mimeType: dataUrl.split(';')[0].split(':')[1],
  }
}

export async function generatePreview({ selfieDataUrl, style, moneyPiece, colour, model }) {
  const { base64, mimeType } = parseDataUrl(selfieDataUrl)
  const prompt = buildPrompt({ style, moneyPiece, colour })

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
  const original = parseDataUrl(originalDataUrl)
  const generated = parseDataUrl(generatedDataUrl)
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
