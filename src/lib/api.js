import { buildPrompt } from './prompt'

export async function generatePreview({ selfieDataUrl, style, colour, model }) {
  const base64 = selfieDataUrl.split(',')[1]
  const mimeType = selfieDataUrl.split(';')[0].split(':')[1]

  const prompt = buildPrompt({ style, colour })

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
