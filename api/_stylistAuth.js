import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'stylist_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url')
}

function fromBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function parseCookies(req) {
  const raw = req.headers.cookie || ''
  return raw.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=')
    if (!key) return acc
    acc[key] = decodeURIComponent(rest.join('='))
    return acc
  }, {})
}

function getSigningSecret(passcode) {
  return process.env.STYLIST_SESSION_SECRET || passcode
}

function signPayload(payload, passcode) {
  const payloadBase64 = toBase64Url(JSON.stringify(payload))
  const signature = createHmac('sha256', getSigningSecret(passcode))
    .update(payloadBase64)
    .digest('base64url')
  return `${payloadBase64}.${signature}`
}

function verifyToken(token, passcode) {
  if (!token || !passcode) return false

  const [payloadBase64, signature] = token.split('.')
  if (!payloadBase64 || !signature) return false

  const expected = createHmac('sha256', getSigningSecret(passcode))
    .update(payloadBase64)
    .digest('base64url')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return false
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadBase64))
    return Number.isFinite(payload?.exp) && Date.now() < payload.exp
  } catch {
    return false
  }
}

export function getStylistPasscode() {
  const passcode = process.env.STYLIST_PORTAL_CODE
  if (!passcode || !/^\d{5}$/.test(passcode)) {
    return null
  }
  return passcode
}

export function getStylistPasscodeConfigError() {
  return 'Stylist access code is not configured. In Vercel, set STYLIST_PORTAL_CODE to a 5-digit value in Project Settings -> Environment Variables, then redeploy.'
}

export function setStylistSession(res, passcode) {
  const token = signPayload({ exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 }, passcode)
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Strict${secure}`,
  )
}

export function clearStylistSession(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${secure}`)
}

export function isStylistAuthenticated(req, passcode) {
  const cookies = parseCookies(req)
  return verifyToken(cookies[COOKIE_NAME], passcode)
}
