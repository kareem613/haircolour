import { get } from '@vercel/blob'
import { Buffer } from 'node:buffer'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { pathname } = req.query
  if (!pathname || Array.isArray(pathname)) {
    return res.status(400).json({ error: 'Missing pathname' })
  }
  if (!pathname.startsWith('collections/')) {
    return res.status(400).json({ error: 'Invalid pathname' })
  }

  try {
    const result = await get(pathname, { access: 'private' })
    if (!result) {
      return res.status(404).json({ error: 'Not found' })
    }
    if (!result.stream) {
      return res.status(304).end()
    }

    const contentType = result.blob.contentType || 'application/octet-stream'
    const body = Buffer.from(await new Response(result.stream).arrayBuffer())
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'private, max-age=60')
    return res.status(200).send(body)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
