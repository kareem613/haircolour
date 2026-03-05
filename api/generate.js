export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imageBase64, mimeType, images, prompt, model } = req.body

  if ((!imageBase64 && !images) || !prompt || !model) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              ...(images
                ? images.map(img => ({
                    inlineData: {
                      mimeType: img.mimeType || 'image/jpeg',
                      data: img.base64
                    }
                  }))
                : [{
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: imageBase64
                    }
                  }]
              )
            ]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              imageSize: '512px'
            }
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API error' })
    }

    const parts = data.candidates?.[0]?.content?.parts || []
    const imagePart = parts.find(p => p.inlineData)
    const textPart = parts.find(p => p.text)

    return res.status(200).json({
      image: imagePart ? {
        data: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType
      } : null,
      text: textPart?.text || null
    })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate image' })
  }
}
