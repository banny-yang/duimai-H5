const zh = {
  loadingEvent: '正在加载赛事…',
  connectionError: '无法连接选手端服务，请稍后重试',
  aiDisabled: '赛事 AI 未配置（请检查 Dify）',
  verifyIdentity: '验证参赛身份',
  poweredBy: 'Powered by 对麦智能',
  sendPlaceholder: '输入问题，或按住语音说话',
  offlineHint: '离线模式：展示已缓存的快捷问题',
}

const en = {
  loadingEvent: 'Loading event…',
  connectionError: 'Cannot reach runner service. Please retry.',
  aiDisabled: 'AI is not configured for this event',
  verifyIdentity: 'Verify identity',
  poweredBy: 'Powered by Duimai',
  sendPlaceholder: 'Type a question or hold to speak',
  offlineHint: 'Offline: showing cached quick questions',
}

export function resolveLocale(queryLang, brandingLocale) {
  const q = (queryLang ?? '').trim().toLowerCase()
  if (q === 'en' || q === 'zh') return q
  const b = (brandingLocale ?? '').trim().toLowerCase()
  return b === 'en' ? 'en' : 'zh'
}

export function t(locale, key) {
  const dict = locale === 'en' ? en : zh
  return dict[key] ?? zh[key] ?? key
}
