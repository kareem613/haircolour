import { useRef, useState, useCallback } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
      setStream(s)
      setActive(true)
    } catch (err) {
      setError(err)
      setActive(false)
    }
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    stopCamera()
    return canvas.toDataURL('image/jpeg', 0.85)
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
    }
    setStream(null)
    setActive(false)
  }, [stream])

  return { videoRef, active, startCamera, capturePhoto, stopCamera, error }
}
