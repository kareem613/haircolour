const STORAGE_KEY = 'haircolour_collection'
const DEVICE_ID_KEY = 'haircolour_device_id'
const MAX_ITEMS = 6
const BLOB_PROXY_PREFIX = '/api/blob?pathname='

function toProxyUrl(pathname) {
  return `${BLOB_PROXY_PREFIX}${encodeURIComponent(pathname)}`
}

function toPathnameFromLegacyUrl(url) {
  try {
    const { pathname } = new URL(url)
    return decodeURIComponent(pathname.replace(/^\/+/, ''))
  } catch {
    return null
  }
}

function normalizeCollectionItem(item) {
  if (item?.blobPath) {
    return { ...item, image: toProxyUrl(item.blobPath) }
  }

  if (typeof item?.image === 'string' && item.image.startsWith('http')) {
    const path = toPathnameFromLegacyUrl(item.image)
    if (path?.startsWith('collections/')) {
      return { ...item, blobPath: path, image: toProxyUrl(path) }
    }
  }

  return item
}

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

async function uploadBlob(imageBase64, imageId) {
  const deviceId = getDeviceId()
  const pathname = `collections/${deviceId}/${imageId}.jpg`
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'upload', imageBase64, pathname }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || 'Upload failed')
  }
  const { pathname: blobPathname } = await res.json()
  return blobPathname
}

async function deleteBlob(pathname) {
  try {
    await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', pathname }),
    })
  } catch {
    // silently ignore delete failures
  }
}

export function getCollection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const items = JSON.parse(raw).map(normalizeCollectionItem)
    // Filter out old base64 entries and keep only blob-backed images.
    const cleaned = items.filter(item => item?.blobPath?.startsWith('collections/'))
    if (JSON.stringify(cleaned) !== JSON.stringify(items)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    }
    return cleaned
  } catch {
    return []
  }
}

export async function addToCollection(item) {
  try {
    const collection = getCollection()
    if (collection.length >= MAX_ITEMS) {
      return { success: false, error: 'full' }
    }
    const id = crypto.randomUUID()
    const pathname = await uploadBlob(item.image, id)
    const entry = {
      id,
      blobPath: pathname,
      image: toProxyUrl(pathname),
      style: item.style,
      colour: item.colour,
      moneyPiece: item.moneyPiece,
      feedback: item.feedback,
      savedAt: Date.now(),
    }
    collection.push(entry)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection))
    return { success: true, id: entry.id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export function updateInCollection(id, updates) {
  try {
    const collection = getCollection().map(item =>
      item.id === id ? { ...item, ...updates } : item
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection))
  } catch {
    // ignore errors
  }
}

export async function removeFromCollection(id) {
  try {
    const collection = getCollection()
    const item = collection.find(i => i.id === id)
    if (item?.blobPath?.startsWith('collections/')) {
      await deleteBlob(item.blobPath)
    }
    const filtered = collection.filter(i => i.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch {
    // ignore errors on removal
  }
}

export async function submitCollectionShare(imageIds, message) {
  const deviceId = getDeviceId()
  const timestamp = Date.now()
  const collection = getCollection()
  const selected = collection.filter(item => imageIds.includes(item.id))
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'share_request',
      payload: {
        stylist: 'Guisselle',
        imageIds,
        imagePaths: selected.map(item => item.blobPath).filter(Boolean),
        message,
        deviceId,
        timestamp,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Share request failed' }))
    throw new Error(err.error || 'Share request failed')
  }
  return res.json()
}
