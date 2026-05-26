/** 单条语音最长 60 秒（与录音器一致） */
export const VOICE_MAX_DURATION_MS = 60_000;

export const VOICE_MIN_RECORD_MS = 500;

export function clampVoiceDurationMs(ms: number): number {
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.min(VOICE_MAX_DURATION_MS, Math.round(ms));
}

/** 展示用秒数：1–60，至少 1 秒 */
export function voiceDurationSeconds(ms: number): number {
  const clamped = clampVoiceDurationMs(ms);
  if (clamped <= 0) return 1;
  return Math.min(60, Math.max(1, Math.ceil(clamped / 1000)));
}

/** 微信式秒数标签，如 3" */
export function formatVoiceDurationLabel(ms: number): string {
  return `${voiceDurationSeconds(ms)}"`;
}

/**
 * 气泡宽度（px）：1s 最窄，60s 最宽，线性插值（参考微信）
 */
export function calcVoiceBubbleWidthPx(
  durationMs: number,
  viewportWidth = typeof window !== "undefined" ? window.innerWidth : 375,
): number {
  const minPx = 108;
  const maxPx = Math.min(260, Math.floor(viewportWidth * 0.58));
  const maxSec = 60;
  const sec = voiceDurationSeconds(durationMs);
  const t = maxSec <= 1 ? 1 : (sec - 1) / (maxSec - 1);
  return Math.round(minPx + t * (maxPx - minPx));
}
