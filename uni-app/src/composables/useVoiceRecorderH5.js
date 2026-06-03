import { ref, onUnmounted } from 'vue'
import { isVoiceInputSupported } from '@/utils/voice-capability.js'
import { VOICE_MAX_DURATION_MS, VOICE_MIN_RECORD_MS } from '@/utils/voice-message.js'

const STOP_TIMEOUT_MS = 2000

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return undefined
  const candidates = [
    'audio/mp4',
    'audio/aac',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((t) => MediaRecorder.isTypeSupported(t))
}

export function useVoiceRecorderH5() {
  const phase = ref('idle')
  const elapsedMs = ref(0)

  let recorder = null
  let stream = null
  let chunks = []
  let timer = null
  let startedAt = 0

  function cleanup() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    recorder = null
    chunks = []
    elapsedMs.value = 0
  }

  function forceIdle() {
    cleanup()
    phase.value = 'idle'
  }

  onUnmounted(forceIdle)

  async function start() {
    if (!isVoiceInputSupported()) {
      phase.value = 'unsupported'
      return false
    }
    forceIdle()
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks = []
      const mime = pickMimeType()
      recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      recorder.onerror = () => forceIdle()
      recorder.start(200)
      startedAt = Date.now()
      phase.value = 'recording'
      timer = setInterval(() => {
        if (!recorder) return
        const ms = Math.min(Date.now() - startedAt, VOICE_MAX_DURATION_MS)
        elapsedMs.value = ms
        if (ms >= VOICE_MAX_DURATION_MS && recorder.state === 'recording') {
          try {
            if (typeof recorder.requestData === 'function') recorder.requestData()
            recorder.stop()
          } catch {
            forceIdle()
          }
        }
      }, 100)
      return true
    } catch {
      forceIdle()
      phase.value = 'denied'
      return false
    }
  }

  function buildBlob(duration) {
    if (!recorder) return null
    const mime = recorder.mimeType || chunks[0]?.type || 'audio/webm'
    const blob = new Blob(chunks, { type: mime })
    if (duration < VOICE_MIN_RECORD_MS || blob.size < 100) return null
    return blob
  }

  function stopRecorderInstance(rec) {
    try {
      if (rec.state === 'recording' && typeof rec.requestData === 'function') {
        rec.requestData()
      }
      if (rec.state !== 'inactive') rec.stop()
    } catch {
      /* ignore */
    }
  }

  function stop() {
    return new Promise((resolve) => {
      const rec = recorder
      if (!rec) {
        forceIdle()
        resolve(null)
        return
      }
      const duration = Math.min(Date.now() - startedAt, VOICE_MAX_DURATION_MS)
      let settled = false
      const finish = (blob) => {
        if (settled) return
        settled = true
        forceIdle()
        resolve(blob)
      }
      const timeoutId = setTimeout(() => finish(buildBlob(duration)), STOP_TIMEOUT_MS)
      if (rec.state === 'inactive') {
        clearTimeout(timeoutId)
        finish(buildBlob(duration))
        return
      }
      rec.onstop = () => {
        clearTimeout(timeoutId)
        finish(buildBlob(duration))
      }
      stopRecorderInstance(rec)
    })
  }

  function cancel() {
    if (recorder) {
      recorder.onstop = null
      stopRecorderInstance(recorder)
    }
    forceIdle()
  }

  return {
    phase,
    elapsedMs,
    maxMs: VOICE_MAX_DURATION_MS,
    start,
    stop,
    cancel,
    resetDenied: () => {
      phase.value = 'idle'
    },
  }
}
