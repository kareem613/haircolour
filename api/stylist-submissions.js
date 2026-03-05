import { get, list } from '@vercel/blob'
import { getStylistPasscode, getStylistPasscodeConfigError, isStylistAuthenticated } from './_stylistAuth.js'

const MAX_SUBMISSIONS = 40

async function readSharePayload(pathname) {
  const file = await get(pathname, { access: 'private' })
  if (!file?.stream) return null
  const payload = await new Response(file.stream).json()
  if (!payload || typeof payload !== 'object') return null
  return {
    id: pathname,
    message: typeof payload.message === 'string' ? payload.message : '',
    imagePaths: Array.isArray(payload.imagePaths)
      ? payload.imagePaths.filter(path => typeof path === 'string' && path.startsWith('collections/'))
      : [],
    timestamp: Number.isFinite(payload.timestamp) ? payload.timestamp : Date.now(),
    stylist: typeof payload.stylist === 'string' ? payload.stylist : null,
  }
}

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

  try {
    const { blobs } = await list({ prefix: 'share-requests/', limit: MAX_SUBMISSIONS })
    const sorted = blobs.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    const payloads = await Promise.all(sorted.map(blob => readSharePayload(blob.pathname)))
    const items = payloads.filter(Boolean)
    return res.status(200).json({ submissions: items })
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load submissions' })
  }
}
