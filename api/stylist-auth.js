import { getStylistPasscode, setStylistSession, clearStylistSession, isStylistAuthenticated } from './_stylistAuth.js'

export default async function handler(req, res) {
  const passcode = getStylistPasscode()
  if (!passcode) {
    return res.status(500).json({ error: 'Stylist access code is not configured' })
  }

  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: isStylistAuthenticated(req, passcode) })
  }

  if (req.method === 'DELETE') {
    clearStylistSession(res)
    return res.status(200).json({ success: true })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const code = typeof req.body?.code === 'string' ? req.body.code.trim() : ''
  if (!/^\d{5}$/.test(code)) {
    return res.status(400).json({ error: 'Code must be 5 digits' })
  }

  if (code !== passcode) {
    return res.status(401).json({ error: 'Incorrect access code' })
  }

  setStylistSession(res, passcode)
  return res.status(200).json({ success: true })
}
