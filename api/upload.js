import { put, del } from '@vercel/blob'
import { Buffer } from 'node:buffer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action } = req.body

  if (action === 'upload') {
    const { imageBase64, pathname } = req.body
    if (!imageBase64 || !pathname) {
      return res.status(400).json({ error: 'Missing imageBase64 or pathname' })
    }

    try {
      // Strip data URL prefix to get raw base64
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')

      const blob = await put(pathname, buffer, {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'image/jpeg',
      })

      return res.status(200).json({ pathname: blob.pathname })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  if (action === 'delete') {
    const { pathname, blobUrl } = req.body
    const target = pathname || blobUrl
    if (!target) {
      return res.status(400).json({ error: 'Missing pathname' })
    }

    try {
      await del(target)
      return res.status(200).json({ success: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(400).json({ error: 'Invalid action' })
}
