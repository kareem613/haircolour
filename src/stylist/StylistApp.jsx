import { useEffect, useMemo, useState } from 'react'
import './StylistApp.css'

const SYSTEM_ERROR_MESSAGE = 'A system error occurred. Please try again.'

function pathToImageUrl(pathname) {
  return `/api/stylist-image?pathname=${encodeURIComponent(pathname)}`
}

async function parseJson(res) {
  return res.json().catch(() => ({}))
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

function formatSubmissionTimestamp(timestamp) {
  if (!Number.isFinite(timestamp)) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = timestamp - now.getTime()
  const diffMinutes = Math.round(diffMs / 60000)
  const absDiffMinutes = Math.abs(diffMinutes)

  if (absDiffMinutes < 90) {
    return relativeFormatter.format(diffMinutes, 'minute')
  }

  if (absDiffMinutes < 24 * 60) {
    const diffHours = Math.round(diffMs / 3600000)
    return relativeFormatter.format(diffHours, 'hour')
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDifference = Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86400000)

  const timeText = timeFormatter.format(date)
  if (dayDifference === 0) return `Today at ${timeText}`
  if (dayDifference === -1) return `Yesterday at ${timeText}`
  return `${dateFormatter.format(date)} at ${timeText}`
}

export default function StylistApp() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [code, setCode] = useState('')
  const [authError, setAuthError] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  async function loadSubmissions() {
    setLoadingSubmissions(true)
    try {
      const res = await fetch('/api/stylist-submissions', { credentials: 'include' })
      if (!res.ok) {
        throw new Error(SYSTEM_ERROR_MESSAGE)
      }
      const data = await parseJson(res)
      setSubmissions(data.submissions || [])
    } finally {
      setLoadingSubmissions(false)
    }
  }

  useEffect(() => {
    let active = true
    fetch('/api/stylist-auth', { credentials: 'include' })
      .then(parseJson)
      .then((data) => {
        if (!active) return
        const ok = Boolean(data.authenticated)
        setAuthenticated(ok)
        setAuthChecked(true)
        if (ok) {
          loadSubmissions().catch(() => setAuthError(SYSTEM_ERROR_MESSAGE))
        }
      })
      .catch(() => {
        if (!active) return
        setAuthChecked(true)
        setAuthError(SYSTEM_ERROR_MESSAGE)
      })

    return () => {
      active = false
    }
  }, [])

  async function handleLogin(event) {
    event.preventDefault()
    setAuthError('')

    const res = await fetch('/api/stylist-auth', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await parseJson(res)
    if (!res.ok) {
      setAuthError(res.status === 401 ? 'Incorrect code' : SYSTEM_ERROR_MESSAGE)
      return
    }

    setAuthenticated(true)
    setCode('')
    await loadSubmissions().catch(() => setAuthError(SYSTEM_ERROR_MESSAGE))
  }

  const hasSubmissions = useMemo(() => submissions.length > 0, [submissions.length])

  if (!authChecked) {
    return <div className="stylist-screen"><p>Checking access...</p></div>
  }

  if (!authenticated) {
    return (
      <main className="stylist-screen">
        <section className="stylist-card">
          <h1>Stylist Portal</h1>
          <p>Enter your 5-digit access code.</p>
          <form onSubmit={handleLogin} className="stylist-login">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="12345"
              autoComplete="one-time-code"
              required
            />
            <button className="btn btn-primary" type="submit" disabled={code.length !== 5}>Unlock</button>
          </form>
          {authError && <p className="stylist-error">{authError}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="stylist-screen">
      <section className="stylist-card">
        <h1>Stylist Portal</h1>
        <p>Client submissions appear below.</p>
      </section>

      {authError && <p className="stylist-error">{authError}</p>}
      {loadingSubmissions && <p>Loading submissions...</p>}

      {!loadingSubmissions && !hasSubmissions && (
        <section className="stylist-card">
          <p>No client submissions yet.</p>
        </section>
      )}

      {!loadingSubmissions && hasSubmissions && (
        <div className="stylist-submission-list">
          {submissions.map((submission) => (
            <article className="stylist-card" key={submission.id}>
              <div className="stylist-message-row">
                <p>{submission.message || 'No message provided.'}</p>
                <p className="stylist-meta">{formatSubmissionTimestamp(submission.timestamp)}</p>
              </div>
              <div className="stylist-thumbnail-grid">
                {submission.imagePaths.map((path) => {
                  const src = pathToImageUrl(path)
                  return (
                    <button
                      type="button"
                      className="stylist-thumb"
                      onClick={() => setSelectedImage(src)}
                      key={path}
                    >
                      <img src={src} alt="Client reference" loading="lazy" />
                    </button>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="stylist-modal" role="dialog" aria-modal="true" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Expanded client reference" className="stylist-modal-image" />
        </div>
      )}
    </main>
  )
}
