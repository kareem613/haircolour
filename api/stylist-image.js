import { get } from '@vercel/blob'
import { Buffer } from 'node:buffer'
import { getStylistPasscode, getStylistPasscodeConfigError, isStylistAuthenticated } from './_stylistAuth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const passcode = getStylistPasscode()
  if (!passcode) {
    return res.status(500).json({ error: getStylistPasscodeConfigError() })
  }

  if (!isStylistAuthenticated(req, passcode)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { pathname } = req.query
  if (!pathname || Array.isArray(pathname) || !pathname.startsWith('collections/')) {
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

    const body = Buffer.from(await new Response(result.stream).arrayBuffer())
    res.setHeader('Content-Type', result.blob.contentType || 'image/jpeg')
    res.setHeader('Cache-Control', 'private, max-age=60')
    return res.status(200).send(body)
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load image' })
  }
}
