/** 微信小程序转发 / 分享到朋友圈（须在页面注册 onShareAppMessage） */

export const DEFAULT_SHARE_TITLE = '对麦智能 · 选手助手'

export function buildRunnerSharePath(eventGuid) {
  const g = String(eventGuid || '').trim()
  if (!g) return '/pages/index'
  return `/pages/runner/runner?eventGuid=${encodeURIComponent(g)}`
}

export function buildRunnerShareQuery(eventGuid) {
  const g = String(eventGuid || '').trim()
  return g ? `eventGuid=${encodeURIComponent(g)}` : ''
}

export function buildRunnerShareTitle(eventName, brandTitle) {
  const name = String(brandTitle || eventName || '').trim()
  return name ? `${name} · 选手助手` : DEFAULT_SHARE_TITLE
}

/** 开启右上角「转发给朋友 / 分享到朋友圈」菜单 */
export function enableMpShareMenu() {
  // #ifdef MP-WEIXIN
  try {
    uni.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    })
  } catch {
    /* 低版本基础库忽略 */
  }
  // #endif
}
