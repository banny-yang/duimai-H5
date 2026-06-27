import { hasWxProfile, getStoredWxProfile } from './mp-login.js'
import { collectLocalBridgeAuth, saveMpBridgeAuth } from './mp-bridge-api.js'
import { exitMiniProgramAfterAuth } from './mp-exit.js'

/** 本地已有微信资料时，可静默回传第三方 */
export function canSilentMpAuthBridge() {
  return hasWxProfile()
}

/**
 * 静默授权：wx.login 取 code + 本地资料 → Toast → 回传并关闭
 * @returns {boolean} 是否已处理
 */
export async function trySilentMpAuthBridge(state) {
  if (!canSilentMpAuthBridge()) return false
  try {
    const stored = getStoredWxProfile()
    if (!stored) return false
    await finishMpAuthBridge(stored, { state })
    return true
  } catch {
    return false
  }
}

/** 授权成功：Toast → 回传 extraData → 关闭/返回第三方（不经对脉服务端） */
export async function finishMpAuthBridge(profile, options = {}) {
  const state = options.state
  const extraData = await collectLocalBridgeAuth(profile, state)
  saveMpBridgeAuth(extraData, state)
  uni.showToast({ title: '登录成功', icon: 'success', duration: 1500 })
  exitMiniProgramAfterAuth({
    delay: 1600,
    extraData,
  })
}
