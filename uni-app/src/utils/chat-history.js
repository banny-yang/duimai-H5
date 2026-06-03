export function mapHistoryToChatMessages(items) {
  const out = []
  for (const m of items || []) {
    const text = m.text?.trim()
    if (!text) continue
    const createdAt = m.createdAt ?? Date.now()
    const id = m.id ? `hist-${m.id}` : `hist-${createdAt}-${out.length}`
    if (m.role === 'user') {
      const isVoice =
        m.inputSource === 'voice' || (m.voiceDurationMs != null && m.voiceDurationMs > 0)
      out.push({
        id,
        role: 'user',
        text,
        inputSource: isVoice ? 'voice' : 'text',
        audioDurationMs: isVoice ? m.voiceDurationMs ?? 0 : undefined,
        voiceStatus: isVoice ? 'done' : undefined,
        voicePlaybackDisabled: isVoice,
        createdAt,
      })
      continue
    }
    if (m.role === 'staff') {
      out.push({ id, role: 'staff', text, createdAt })
      continue
    }
    out.push({ id, role: 'assistant', text, createdAt })
  }
  return out
}
