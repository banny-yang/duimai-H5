export const VOICE_MAX_DURATION_MS = 60_000
export const VOICE_MIN_RECORD_MS = 500

export function clampVoiceDurationMs(ms) {
  if (!Number.isFinite(ms) || ms <= 0) return 0
  return Math.min(VOICE_MAX_DURATION_MS, Math.round(ms))
}
